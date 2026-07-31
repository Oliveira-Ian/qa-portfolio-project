# Reports every Node.js process that looks like this project's dev servers
# (apps/web on :3000, apps/api on :3001) - which PID is actually bound to
# each port, how much memory it's using, and any process whose command line
# matches a dev-server pattern but isn't part of a tree that owns one of
# those ports (an orphaned duplicate from a server that was never cleanly
# stopped - the exact shape of the slowdown this script exists to catch).
#
# A process is considered "fine" if it IS a listener, or one of its
# descendants is - that's what makes an "npx next dev" wrapper process not a
# false positive: it never binds the port itself, its child does.
#
# Read-only - reports, never kills anything itself. See
# .claude/rules/rules-global.md ("Local Development Servers") for when this
# should run and what to do with what it finds.
#
# ASCII only in this file on purpose - PowerShell 5.1 misreads a UTF-8 file
# without a BOM, and non-ASCII characters (em dashes, smart quotes) inside a
# string literal can corrupt the parse in ways that are hard to diagnose.

$targetPorts = 3000, 3001
$memWarningBytes = 300MB

function Test-HasListeningDescendant {
  param($ProcessId, $AllProcs, $ListeningPids, $Visited = @())

  if ($Visited -contains $ProcessId) { return $false }
  $Visited = $Visited + $ProcessId

  if ($ListeningPids -contains $ProcessId) { return $true }

  $children = $AllProcs | Where-Object { $_.ParentProcessId -eq $ProcessId }
  foreach ($child in $children) {
    if (Test-HasListeningDescendant -ProcessId $child.ProcessId -AllProcs $AllProcs -ListeningPids $ListeningPids -Visited $Visited) {
      return $true
    }
  }

  return $false
}

Write-Host "=== Listening on ports $($targetPorts -join ', ') ===" -ForegroundColor Cyan
$listeners = Get-NetTCPConnection -LocalPort $targetPorts -State Listen -ErrorAction SilentlyContinue
$allNode = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue

if (-not $listeners) {
  Write-Host "  (nothing listening - apps/web and/or apps/api are not running)"
} else {
  foreach ($listener in $listeners) {
    $proc = $allNode | Where-Object { $_.ProcessId -eq $listener.OwningProcess }
    $mem = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
    $memMb = if ($mem) { [math]::Round($mem.WorkingSet64 / 1MB, 1) } else { "?" }
    $flag = ""
    if ($mem -and $mem.WorkingSet64 -gt $memWarningBytes) {
      $flag = "  [unusually high, consider restarting]"
    }

    Write-Host ("  port {0}  PID {1}  {2}MB{3}" -f $listener.LocalPort, $listener.OwningProcess, $memMb, $flag)
    if ($proc) { Write-Host "    $($proc.CommandLine)" }
  }
}

Write-Host ""
Write-Host "=== All node.exe processes matching this project's dev-server patterns ===" -ForegroundColor Cyan

$pattern = 'next dev|tsx watch src[\\/]server\.ts|npm run dev -w apps[\\/](web|api)'
$candidates = $allNode | Where-Object { $_.CommandLine -match $pattern }

if (-not $candidates) {
  Write-Host "  (none found)"
} else {
  $listeningPids = @($listeners | ForEach-Object { $_.OwningProcess })

  foreach ($candidate in $candidates) {
    $mem = Get-Process -Id $candidate.ProcessId -ErrorAction SilentlyContinue
    $memMb = if ($mem) { [math]::Round($mem.WorkingSet64 / 1MB, 1) } else { "?" }

    $isFine = Test-HasListeningDescendant -ProcessId $candidate.ProcessId -AllProcs $allNode -ListeningPids $listeningPids
    $orphanFlag = ""
    if (-not $isFine) {
      $orphanFlag = "  [not part of any listening tree - likely orphaned/duplicate]"
    }

    Write-Host ("  PID {0}  {1}MB{2}" -f $candidate.ProcessId, $memMb, $orphanFlag)
    Write-Host "    $($candidate.CommandLine)"
  }
}

Write-Host ""
Write-Host "To stop a stray process: taskkill /F /PID <pid>"
