$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$gameSource = (Resolve-Path (Join-Path $workspace '../augment-alkkagi')).Path
$gameCopy = Join-Path $workspace 'artifacts/second-pass/game-source'
New-Item -ItemType Directory -Force -Path $gameCopy | Out-Null
& robocopy $gameSource $gameCopy /E /XD .git .godot build /XF .env .env.local /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw 'Game source copy failed' }
$godot = 'C:/Godot/Godot_v4.7.2-stable_win64_console.exe'
$import = Start-Process -FilePath $godot -WindowStyle Hidden -ArgumentList @('--headless','--editor','--import','--quit','--path',('"'+$gameCopy+'"')) -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace 'artifacts/second-pass/game-import.log') -RedirectStandardError (Join-Path $workspace 'artifacts/second-pass/game-import.err.log')
if ($import.ExitCode -ne 0) { throw 'Game import failed; inspect local log' }
$capture = Join-Path $PSScriptRoot 'capture-game-v2.gd'
$output = Join-Path $workspace 'public/projects/alkkagi-game.png'
$process = Start-Process -FilePath $godot -WindowStyle Hidden -ArgumentList @('--path',('"'+$gameCopy+'"'),'--script',('"'+$capture+'"'),'--','"'+$output+'"') -Wait -PassThru -RedirectStandardOutput (Join-Path $workspace 'artifacts/second-pass/game-capture.log') -RedirectStandardError (Join-Path $workspace 'artifacts/second-pass/game-capture.err.log')
if ($process.ExitCode -ne 0 -or !(Test-Path -LiteralPath $output)) { throw 'Game capture failed; inspect local log' }
Write-Output 'Captured actual local game viewport: public/projects/alkkagi-game.png'
