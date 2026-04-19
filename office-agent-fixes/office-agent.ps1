param(
  [Parameter(Mandatory = $true)]
  [string]$TaskJsonPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-JsonFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "Task JSON introuvable: $Path" }
  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  return $raw | ConvertFrom-Json -Depth 50
}

function Ensure-ParentDir([string]$FilePath) {
  $dir = Split-Path -Parent $FilePath
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

function New-WordDocFromSections($task, [string]$outFile) {
  Ensure-ParentDir $outFile

  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  try {
    $doc = $word.Documents.Add()

    $sel = $word.Selection

    if ($task.input.title) {
      $sel.Style = "Title"
      $sel.TypeText([string]$task.input.title)
      $sel.TypeParagraph() | Out-Null
      $sel.TypeParagraph() | Out-Null
    }

    foreach ($sec in ($task.input.sections | ForEach-Object { $_ })) {
      if ($sec.heading) {
        $sel.Style = "Heading 1"
        $sel.TypeText([string]$sec.heading)
        $sel.TypeParagraph() | Out-Null
      }

      foreach ($p in ($sec.paragraphs | ForEach-Object { $_ })) {
        if ($null -eq $p) { continue }
        $sel.Style = "Normal"
        $sel.TypeText([string]$p)
        $sel.TypeParagraph() | Out-Null
      }

      $bullets = @()
      if ($sec.bullets) { $bullets = @($sec.bullets) }
      if ($bullets.Count -gt 0) {
        $sel.Range.ListFormat.ApplyBulletDefault()
        foreach ($b in $bullets) {
          if ($null -eq $b) { continue }
          $sel.TypeText([string]$b)
          $sel.TypeParagraph() | Out-Null
        }
        $sel.Range.ListFormat.RemoveNumbers()
      }

      $sel.TypeParagraph() | Out-Null
    }

    $doc.SaveAs([ref]$outFile, [ref]16) | Out-Null  # 16 = wdFormatDocumentDefault (.docx)
    $doc.Close()
  } finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word) | Out-Null
  }
}

function Pdf-ToWordOrText($task, [string]$outFile, [ValidateSet("docx", "txt")] [string]$mode) {
  $pdfPath = [string]$task.input.path
  if (-not $pdfPath) { throw "input.path manquant (PDF)" }
  if (-not (Test-Path -LiteralPath $pdfPath)) { throw "PDF introuvable: $pdfPath" }

  Ensure-ParentDir $outFile

  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  try {
    # Open as read-only to avoid prompts
    $doc = $word.Documents.Open($pdfPath, $false, $true)

    if ($mode -eq "docx") {
      $doc.SaveAs([ref]$outFile, [ref]16) | Out-Null  # docx
    } else {
      # 7 = wdFormatUnicodeText (txt)
      $doc.SaveAs([ref]$outFile, [ref]7) | Out-Null
    }

    $doc.Close($false)
  } finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word) | Out-Null
  }
}

function New-ExcelFromTable($task, [string]$outFile) {
  Ensure-ParentDir $outFile

  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false
  try {
    $wb = $excel.Workbooks.Add()
    $ws = $wb.Worksheets.Item(1)
    $ws.Name = if ($task.input.sheetName) { [string]$task.input.sheetName } else { "Sheet1" }

    $cols = @()
    if ($task.input.columns) { $cols = @($task.input.columns) }
    $rows = @()
    if ($task.input.rows) { $rows = @($task.input.rows) }

    $r = 1
    if ($cols.Count -gt 0) {
      for ($c = 0; $c -lt $cols.Count; $c++) {
        $ws.Cells.Item($r, $c + 1).Value2 = [string]$cols[$c]
        $ws.Cells.Item($r, $c + 1).Font.Bold = $true
      }
      $r++
    }

    foreach ($row in $rows) {
      $arr = @($row)
      for ($c = 0; $c -lt $arr.Count; $c++) {
        $ws.Cells.Item($r, $c + 1).Value2 = [string]$arr[$c]
      }
      $r++
    }

    $ws.UsedRange.EntireColumn.AutoFit() | Out-Null
    $wb.SaveAs($outFile)
    $wb.Close($true)
  } finally {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($excel) | Out-Null
  }
}

