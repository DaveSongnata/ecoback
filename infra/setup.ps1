#requires -Version 5.1
<#
.SYNOPSIS
  Cria/atualiza os arquivos .env do stack. Idempotente. Equivalente Windows do setup.sh.

.EXAMPLE
  .\setup.ps1 dev
  .\setup.ps1 prod
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('dev', 'prod')]
    [string]$Mode
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

if ($Mode -eq 'dev') {
    $template = '.env.dev.example'
    $target   = '.env.dev'
}
else {
    $template = '.env.example'
    $target   = '.env'
}

if (-not (Test-Path -LiteralPath $template)) {
    Write-Error "template ausente: $template"
    exit 1
}

# 1. Cria o target se não existir.
if (-not (Test-Path -LiteralPath $target)) {
    Copy-Item -LiteralPath $template -Destination $target
    Write-Host "criado: $target"
}
else {
    Write-Host "mantido: $target (já existia)"
}

# 2. Gera APP_KEY se estiver vazia.
$content = Get-Content -LiteralPath $target -Raw
# `(?m)` = multiline; bate a linha exata "APP_KEY=" com nada (ou só whitespace).
if ($content -match '(?m)^APP_KEY=\s*$') {
    $bytes = New-Object byte[] 24
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    # base64 url-safe + sem padding, 32 chars.
    $key = ([Convert]::ToBase64String($bytes)) -replace '\+', '-' -replace '/', '_' -replace '=', ''
    if ($key.Length -gt 32) { $key = $key.Substring(0, 32) }

    $newContent = [System.Text.RegularExpressions.Regex]::Replace(
        $content,
        '(?m)^APP_KEY=.*$',
        "APP_KEY=$key"
    )
    # `Set-Content -NoNewline` para não acrescentar linha em branco no fim.
    Set-Content -LiteralPath $target -Value $newContent -NoNewline -Encoding utf8
    Write-Host "APP_KEY gerada em $target"
}
else {
    Write-Host "APP_KEY já presente em $target"
}

# 3. Em prod, mostra o que ainda está vazio.
if ($Mode -eq 'prod') {
    $vars = @(
        'DATABASE_URL', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET', 'R2_PUBLIC_URL', 'SMTP_HOST', 'MAIL_FROM_ADDRESS'
    )
    $placeholderDb = 'USER:PASSWORD@HOST:6543/postgres?sslmode=require'
    $missing = @()

    foreach ($v in $vars) {
        $line = Get-Content -LiteralPath $target | Where-Object { $_ -match "^$v=" } | Select-Object -First 1
        $val = ''
        if ($line) { $val = ($line -split '=', 2)[1] }
        if (-not $val.Trim() -or $val.Contains($placeholderDb)) {
            $missing += $v
        }
    }

    if ($missing.Count -gt 0) {
        Write-Host ''
        Write-Host 'ATENÇÃO: edite infra\.env e preencha:'
        foreach ($v in $missing) { Write-Host "  - $v" }
        Write-Host ''
        Write-Host 'Sem isso a API sobe mas vai falhar nas chamadas que dependem de cada serviço.'
    }
}
