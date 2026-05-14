// Configurável via meta tag, fallback pra host de produção.
const API_BASE =
  document.querySelector('meta[name="api-base"]')?.content || 'https://ecoback.treent.com.br'

const $ = (s, root = document) => root.querySelector(s)
const $$ = (s, root = document) => [...root.querySelectorAll(s)]

const state = {
  token: localStorage.getItem('eb_token') || null,
  user: null,
  cities: [],
  categories: [],
}

// ---------- HTTP -----------------------------------------------------------

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const init = { method, headers: { ...headers } }
  if (state.token) init.headers.Authorization = `Bearer ${state.token}`
  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  const res = await fetch(API_BASE + path, init)
  let payload = null
  if (res.status !== 204) {
    const text = await res.text()
    try {
      payload = text ? JSON.parse(text) : null
    } catch {
      payload = text
    }
  }
  if (!res.ok) {
    const msg = payload?.errors?.[0]?.message || `HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    err.payload = payload
    throw err
  }
  return payload
}

// ---------- UI helpers -----------------------------------------------------

function toast(msg, kind = 'ok') {
  const el = $('#toast')
  el.textContent = msg
  el.classList.toggle('error', kind === 'error')
  el.classList.remove('hidden')
  clearTimeout(toast.t)
  toast.t = setTimeout(() => el.classList.add('hidden'), 3500)
}

function activateTabs(scope) {
  $$('.tab', scope).forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab', scope).forEach((b) => b.classList.toggle('active', b === btn))
      const target = btn.dataset.tab
      $$('.tab-pane', scope).forEach((p) => p.classList.toggle('active', p.id === target))
      // Ensure map renders when switching to the occurrence tab
      if (target === 'newOccurrence' && typeof ensureMap === 'function') ensureMap()
    })
  })
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries())
}

// ---------- Auth state -----------------------------------------------------

function setSession({ token, user }) {
  if (token) {
    state.token = token
    localStorage.setItem('eb_token', token)
  }
  if (user) {
    state.user = user
  }
  renderSession()
}

function clearSession() {
  state.token = null
  state.user = null
  localStorage.removeItem('eb_token')
  localStorage.removeItem('eb_user_id')
  renderSession()
}

function renderSession() {
  const authed = !!state.token
  $('#authView').classList.toggle('hidden', authed)
  $('#appView').classList.toggle('hidden', !authed)
  $('#userBadge').classList.toggle('hidden', !authed)
  if (authed && state.user) {
    $('#userEmail').textContent = state.user.email
  }
}

// ---------- Reference data -------------------------------------------------

async function loadReferenceData() {
  const [cities, categories] = await Promise.all([
    api('/mobile/cities'),
    api('/mobile/occurrence-categories'),
  ])
  state.cities = cities.data
  state.categories = categories.data

  for (const sel of ['#signupCity', '#occCity']) {
    const el = $(sel)
    if (!el) continue
    el.innerHTML =
      '<option value="">Selecione...</option>' +
      state.cities.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')
  }
  const occCat = $('#occCat')
  if (occCat) {
    occCat.innerHTML =
      '<option value="">Selecione...</option>' +
      state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')
  }
}

// ---------- Auth flows -----------------------------------------------------

$('#signupForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const form = e.target
  const fd = new FormData(form)
  // Remove campos vazios opcionais.
  if (!fd.get('profile_photo') || fd.get('profile_photo').size === 0) {
    fd.delete('profile_photo')
  }
  try {
    const resp = await api('/mobile/signup', { method: 'POST', body: fd })
    setSession({ token: resp.token.value, user: resp.user })
    if (resp.user?.id) localStorage.setItem('eb_user_id', resp.user.id)
    toast('Conta criada!')
    await afterLogin()
  } catch (err) {
    toast(err.message, 'error')
  }
})

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  try {
    const data = formToObject(e.target)
    const resp = await api('/mobile/login', { method: 'POST', body: data })
    setSession({ token: resp.token.value })
    state.user = { email: data.email }
    renderSession()
    toast('Bem-vindo de volta!')
    await afterLogin()
  } catch (err) {
    toast(err.message, 'error')
  }
})

$('#forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  try {
    await api('/mobile/forgot-password', { method: 'POST', body: formToObject(e.target) })
    toast('Se o e-mail existir, uma nova senha foi enviada (veja no Mailpit em :18025).')
  } catch (err) {
    toast(err.message, 'error')
  }
})

$('#logoutBtn').addEventListener('click', () => {
  clearSession()
  toast('Desconectado')
})

async function afterLogin() {
  await loadReferenceData()
  await loadProfile()
  await loadOccurrences()
  ensureMap()
}

// ---------- Profile --------------------------------------------------------

async function loadProfile() {
  const userId = state.user?.id || localStorage.getItem('eb_user_id')
  const card = $('#profileCard')
  if (!userId) {
    card.innerHTML =
      '<div class="muted">Faça login pelo /signup nesta sessão para carregar seu perfil completo.</div>'
    return
  }
  try {
    const u = await api(`/mobile/users/${userId}`)
    localStorage.setItem('eb_user_id', userId)
    state.user = { ...state.user, ...u }
    $('#userEmail').textContent = u.email
    card.innerHTML = `
      <img src="${u.profile_photo_url || dataUrlInitials(u.email)}" alt="" />
      <div>
        <div><strong>${u.email}</strong></div>
        <div class="muted">${u.phone || ''}</div>
        <div class="muted">${u.city ? u.city.name + ' — IBGE ' + u.city.ibge_code : ''}</div>
        <div class="muted">Nascimento: ${u.birth_date || '—'}</div>
      </div>`
  } catch (err) {
    card.innerHTML = `<div class="muted">Erro ao carregar perfil: ${err.message}</div>`
  }
}

function dataUrlInitials(email = '?') {
  const initial = email[0]?.toUpperCase() ?? '?'
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
    <rect width='80' height='80' fill='#1d2727'/>
    <text x='50%' y='54%' font-family='system-ui,sans-serif' font-size='32' fill='#56d3a8' text-anchor='middle' dominant-baseline='middle'>${initial}</text>
  </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

// ---------- Photo upload (drag & drop + preview) -------------------------

let photoFiles = [] // File objects array, max 3

function renderPhotoPreviews() {
  const container = $('#photoPreviews')
  $('#photoCount').textContent = `${photoFiles.length}/3`

  container.innerHTML = photoFiles
    .map(
      (_, i) => `
      <div class="photo-preview" data-i="${i}">
        <img src="${URL.createObjectURL(photoFiles[i])}" alt="Foto ${i + 1}" />
        <button type="button" class="remove-photo" title="Remover">×</button>
      </div>`
    )
    .join('')

  $$('.remove-photo', container).forEach((btn) =>
    btn.addEventListener('click', (e) => {
      const idx = +e.target.closest('.photo-preview').dataset.i
      photoFiles.splice(idx, 1)
      renderPhotoPreviews()
    })
  )
}

function addPhotoFiles(files) {
  for (const file of files) {
    if (photoFiles.length >= 3) {
      toast('Máximo 3 fotos', 'error')
      break
    }
    if (file.size > 8 * 1024 * 1024) {
      toast(`${file.name} excede 8 MB`, 'error')
      continue
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast(`${file.name}: formato não suportado`, 'error')
      continue
    }
    photoFiles.push(file)
  }
  renderPhotoPreviews()
}

const dropzone = $('#photoDropzone')
const photoInput = $('#photoInput')

dropzone.addEventListener('click', () => photoInput.click())
photoInput.addEventListener('change', (e) => {
  addPhotoFiles(e.target.files)
  photoInput.value = ''
})
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropzone.classList.add('dragover')
})
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'))
dropzone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropzone.classList.remove('dragover')
  addPhotoFiles(e.dataTransfer.files)
})

// ---------- Coordinate map (Leaflet) --------------------------------------

let coordRows = []
let coordMap = null
let coordMarkers = []
let coordPolygon = null

function initCoordMap() {
  if (coordMap) return
  // Default: Manaus, AM
  coordMap = L.map('coordMap').setView([-3.119, -60.022], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(coordMap)

  coordMap.on('click', (e) => {
    if (coordRows.length >= 20) return toast('Máximo 20 coordenadas', 'error')
    coordRows.push({ lat: e.latlng.lat, lng: e.latlng.lng })
    syncMapMarkers()
  })
}

function syncMapMarkers() {
  // Clear existing
  coordMarkers.forEach((m) => coordMap.removeLayer(m))
  coordMarkers = []
  if (coordPolygon) {
    coordMap.removeLayer(coordPolygon)
    coordPolygon = null
  }

  const valid = coordRows.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))

  valid.forEach((c, i) => {
    const marker = L.marker([c.lat, c.lng], { draggable: true })
      .addTo(coordMap)
      .bindPopup(`Ponto ${i + 1}`)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      coordRows[i] = { lat: pos.lat, lng: pos.lng }
      syncMapMarkers()
    })
    coordMarkers.push(marker)
  })

  // Draw polygon if 2+ points
  if (valid.length >= 2) {
    const latlngs = valid.map((c) => [c.lat, c.lng])
    coordPolygon = L.polygon(latlngs, {
      color: '#56d3a8',
      fillColor: '#56d3a8',
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(coordMap)
  }

  // Fit bounds
  if (valid.length > 0) {
    const bounds = L.latLngBounds(valid.map((c) => [c.lat, c.lng]))
    coordMap.fitBounds(bounds.pad(0.3))
  }

  // Update count
  $('#coordCount').textContent = `${valid.length} ponto${valid.length !== 1 ? 's' : ''}`

  // Render text list
  renderCoordRows()
}

function renderCoordRows() {
  const list = $('#coordList')
  if (coordRows.length === 0) {
    list.innerHTML = ''
    return
  }
  list.innerHTML = coordRows
    .map(
      (c, i) => `
      <div class="coord-row" data-i="${i}">
        <input type="number" step="any" placeholder="latitude" value="${c.lat?.toFixed(6) ?? ''}" data-k="lat" />
        <input type="number" step="any" placeholder="longitude" value="${c.lng?.toFixed(6) ?? ''}" data-k="lng" />
        <button type="button" class="x" title="remover">×</button>
      </div>`
    )
    .join('')
  $$('.coord-row input', list).forEach((inp) =>
    inp.addEventListener('change', (e) => {
      const idx = +e.target.closest('.coord-row').dataset.i
      coordRows[idx][e.target.dataset.k] = e.target.value === '' ? null : Number(e.target.value)
      syncMapMarkers()
    })
  )
  $$('.coord-row .x', list).forEach((btn) =>
    btn.addEventListener('click', (e) => {
      const idx = +e.target.closest('.coord-row').dataset.i
      coordRows.splice(idx, 1)
      syncMapMarkers()
    })
  )
}

$('#addCoordBtn').addEventListener('click', () => {
  if (coordRows.length >= 20) return toast('Máximo 20 coordenadas', 'error')
  coordRows.push({ lat: null, lng: null })
  renderCoordRows()
})

$('#clearCoordsBtn').addEventListener('click', () => {
  coordRows = []
  syncMapMarkers()
})

$('#useGeoBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return toast('Geolocalização não suportada', 'error')
  toast('Obtendo localização...')
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords
      coordRows.push({ lat, lng })
      initCoordMap()
      coordMap.setView([lat, lng], 16)
      coordMap.invalidateSize()
      syncMapMarkers()
      toast('Localização adicionada!')
    },
    (err) => toast(err.message, 'error'),
    { enableHighAccuracy: true }
  )
})

// Init map when the newOccurrence tab becomes visible
function ensureMap() {
  if (!$('#newOccurrence').classList.contains('active')) return
  setTimeout(() => {
    initCoordMap()
    if (coordMap) coordMap.invalidateSize()
  }, 150)
}

// Watch for tab switches
const observer = new MutationObserver(ensureMap)
observer.observe($('#newOccurrence'), { attributes: true, attributeFilter: ['class'] })

// ---------- Occurrence submit ---------------------------------------------

$('#occurrenceForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const form = e.target
  const fd = new FormData(form)

  // Photos from our managed array (not from the form's file input)
  if (photoFiles.length === 0) return toast('Adicione pelo menos uma foto', 'error')
  // Remove any stale file input entries
  fd.delete('photos')
  photoFiles.forEach((f) => fd.append('photos', f))

  const coords = coordRows.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
  if (coords.length === 0) return toast('Adicione pelo menos uma coordenada no mapa', 'error')
  fd.set('coordinates', JSON.stringify(coords))

  try {
    await api('/mobile/occurrences', { method: 'POST', body: fd })
    form.reset()
    coordRows = []
    photoFiles = []
    renderPhotoPreviews()
    syncMapMarkers()
    toast('Ocorrência registrada!')
    await loadOccurrences()
    $$('.tab', $('#appView')).find((t) => t.dataset.tab === 'myOccurrences').click()
  } catch (err) {
    toast(err.message, 'error')
  }
})

async function loadOccurrences() {
  const list = $('#occList')
  list.innerHTML = '<div class="muted">carregando...</div>'
  try {
    const resp = await api('/mobile/occurrences?per_page=50')
    if (!resp.data.length) {
      list.innerHTML = '<div class="muted">Nenhuma ocorrência ainda.</div>'
      return
    }
    list.innerHTML = resp.data
      .map(
        (o) => `
      <div class="occ-card">
        <div class="occ-head">
          <strong>${escapeHtml(o.street)}, ${escapeHtml(o.address)}</strong>
          <span class="occ-cat">${escapeHtml(o.category?.name || '—')}</span>
        </div>
        <div class="muted">
          ${escapeHtml(o.neighborhood)} · CEP ${escapeHtml(o.cep)} · ${escapeHtml(o.city?.name || '')}
        </div>
        ${o.observation ? `<div>${escapeHtml(o.observation)}</div>` : ''}
        <div class="occ-thumbs">
          ${o.photos.map((p) => `<img src="${p.url}" alt="" />`).join('')}
        </div>
        <div class="muted" style="font-size:12px">
          ${o.coordinates.length} coordenada${o.coordinates.length === 1 ? '' : 's'} · criado em ${new Date(o.created_at).toLocaleString('pt-BR')}
        </div>
      </div>`
      )
      .join('')
  } catch (err) {
    list.innerHTML = `<div class="muted">Erro: ${escapeHtml(err.message)}</div>`
  }
}

$('#refreshBtn').addEventListener('click', loadOccurrences)

function escapeHtml(s) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
}

// ---------- Boot -----------------------------------------------------------

activateTabs($('#authView'))
activateTabs($('#appView'))

;(async () => {
  // Pré-carrega cidades pra mostrar na tela de signup mesmo sem login.
  try {
    await loadReferenceData()
  } catch {
    // API offline; mantém UI funcional para login.
  }
  if (state.token) {
    renderSession()
    await afterLogin()
  }
})()