function New-PowerPointFromSlides($task, [string]$outFile) {
  Ensure-ParentDir $outFile

  $ppt = New-Object -ComObject PowerPoint.Application
  try {
    $pres = $ppt.Presentations.Add()

    # Title slide (layout 1) if title provided
    if ($task.input.title) {
      $slide1 = $pres.Slides.Add(1, 1)
      $slide1.Shapes.Title.TextFrame.TextRange.Text = [string]$task.input.title
    }

    $slides = @()
    if ($task.input.slides) { $slides = @($task.input.slides) }

    $index = $pres.Slides.Count + 1
    foreach ($s in $slides) {
      $slide = $pres.Slides.Add($index, 2) # 2 = ppLayoutText
      if ($s.title) { $slide.Shapes.Title.TextFrame.TextRange.Text = [string]$s.title }

      $bullets = @()
      if ($s.bullets) { $bullets = @($s.bullets) }
      if ($bullets.Count -gt 0) {
        $tf = $slide.Shapes.Placeholders.Item(2).TextFrame.TextRange
        $tf.Text = ""
        foreach ($b in $bullets) {
          if ($null -eq $b) { continue }
          $tf.InsertAfter([string]$b + "`r`n") | Out-Null
        }
      }
      $index++
    }

    $pres.SaveAs($outFile)
    $pres.Close()
  } finally {
    $ppt.Quit()
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($ppt) | Out-Null
  }
}

function New-EmlDraft($task, [string]$outFile) {
  Ensure-ParentDir $outFile

  $to = ""
  if ($task.input.to) { $to = (@($task.input.to) -join ", ") }
  $subject = if ($task.input.subject) { [string]$task.input.subject } else { "" }

  $bodyLines = @()
  if ($task.input.body.greeting) { $bodyLines += [string]$task.input.body.greeting }
  $bodyLines += ""
  foreach ($p in ($task.input.body.paragraphs | ForEach-Object { $_ })) {
    if ($null -eq $p) { continue }
    $bodyLines += [string]$p
    $bodyLines += ""
  }
  if ($task.input.body.signature) { $bodyLines += [string]$task.input.body.signature }
  $body = ($bodyLines -join "`r`n").TrimEnd()

  $eml = @(
    "To: $to",
    "Subject: $subject",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    $body,
    ""
  ) -join "`r`n"

  Set-Content -LiteralPath $outFile -Value $eml -Encoding UTF8
}

function New-OutlookDraftMsg($task, [string]$outFile) {
  Ensure-ParentDir $outFile

  $outlook = New-ComObjectWithRetry -ProgId "Outlook.Application"
  try {
    $mail = $outlook.CreateItem(0) # 0 = olMailItem

    if ($task.input.to) { $mail.To = (@($task.input.to) -join "; ") }
    if ($task.input.cc) { $mail.CC = (@($task.input.cc) -join "; ") }
    if ($task.input.bcc) { $mail.BCC = (@($task.input.bcc) -join "; ") }
    if ($task.input.subject) { $mail.Subject = [string]$task.input.subject }

    # Simple text body (draft mode). HTML could be added later.
    $bodyLines = @()
    if ($task.input.body.greeting) { $bodyLines += [string]$task.input.body.greeting }
    $bodyLines += ""
    foreach ($p in ($task.input.body.paragraphs | ForEach-Object { $_ })) {
      if ($null -eq $p) { continue }
      $bodyLines += [string]$p
      $bodyLines += ""
    }
    if ($task.input.body.signature) { $bodyLines += [string]$task.input.body.signature }
    $mail.Body = ($bodyLines -join "`r`n").TrimEnd()

    # Save to Drafts in current Outlook profile
    $mail.Save() | Out-Null

    # Also save a .msg file (portable draft artifact)
    $mail.SaveAs($outFile, 3) | Out-Null  # 3 = olMSG
  } finally {
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($outlook) | Out-Null
  }
}

