# Service de logging
. .\Config.ps1

# Définition de l'énumération des niveaux de log
$Global:LogLevels = @{
    Debug = 0
    Information = 1
    Warning = 2
    Error = 3
    Critical = 4
}

# Configuration du logging
$Global:LogConfig = @{
    LogPath = Join-Path $PSScriptRoot "logs"
    MainLogFile = Join-Path (Join-Path $PSScriptRoot "logs") "forex_analyzer.log"
    ErrorLogFile = Join-Path (Join-Path $PSScriptRoot "logs") "forex_analyzer_errors.log"
    MaxLogSizeMB = 10
    MaxArchiveFiles = 5
}

# Créer le dossier de logs s'il n'existe pas
if (-not (Test-Path $Global:LogConfig.LogPath)) {
    New-Item -ItemType Directory -Path $Global:LogConfig.LogPath -Force | Out-Null
}

function Write-AppLog {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message,
        
        [Parameter(Mandatory=$false)]
        [ValidateSet('Debug', 'Information', 'Warning', 'Error', 'Critical')]
        [string]$Level = 'Information',
        
        [Parameter(Mandatory=$false)]
        [string]$Source = 'Application',

        [Parameter(Mandatory=$false)]
        [System.Management.Automation.ErrorRecord]$Exception = $null
    )
    
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
        $computerName = [Environment]::MachineName
        $userName = [Environment]::UserName
        $processId = $PID
        $threadId = [Threading.Thread]::CurrentThread.ManagedThreadId

        # Formater le message de log
        $logEntry = "[$timestamp] [$Level] [$Source] [$computerName] [$userName] [PID:$processId] [TID:$threadId] $Message"
        if ($Exception) {
            $logEntry += "`nException: $($Exception.Exception.Message)`nStack Trace:`n$($Exception.ScriptStackTrace)"
        }

        # Écrire dans le fichier de log principal
        Add-Content -Path $Global:LogConfig.MainLogFile -Value $logEntry -Encoding UTF8 -Force

        # Écrire aussi dans le fichier d'erreurs si nécessaire
        if ($Level -eq 'Error' -or $Level -eq 'Critical') {
            Add-Content -Path $Global:LogConfig.ErrorLogFile -Value $logEntry -Encoding UTF8 -Force
        }

        # Affichage console si en mode debug ou erreur
        if ($Global:Config.DebugMode -or $Level -eq 'Error' -or $Level -eq 'Critical') {
            $color = switch ($Level) {
                'Error' { 'Red' }
                'Warning' { 'Yellow' }
                'Debug' { 'Cyan' }
                'Critical' { 'DarkRed' }
                default { 'Gray' }
            }
            Write-Host $logEntry -ForegroundColor $color
        }

        # Vérifier la taille des fichiers de log
        foreach ($logFile in @($Global:LogConfig.MainLogFile, $Global:LogConfig.ErrorLogFile)) {
            if ((Test-Path $logFile) -and ((Get-Item $logFile).Length -gt ($Global:LogConfig.MaxLogSizeMB * 1MB))) {
                $baseName = [System.IO.Path]::GetFileNameWithoutExtension($logFile)
                $extension = [System.IO.Path]::GetExtension($logFile)
                $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
                $archivePath = Join-Path $Global:LogConfig.LogPath "${baseName}_${timestamp}${extension}"
                
                Move-Item $logFile $archivePath -Force

                # Nettoyer les anciens fichiers d'archive
                Get-ChildItem $Global:LogConfig.LogPath -Filter "${baseName}_*${extension}" |
                    Sort-Object LastWriteTime -Descending |
                    Select-Object -Skip $Global:LogConfig.MaxArchiveFiles |
                    Remove-Item -Force
            }
        }
    }
    catch {
        $fallbackLog = Join-Path ([Environment]::GetFolderPath("Desktop")) "forex_analyzer_fallback.log"
        $errorMsg = "ERREUR CRITIQUE DE LOGGING: $($_.Exception.Message)"
        Add-Content -Path $fallbackLog -Value "[$timestamp] $errorMsg" -Encoding UTF8
        Write-Host $errorMsg -ForegroundColor Red
    }
}