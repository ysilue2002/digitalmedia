$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "..\\public\\og") | Out-Null

try {
  Add-Type -AssemblyName System.Drawing | Out-Null
} catch {
  throw "System.Drawing n'est pas disponible sur cet environnement."
}

$w = 1200
$h = 630

function New-QdayOgCard {
  param(
    [Parameter(Mandatory = $true)][string]$OutPath,
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][bool]$IsVideo
  )

  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $c1 = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)
  $c2 = [System.Drawing.Color]::FromArgb(255, 2, 6, 23)
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 35)
  $g.FillRectangle($bg, $rect)

  $overlay = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(210, 0, 0, 0),
    [System.Drawing.Color]::FromArgb(10, 0, 0, 0),
    90
  )
  $g.FillRectangle($overlay, $rect)

  $panelRect = New-Object System.Drawing.Rectangle 70, 85, 1060, 460
  $panelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 3, 7, 18))
  $g.FillRectangle($panelBrush, $panelRect)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 16, 185, 129), 6)
  $g.DrawRectangle($pen, $panelRect)

  $qFont = New-Object System.Drawing.Font("Segoe UI", 92, [System.Drawing.FontStyle]::Bold)
  $qBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 240, 253, 250))
  $g.DrawString("QDAY", $qFont, $qBrush, 120, 155)

  $tagFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
  $tagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 167, 243, 208))
  $g.DrawString($Label.ToUpperInvariant(), $tagFont, $tagBrush, 125, 275)

  if ($IsVideo) {
    $playX = 900
    $playY = 190
    $playW = 170
    $playH = 170
    $circlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 240, 253, 250), 10)
    $g.DrawEllipse($circlePen, $playX, $playY, $playW, $playH)
    $tri = New-Object "System.Drawing.Point[]" 3
    $tri[0] = New-Object System.Drawing.Point ($playX + 65), ($playY + 45)
    $tri[1] = New-Object System.Drawing.Point ($playX + 65), ($playY + 125)
    $tri[2] = New-Object System.Drawing.Point ($playX + 135), ($playY + 85)
    $triBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 240, 253, 250))
    $g.FillPolygon($triBrush, $tri)
  }

  $sFont = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Regular)
  $sBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 203, 213, 225))
  $g.DrawString("Ton avis en 30 secondes. Pseudo + reponse + debat direct.", $sFont, $sBrush, 125, 355)

  $smallFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular)
  $smallBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
  $g.DrawString("digitalmedia-s6ax.onrender.com", $smallFont, $smallBrush, 125, 410)

  $abs = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutPath)
  $bmp.Save($abs, [System.Drawing.Imaging.ImageFormat]::Png)

  $g.Dispose()
  $bmp.Dispose()
}

New-QdayOgCard -OutPath (Join-Path $PSScriptRoot "..\\public\\og\\video-card.png") -Label "Media du jour (video)" -IsVideo $true
New-QdayOgCard -OutPath (Join-Path $PSScriptRoot "..\\public\\og\\text-card.png") -Label "Question du jour" -IsVideo $false

Write-Host "OK: public/og/video-card.png"
Write-Host "OK: public/og/text-card.png"