function Read-OutlookMailsToJson($task, [string]$outFile) {
  Ensure-ParentDir $outFile

  $folderName = if ($task.input.folder) { [string]$task.input.folder } else { "Inbox" }
  $max = 20
  if ($task.input.max) { $max = [int]$task.input.max }
  if ($max -lt 1) { $max = 1 }
  if ($max -gt 200) { $max = 200 }

  $unreadOnly = $false
  if ($null -ne $task.input.unreadOnly) { $unreadOnly = [bool]$task.input.unreadOnly }

  $includeBody = $false
  if ($null -ne $task.input.includeBody) { $includeBody = [bool]$task.input.includeBody }

  $outlook = New-ComObjectWithRetry -ProgId "Outlook.Application"
  try {
    try {
      $ns = $outlook.GetNamespace("MAPI")
    } catch {
      throw "Outlook indisponible. Ouvre Outlook Desktop, connecte-toi à ton compte, puis réessaie."
    }

    try {
      # Default folders: Inbox=6, Sent=5, Drafts=16
      $folder = $null
      switch -Regex ($folderName.Trim()) {
        '^(?i)inbox$' { $folder = $ns.GetDefaultFolder(6); break }
        '^(?i)sent$|^(?i)sentitems$' { $folder = $ns.GetDefaultFolder(5); break }
        '^(?i)drafts$' { $folder = $ns.GetDefaultFolder(16); break }
        default { throw "Dossier non supporté: $folderName (utilise Inbox, SentItems, Drafts)" }
      }
    } catch {
      $m = $_.Exception.Message
      if ($m -match "n'êtes pas connecté" -or $m -match "not logged on" -or $m -match "Vous n'êtes pas connecté") {
        throw "Outlook n'est pas connecté. Ouvre Outlook Desktop, connecte-toi, attends la synchronisation, puis relance."
      }
      throw
    }

    try {
      $items = $folder.Items
    } catch {
      $m = $_.Exception.Message
      if ($m -match "n'êtes pas connecté" -or $m -match "not logged on" -or $m -match "Vous n'êtes pas connecté") {
        throw "Outlook n'est pas connecté. Ouvre Outlook Desktop, connecte-toi, attends la synchronisation, puis relance la lecture des mails."
      }
      throw
    }
    try {
      $items.Sort("[ReceivedTime]", $true) | Out-Null
    } catch {
      $m = $_.Exception.Message
      if ($m -match "n'êtes pas connecté" -or $m -match "not logged on" -or $m -match "Vous n'êtes pas connecté") {
        throw "Outlook n'est pas connecté. Ouvre Outlook Desktop, connecte-toi, attends la synchronisation, puis relance."
      }
      throw
    }

    $result = New-Object System.Collections.Generic.List[object]
    $count = 0

    foreach ($it in $items) {
      # Only mail items
      try {
        if ($it.Class -ne 43) { continue } # 43 = olMail
      } catch { continue }

      if ($unreadOnly) {
        try { if (-not $it.UnRead) { continue } } catch { continue }
      }

      $entryId = $null
      $subject = $null
      $senderName = $null
      $senderEmail = $null
      $received = $null
      $unread = $null
      $bodyPreview = $null
      $body = $null

      try { $entryId = [string]$it.EntryID } catch {}
      try { $subject = [string]$it.Subject } catch {}
      try { $senderName = [string]$it.SenderName } catch {}
      try { $senderEmail = [string]$it.SenderEmailAddress } catch {}
      try { $received = ($it.ReceivedTime).ToString("o") } catch {}
      try { $unread = [bool]$it.UnRead } catch { $unread = $null }

      try {
        if ($it.Body) {
          $b = [string]$it.Body
          if ($b.Length -gt 600) { $bodyPreview = $b.Substring(0, 600) } else { $bodyPreview = $b }
          if ($includeBody) { $body = $b }
        }
      } catch {}

      $result.Add([pscustomobject]@{
        entryId = $entryId
        subject = $subject
        from = @{
          name = $senderName
          email = $senderEmail
        }
        receivedAt = $received
        unread = $unread
        bodyPreview = $bodyPreview
        body = $body
      }) | Out-Null

      $count++
      if ($count -ge $max) { break }
    }

    $payload = [pscustomobject]@{
      folder = $folderName
      max = $max
      unreadOnly = $unreadOnly
      includeBody = $includeBody
      items = $result
    }

    $json = $payload | ConvertTo-Json -Depth 8
    Set-Content -LiteralPath $outFile -Value $json -Encoding UTF8
  } catch {
    $m = $_.Exception.Message
    if ($m -match "n'êtes pas connecté" -or $m -match "not logged on" -or $m -match "Vous n'êtes pas connecté") {
      throw "Outlook n'est pas connecté. Ouvre Outlook Desktop, connecte-toi, attends la synchronisation, puis relance."
    }
    throw
  } finally {
    [System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($outlook) | Out-Null
  }
}

function New-ComObjectWithRetry {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ProgId,
    [int]$MaxAttempts = 10,
    [int]$DelayMs = 350
  )

  for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
      return New-Object -ComObject $ProgId
    } catch {
      $msg = $_.Exception.Message
      # Common Outlook/Office automation issue: RPC_E_CALL_REJECTED (0x80010001)
      if ($msg -match "0x80010001" -or $msg -match "RPC_E_CALL_REJECTED" -or $msg -match "L'appel a été rejeté") {
        Start-Sleep -Milliseconds ($DelayMs * $i)
        continue
      }
      throw
    }
  }
  throw "Impossible de créer l'objet COM '$ProgId' après $MaxAttempts tentatives."
}

