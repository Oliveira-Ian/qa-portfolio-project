# Reports every Node.js process that looks like this project's dev servers
# (apps/web on :3000, apps/api on :3001) - which PID is actually bound to
# each port, how much memory it's using, and any process whose command line
# matches a dev-server pattern but isn't part of a tree that owns one of
# those ports (an orphaned duplicate from a server that was never cleanly
# stopped - the exact shape of the slowdown this script exists to catch).
#
# A process is considered "fine" if it IS a listener, or one of its
# descendants is - that's what makes an "npm run dev" wrapper process not a
# false positive: it never binds the port itself, its grandchild does. The
# tree is walked through every process, not only node.exe: on Windows npm
# starts the server through cmd.exe, so npm -> cmd -> node.
#
# The patterns match the command lines as Windows really records them - npm
# is "node npm-cli.js run dev -w apps/api", tsx is "node tsx\dist\cli.mjs
# watch ...", Next is "node next\dist\bin\next dev" - not the words typed in
# the terminal. Orphans of exactly that shape (an "npm run dev -w apps/api"
# and its "tsx watch" whose server had died, eight of them) once left Windows
# unable to start new processes: Turbopack's PostCSS worker failed with
# 0xc0000142 and every page answered 500.
#
# Read-only by default. With -StopOrphans it stops what it flagged as
# orphaned (never a listener or anything in a listening tree). See
# .claude/rules/rules-global.md ("Local Development Servers") for when this
# should run and what to do with what it finds.
#
# ASCII only in this file on purpose - PowerShell 5.1 misreads a UTF-8 file
# without a BOM, and non-ASCII characters (em dashes, smart quotes) inside a
# string literal can corrupt the parse in ways that are hard to diagnose.

param([switch]$StopOrphans)

$targetPorts = 3000, 3001
$memWarningBytes = 300MB

# npm wrapper, tsx watcher, the API server itself, the Next CLI and Next's server.
$pattern = @(
  'run dev -w apps[\\/](web|api)',
  'tsx([\\/]dist[\\/]cli\.mjs"?)?\s+watch',
  'tsx[\\/]dist[\\/]preflight\.cjs.*src[\\/]server\.ts',
  'next([\\/]dist[\\/]bin[\\/]next"?)?\s+dev',
  'next[\\/]dist[\\/]server[\\/]lib[\\/]start-server'
) -join '|'

function Test-HasListeningDescendant {
  param($ProcessId, $ChildrenOf, $ListeningPids, $Visited)

  if ($Visited.Contains($ProcessId)) { return $false }
  [void]$Visited.Add($ProcessId)

  if ($ListeningPids -contains $ProcessId) { return $true }

  foreach ($child in $ChildrenOf[$ProcessId]) {
    if (Test-HasListeningDescendant -ProcessId $child -ChildrenOf $ChildrenOf -ListeningPids $ListeningPids -Visited $Visited) {
      return $true
    }
  }

  return $false
}

Write-Host "=== Listening on ports $($targetPorts -join ', ') ===" -ForegroundColor Cyan
$listeners = Get-NetTCPConnection -LocalPort $targetPorts -State Listen -ErrorAction SilentlyContinue
$allProcs = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue
$allNode = $allProcs | Where-Object { $_.Name -eq 'node.exe' }

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

$candidates = $allNode | Where-Object { $_.CommandLine -match $pattern }
$orphans = @()

if (-not $candidates) {
  Write-Host "  (none found)"
} else {
  $listeningPids = @($listeners | ForEach-Object { $_.OwningProcess })
  $childrenOf = @{}
  foreach ($proc in $allProcs) {
    if (-not $childrenOf.ContainsKey($proc.ParentProcessId)) { $childrenOf[$proc.ParentProcessId] = @() }
    $childrenOf[$proc.ParentProcessId] += $proc.ProcessId
  }

  foreach ($candidate in $candidates) {
    $mem = Get-Process -Id $candidate.ProcessId -ErrorAction SilentlyContinue
    $memMb = if ($mem) { [math]::Round($mem.WorkingSet64 / 1MB, 1) } else { "?" }

    $visited = New-Object 'System.Collections.Generic.HashSet[int]'
    $isFine = Test-HasListeningDescendant -ProcessId $candidate.ProcessId -ChildrenOf $childrenOf -ListeningPids $listeningPids -Visited $visited
    $orphanFlag = ""
    if (-not $isFine) {
      $orphanFlag = "  [ORPHAN - not part of any listening tree]"
      $orphans += $candidate
    }

    $commandLine = $candidate.CommandLine
    if ($commandLine.Length -gt 160) { $commandLine = $commandLine.Substring(0, 160) + '...' }
    Write-Host ("  PID {0}  {1}MB{2}" -f $candidate.ProcessId, $memMb, $orphanFlag)
    Write-Host "    $commandLine"
  }
}

Write-Host ""
if ($orphans.Count -eq 0) {
  Write-Host "No orphaned dev-server processes." -ForegroundColor Green
} elseif ($StopOrphans) {
  foreach ($orphan in $orphans) {
    try {
      Stop-Process -Id $orphan.ProcessId -Force -ErrorAction Stop
      Write-Host "  stopped PID $($orphan.ProcessId)"
    } catch {
      Write-Host "  PID $($orphan.ProcessId) already gone"
    }
  }
  Write-Host "$($orphans.Count) orphaned process(es) stopped." -ForegroundColor Green
} else {
  Write-Host "$($orphans.Count) orphaned process(es) found." -ForegroundColor Yellow
  Write-Host "Stop them all: npm run dev:doctor -- -StopOrphans   (or one: taskkill /F /PID <pid>)"
}
