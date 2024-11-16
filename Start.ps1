# Script de démarrage avec vérification des prérequis
$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Forex Analyzer Pro"

function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-PowerShellVersion {
    $minVersion = [Version]"5.1"
    $currentVersion = $PSVersionTable.PSVersion
    
    if ($currentVersion -lt $minVersion) {
        Write-ColorMessage "PowerShell $minVersion ou supérieur est requis. Version actuelle : $currentVersion" "Red"
        Write-ColorMessage "Téléchargez PowerShell depuis : https://github.com/PowerShell/PowerShell/releases/latest" "Yellow"
        return $false
    }
    return $true
}

function Test-DotNetFramework {
    try {
        $release = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" -ErrorAction Stop
        if ($release.Release -lt 528040) {
            Write-ColorMessage ".NET Framework 4.8 ou supérieur est requis" "Red"
            Write-ColorMessage "Téléchargez .NET Framework depuis : https://dotnet.microsoft.com/download/dotnet-framework/net48" "Yellow"
            return $false
        }
        return $true
    }
    catch {
        Write-ColorMessage ".NET Framework 4.8 n'est pas installé" "Red"
        Write-ColorMessage "Téléchargez .NET Framework depuis : https://dotnet.microsoft.com/download/dotnet-framework/net48" "Yellow"
        return $false
    }
}

function Test-ExecutionPolicy {
    $policy = Get-ExecutionPolicy -Scope CurrentUser
    if ($policy -eq "Restricted") {
        try {
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
            Write-ColorMessage "Politique d'exécution mise à jour" "Green"
            return $true
        }
        catch {
            Write-ColorMessage "Impossible de modifier la politique d'exécution" "Red"
            Write-ColorMessage "Exécutez PowerShell en tant qu'administrateur et utilisez la commande:" "Yellow"
            Write-ColorMessage "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force" "Yellow"
            return $false
        }
    }
    return $true
}

function Initialize-AppFolders {
    try {
        $folders = @("logs", "config")
        foreach ($folder in $folders) {
            $path = Join-Path $PSScriptRoot $folder
            if (-not (Test-Path $path)) {
                New-Item -ItemType Directory -Path $path -Force | Out-Null
            }
        }
        return $true
    }
    catch {
        Write-ColorMessage "Erreur lors de la création des dossiers: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Programme principal
try {
    Clear-Host
    Write-ColorMessage "=== Forex Analyzer Pro ===" "Cyan"
    Write-ColorMessage "Vérification des prérequis..." "White"

    # Vérifier PowerShell
    if (-not (Test-PowerShellVersion)) {
        Read-Host "Appuyez sur Entrée pour fermer"
        exit 1
    }

    # Vérifier .NET Framework
    if (-not (Test-DotNetFramework)) {
        Read-Host "Appuyez sur Entrée pour fermer"
        exit 1
    }

    # Vérifier la politique d'exécution
    if (-not (Test-ExecutionPolicy)) {
        Read-Host "Appuyez sur Entrée pour fermer"
        exit 1
    }

    # Initialiser les dossiers
    if (-not (Initialize-AppFolders)) {
        Read-Host "Appuyez sur Entrée pour fermer"
        exit 1
    }

    Write-ColorMessage "Démarrage de l'application..." "Green"
    & "$PSScriptRoot\ForexAnalyzer.ps1"
}
catch {
    Write-ColorMessage "Erreur critique: $($_.Exception.Message)" "Red"
    Write-ColorMessage $_.ScriptStackTrace "DarkGray"
    Read-Host "Appuyez sur Entrée pour fermer"
    exit 1
}