function Quote-Arg([string]$s) {
  if ($null -eq $s) { return '""' }
  $escaped = $s -replace '"', '\"'
  return '"' + $escaped + '"'
}

function Open-AppAndWriteResult($task, [string]$outFile) {
  Ensure-ParentDir $outFile

  $name = ([string]$task.input.name).ToLower().Trim()
  if (-not $name) { throw "input.name manquant (app.open)" }

  $exe = $null
  switch ($name) {
    "word" { $exe = "winword.exe"; break }
    "excel" { $exe = "excel.exe"; break }
    "powerpoint" { $exe = "powerpnt.exe"; break }
    "outlook" { $exe = "outlook.exe"; break }
    "edge" { $exe = "msedge.exe"; break }
    "chrome" { $exe = "chrome.exe"; break }
    "notepad" { $exe = "notepad.exe"; break }
    "calculator" { $exe = "calc.exe"; break }
    default { throw "Application non autorisée: $name" }
  }

  $args = ""
  if ($task.input.args) {
    $arr = @($task.input.args)
    $args = ($arr | ForEach-Object { Quote-Arg ([string]$_) }) -join " "
  }

  $p = Start-Process -FilePath $exe -ArgumentList $args -PassThru

  $payload = [pscustomobject]@{
    name = $name
    exe = $exe
    pid = $p.Id
    startedAt = (Get-Date).ToString("o")
  }
  $json = $payload | ConvertTo-Json -Depth 5
  Set-Content -LiteralPath $outFile -Value $json -Encoding UTF8
}

$task = Read-JsonFile -Path $TaskJsonPath
$type = [string]$task.type
$outFile = [string]$task.__resolved.outputFile

if (-not $outFile) { throw "__resolved.outputFile manquant" }

switch ($type) {
  "text.to_word" { New-WordDocFromSections -task $task -outFile $outFile; break }
  "research.summarize_to_word" { throw "Utilise le runner Node: `node agent/run-agent.js --task ...` (il transforme en text.to_word)" }
  "pdf.to_word" { Pdf-ToWordOrText -task $task -outFile $outFile -mode "docx"; break }
  "pdf.extract_text" { Pdf-ToWordOrText -task $task -outFile $outFile -mode "txt"; break }
  "table.to_excel" { New-ExcelFromTable -task $task -outFile $outFile; break }
  "slides.to_powerpoint" { New-PowerPointFromSlides -task $task -outFile $outFile; break }
  "email.draft" { New-EmlDraft -task $task -outFile $outFile; break }
  "email.draft.outlook" { New-OutlookDraftMsg -task $task -outFile $outFile; break }
  "email.read.outlook" { Read-OutlookMailsToJson -task $task -outFile $outFile; break }
  "app.open" { Open-AppAndWriteResult -task $task -outFile $outFile; break }
  default { throw "type non supporté: $type" }
}
