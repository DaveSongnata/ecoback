import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Occurrence } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  em_analise: 'Em análise',
  aprovada: 'Aprovada',
  cancelada: 'Cancelada',
  concluida: 'Concluída',
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export function generateOccurrencesPdf(occurrences: Occurrence[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header
  doc.setFontSize(18)
  doc.setTextColor(21, 91, 91) // primary-base
  doc.text('EcoAmazônia', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(102, 102, 102) // gray-300
  doc.text('Relatório de Ocorrências', 14, 24)
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 29)
  doc.text(`Total: ${occurrences.length} ocorrência(s)`, 14, 34)

  // Line separator
  doc.setDrawColor(21, 91, 91)
  doc.setLineWidth(0.5)
  doc.line(14, 37, 283, 37)

  // Table
  const tableData = occurrences.map((o) => [
    o.id.slice(0, 8).toUpperCase(),
    STATUS_LABELS[o.status] ?? o.status,
    o.category?.name ?? '-',
    o.neighborhood ?? '-',
    o.street ?? '-',
    o.city?.name ?? '-',
    o.user?.email ?? '-',
    formatDate(o.created_at),
    o.response?.team_name ?? '-',
    o.response?.scheduled_date ? formatDate(o.response.scheduled_date) : '-',
  ])

  autoTable(doc, {
    startY: 41,
    head: [[
      'ID',
      'Status',
      'Categoria',
      'Bairro',
      'Rua',
      'Cidade',
      'Reportado por',
      'Criado em',
      'Equipe',
      'Agendado',
    ]],
    body: tableData,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [29, 29, 29],
    },
    headStyles: {
      fillColor: [21, 91, 91],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [246, 245, 247], // background
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 22 },
    },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(173, 173, 173)
    doc.text(
      `EcoAmazônia · Painel da Prefeitura · Página ${i} de ${pageCount}`,
      148,
      doc.internal.pageSize.height - 8,
      { align: 'center' },
    )
  }

  doc.save(`ecoamazonia-ocorrencias-${new Date().toISOString().slice(0, 10)}.pdf`)
}
