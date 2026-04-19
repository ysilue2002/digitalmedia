param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("word", "ppt")]
  [string]$Mode,

  [Parameter(Mandatory = $true)]
  [string]$CourseJsonPath,

  [Parameter(Mandatory = $true)]
  [string]$OutFile,

  [string]$TemplatePath = "",
  [string]$ImagePath = "",
  [switch]$ExportPdf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-Json([string]$p) {
  if (-not (Test-Path -LiteralPath $p)) { throw "Course JSON introuvable: $p" }
  (Get-Content -LiteralPath $p -Raw -Encoding UTF8) | ConvertFrom-Json -Depth 60
}

function Ensure-ParentDir([string]$FilePath) {
  $dir = Split-Path -Parent $FilePath
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

function Replace-Placeholders-Word($doc, $map) {
  foreach ($k in $map.Keys) {
    $find = $doc.Content.Find
    $find.ClearFormatting() | Out-Null
    $find.Replacement.ClearFormatting() | Out-Null
    $find.Text = $k
    $find.Replacement.Text = [string]$map[$k]
    $null = $find.Execute($k, $false, $true, $false, $false, $false, $true, 1, $false, [string]$map[$k], 2)
  }
}

function Add-Heading($sel, [string]$text, [int]$level) {
  $style = if ($level -le 1) { "Heading 1" } elseif ($level -eq 2) { "Heading 2" } else { "Heading 3" }
  $sel.Style = $style
  $sel.TypeText($text)
  $sel.TypeParagraph() | Out-Null
}

function Add-Bullets($sel, $items) {
  $arr = @()
  if ($items) { $arr = @($items) }
  if ($arr.Count -eq 0) { return }
  $sel.Range.ListFormat.ApplyBulletDefault()
  foreach ($b in $arr) {
    if ($null -eq $b) { continue }
    $sel.TypeText([string]$b)
    $sel.TypeParagraph() | Out-Null
  }
  $sel.Range.ListFormat.RemoveNumbers()
  $sel.TypeParagraph() | Out-Null
}

function New-Word-FromCourse($course, [string]$outFile, [string]$templatePath, [string]$imagePath, [bool]$exportPdf) {
  Ensure-ParentDir $outFile

  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  try {
    $doc = $null
    if ($templatePath -and (Test-Path -LiteralPath $templatePath)) {
      $doc = $word.Documents.Open($templatePath, $false, $false)
    } else {
      $doc = $word.Documents.Add()
    }

    # Placeholder mapping (for template usage)
    $map = @{
      "{{TITLE}}" = [string]$course.title
      "{{SUBJECT}}" = [string]$course.subject
      "{{TOPIC}}" = [string]$course.topic
      "{{DURATION}}" = ([string]$course.meta.durationMin + " min")
      "{{METHODOLOGY}}" = [string]$course.meta.methodology
      "{{OBJECTIVES}}" = (($course.learningObjectives | ForEach-Object { "- " + $_ }) -join "`r`n")
      "{{COMPETENCIES}}" = (($course.competencies | ForEach-Object { "- " + $_ }) -join "`r`n")
      "{{PREREQUISITES}}" = (($course.prerequisites | ForEach-Object { "- " + $_ }) -join "`r`n")
      "{{MATERIALS}}" = (($course.materials | ForEach-Object { "- " + $_ }) -join "`r`n")
      "{{HOMEWORK}}" = (($course.homeworkOrExtension | ForEach-Object { "- " + $_ }) -join "`r`n")
      "{{REFERENCES}}" = (($course.references | ForEach-Object { "- " + $_ }) -join "`r`n")
    }
    Replace-Placeholders-Word -doc $doc -map $map

    # If no template (or template without placeholders), append a full structured doc.
    if (-not $templatePath) {
      $sel = $word.Selection
      $sel.Style = "Title"
      $sel.TypeText([string]$course.title)
      $sel.TypeParagraph() | Out-Null
      $sel.TypeParagraph() | Out-Null

      Add-Heading $sel "Informations" 1
      Add-Bullets $sel @(
        ("Niveau: " + [string]$course.meta.level),
        ("Pays: " + [string]$course.meta.country),
        ("Langue: " + [string]$course.meta.language),
        ("Méthodologie: " + [string]$course.meta.methodology),
        ("Durée: " + [string]$course.meta.durationMin + " min")
      )

      Add-Heading $sel "Objectifs d'apprentissage" 1
      Add-Bullets $sel $course.learningObjectives

      if ($course.competencies -and @($course.competencies).Count -gt 0) {
        Add-Heading $sel "Compétences" 1
        Add-Bullets $sel $course.competencies
      }
      if ($course.prerequisites -and @($course.prerequisites).Count -gt 0) {
        Add-Heading $sel "Prérequis" 1
        Add-Bullets $sel $course.prerequisites
      }

      Add-Heading $sel "Déroulement (phases)" 1
      foreach ($p in @($course.lessonFlow)) {
        Add-Heading $sel ([string]$p.phase + " — " + [string]$p.minutes + " min") 2
        Add-Heading $sel "Rôle de l’enseignant" 3
        Add-Bullets $sel $p.teacher
        Add-Heading $sel "Activités des apprenants" 3
        Add-Bullets $sel $p.learners
        if ($p.assessment) {
          Add-Heading $sel "Évaluation/Traces" 3
          Add-Bullets $sel $p.assessment
        }
      }

      if ($course.activities -and @($course.activities).Count -gt 0) {
        Add-Heading $sel "Activités détaillées" 1
        foreach ($a in @($course.activities)) {
          Add-Heading $sel ([string]$a.name) 2
          Add-Bullets $sel $a.instructions
          $sel.Style = "Normal"
          $sel.TypeText("Production attendue: " + [string]$a.expectedOutput)
          $sel.TypeParagraph() | Out-Null
          $sel.TypeParagraph() | Out-Null
        }
      }

      Add-Heading $sel "Évaluation" 1
      if ($course.evaluation.diagnostic) { Add-Heading $sel "Diagnostique" 2; Add-Bullets $sel $course.evaluation.diagnostic }
      if ($course.evaluation.formative) { Add-Heading $sel "Formative" 2; Add-Bullets $sel $course.evaluation.formative }
      if ($course.evaluation.summative) { Add-Heading $sel "Somma­tive" 2; Add-Bullets $sel $course.evaluation.summative }

      if ($course.remediation) { Add-Heading $sel "Remédiation" 1; Add-Bullets $sel $course.remediation }
      if ($course.homeworkOrExtension) { Add-Heading $sel "Devoir / Prolongement" 1; Add-Bullets $sel $course.homeworkOrExtension }
      if ($course.references) { Add-Heading $sel "Références" 1; Add-Bullets $sel $course.references }
    }

    # Insert image if provided: replace placeholder {{IMAGE_1}} if exists, else append at end.
    if ($imagePath -and (Test-Path -LiteralPath $imagePath)) {
      $range = $doc.Content
      $find = $range.Find
      $find.Text = "{{IMAGE_1}}"
      $found = $find.Execute()
      if ($found) {
        $range = $doc.Application.Selection.Range
        $doc.InlineShapes.AddPicture($imagePath, $false, $true, $range) | Out-Null
      } else {
        $sel = $word.Selection
        $sel.EndKey(6) | Out-Null # wdStory
        $sel.TypeParagraph() | Out-Null
        $doc.InlineShapes.AddPicture($imagePath, $false, $true) | Out-Null
      }
    }

    $doc.SaveAs([ref]$outFile, [ref]16) | Out-Null

    if ($exportPdf) {
      $pdf = [System.IO.Path]::ChangeExtension($outFile, ".pdf")
      # 17 = wdFormatPDF
      $doc.SaveAs([ref]$pdf, [ref]17) | Out-Null
    }
    $doc.Close($false)
  } finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word) | Out-Null
  }
}

