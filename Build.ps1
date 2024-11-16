# Script de build pour Forex Analyzer Pro
$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Forex Analyzer Pro - Build"

function Write-Status {
    param([string]$Message)
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor Cyan
}

try {
    # Vérifier si PS2EXE est installé
    if (-not (Get-Module -ListAvailable -Name PS2EXE)) {
        Write-Status "Installation du module PS2EXE..."
        Install-Module -Name PS2EXE -Force -Scope CurrentUser
    }

    # Créer le dossier de build
    $buildDir = ".\build"
    Write-Status "Création du dossier de build..."
    New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

    # Copier tous les fichiers nécessaires
    Write-Status "Copie des fichiers sources..."
    $filesToCopy = @(
        "Config.ps1",
        "ForexAnalyzer.ps1",
        "GptService.ps1",
        "LogService.ps1",
        "LogViewer.ps1",
        "MainWindow.xaml",
        "NewsService.ps1",
        "CheckPrerequisites.ps1",
        "Start.ps1"
    )

    foreach ($file in $filesToCopy) {
        Copy-Item $file -Destination $buildDir -Force
    }

    # Créer le dossier logs dans le build
    New-Item -ItemType Directory -Force -Path "$buildDir\logs" | Out-Null

    # Convertir en exe
    Write-Status "Conversion en exécutable..."
    $ps2exeParams = @{
        InputFile = "$buildDir\Start.ps1"
        OutputFile = "$buildDir\ForexAnalyzer.exe"
        NoConsole = $true
        Title = "Forex Analyzer Pro"
        Version = "1.0.0"
        Publisher = "Your Company"
        RequireAdmin = $false
        IconFile = $null # Vous pouvez ajouter une icône personnalisée ici
    }

    Invoke-PS2EXE @ps2exeParams

    Write-Status "Build terminé avec succès!"
    Write-Host "`nL'exécutable se trouve dans: $buildDir\ForexAnalyzer.exe"
}
catch {
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}