function Replace-Placeholders-Ppt($pres, $map) {
  foreach ($slide in $pres.Slides) {
    foreach ($shape in $slide.Shapes) {
      try {
        if (-not $shape.HasTextFrame) { continue }
        if (-not $shape.TextFrame.HasText) { continue }
        $text = [string]$shape.TextFrame.TextRange.Text
        foreach ($k in $map.Keys) {
          $text = $text.Replace($k, [string]$map[$k])
        }
        $shape.TextFrame.TextRange.Text = $text
      } catch { }
    }
  }
}

function New-Ppt-FromCourse($course, [string]$outFile, [string]$templatePath, [string]$imagePath, [bool]$exportPdf) {
  Ensure-ParentDir $outFile

  $ppt = New-Object -ComObject PowerPoint.Application
  try {
    $pres = $null
    if ($templatePath -and (Test-Path -LiteralPath $templatePath)) {
      $pres = $ppt.Presentations.Open($templatePath, $true, $true, $false)
    } else {
      $pres = $ppt.Presentations.Add()
    }

    $map = @{
      "{{TITLE}}" = [string]$course.title
      "{{SUBJECT}}" = [string]$course.subject
      "{{TOPIC}}" = [string]$course.topic
      "{{DURATION}}" = ([string]$course.meta.durationMin + " min")
      "{{METHODOLOGY}}" = [string]$course.meta.methodology
    }
    Replace-Placeholders-Ppt -pres $pres -map $map

    if (-not $templatePath) {
      # Title slide
      $s1 = $pres.Slides.Add(1, 1) # ppLayoutTitle
      $s1.Shapes.Title.TextFrame.TextRange.Text = [string]$course.title
      $s1.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = ([string]$course.subject + " · " + [string]$course.topic)

      # Objectives
      $s2 = $pres.Slides.Add(2, 2) # ppLayoutText
      $s2.Shapes.Title.TextFrame.TextRange.Text = "Objectifs"
      $tf = $s2.Shapes.Placeholders.Item(2).TextFrame.TextRange
      $tf.Text = ""
      foreach ($o in @($course.learningObjectives)) { $null = $tf.InsertAfter([string]$o + "`r`n") }

      # Flow
      $idx = 3
      foreach ($p in @($course.lessonFlow)) {
        $sl = $pres.Slides.Add($idx, 2)
        $sl.Shapes.Title.TextFrame.TextRange.Text = ([string]$p.phase + " (" + [string]$p.minutes + " min)")
        $t2 = $sl.Shapes.Placeholders.Item(2).TextFrame.TextRange
        $t2.Text = ""
        foreach ($a in @($p.learners)) { $null = $t2.InsertAfter("• " + [string]$a + "`r`n") }
        $idx++
      }

      # Evaluation
      $se = $pres.Slides.Add($idx, 2)
      $se.Shapes.Title.TextFrame.TextRange.Text = "Évaluation"
      $te = $se.Shapes.Placeholders.Item(2).TextFrame.TextRange
      $te.Text = ""
      foreach ($x in @($course.evaluation.summative)) { $null = $te.InsertAfter("• " + [string]$x + "`r`n") }
    }

    # Insert image on second slide if possible
    if ($imagePath -and (Test-Path -LiteralPath $imagePath)) {
      try {
        $slideIndex = [Math]::Min(2, $pres.Slides.Count)
        $sl = $pres.Slides.Item($slideIndex)
        $sl.Shapes.AddPicture($imagePath, $false, $true, 380, 140, 260, 260) | Out-Null
      } catch { }
    }

    $pres.SaveAs($outFile)
    if ($exportPdf) {
      $pdf = [System.IO.Path]::ChangeExtension($outFile, ".pdf")
      # 32 = ppSaveAsPDF
      $pres.SaveAs($pdf, 32)
    }
    $pres.Close()
  } finally {
    $ppt.Quit()
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($ppt) | Out-Null
  }
}

$course = Read-Json $CourseJsonPath
Ensure-ParentDir $OutFile

if ($Mode -eq "word") {
  New-Word-FromCourse -course $course -outFile $OutFile -templatePath $TemplatePath -imagePath $ImagePath -exportPdf ([bool]$ExportPdf)
} else {
  New-Ppt-FromCourse -course $course -outFile $OutFile -templatePath $TemplatePath -imagePath $ImagePath -exportPdf ([bool]$ExportPdf)
}
