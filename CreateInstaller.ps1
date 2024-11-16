# Script de création de l'installateur
# Nécessite le module PS2EXE pour la conversion en .exe

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Configuration
$appName = "Forex Analyzer Pro"
$version = "1.0.0"
$publisher = "Your Company"
$outputDir = ".\installer"
$sourceDir = $PSScriptRoot

function Write-Status {
    param([string]$Message)
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor Cyan
}

function Create-Installer {
    try {
        # Créer le dossier de sortie
        Write-Status "Création du dossier d'installation..."
        New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

        # Créer le script d'installation
        $installerScript = @"
# Installation de Forex Analyzer Pro
`$ErrorActionPreference = "Stop"

# Configuration
`$appName = "$appName"
`$installDir = "`$env:LOCALAPPDATA\$appName"
`$desktopShortcut = "`$env:USERPROFILE\Desktop\$appName.lnk"
`$startMenuFolder = "`$env:APPDATA\Microsoft\Windows\Start Menu\Programs\$appName"

function Write-Status {
    param([string]`$Message)
    Write-Host "[`$((Get-Date).ToString('HH:mm:ss'))] `$Message" -ForegroundColor Cyan
}

try {
    # Vérifier si PowerShell est en admin
    `$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")
    if (-not `$isAdmin) {
        throw "L'installation nécessite des droits administrateur"
    }

    # Créer le dossier d'installation
    Write-Status "Création du dossier d'installation..."
    New-Item -ItemType Directory -Force -Path `$installDir | Out-Null

    # Copier les fichiers
    Write-Status "Copie des fichiers..."
    `$sourceFiles = @(
        "Config.ps1",
        "ForexAnalyzer.ps1",
        "GptService.ps1",
        "LogService.ps1",
        "LogViewer.ps1",
        "MainWindow.xaml",
        "NewsService.ps1"
    )

    foreach (`$file in `$sourceFiles) {
        Copy-Item "`$PSScriptRoot\`$file" -Destination "`$installDir\" -Force
    }

    # Créer les dossiers nécessaires
    New-Item -ItemType Directory -Force -Path "`$installDir\logs" | Out-Null

    # Créer le raccourci bureau
    Write-Status "Création des raccourcis..."
    `$shell = New-Object -ComObject WScript.Shell
    `$shortcut = `$shell.CreateShortcut(`$desktopShortcut)
    `$shortcut.TargetPath = "powershell.exe"
    `$shortcut.Arguments = "-ExecutionPolicy Bypass -NoProfile -File `"`$installDir\ForexAnalyzer.ps1`""
    `$shortcut.WorkingDirectory = `$installDir
    `$shortcut.IconLocation = "powershell.exe,0"
    `$shortcut.Save()

    # Créer le dossier du menu Démarrer
    New-Item -ItemType Directory -Force -Path `$startMenuFolder | Out-Null
    `$startMenuShortcut = `$shell.CreateShortcut("`$startMenuFolder\$appName.lnk")
    `$startMenuShortcut.TargetPath = "powershell.exe"
    `$startMenuShortcut.Arguments = "-ExecutionPolicy Bypass -NoProfile -File `"`$installDir\ForexAnalyzer.ps1`""
    `$startMenuShortcut.WorkingDirectory = `$installDir
    `$startMenuShortcut.IconLocation = "powershell.exe,0"
    `$startMenuShortcut.Save()

    # Configurer les permissions
    Write-Status "Configuration des permissions..."
    `$acl = Get-Acl `$installDir
    `$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "Users",
        "Modify",
        "ContainerInherit,ObjectInherit",
        "None",
        "Allow"
    )
    `$acl.SetAccessRule(`$rule)
    Set-Acl `$installDir `$acl

    Write-Status "Installation terminée avec succès!"
    Write-Host "`nL'application a été installée dans: `$installDir"
    Write-Host "Un raccourci a été créé sur le bureau et dans le menu Démarrer."
    Write-Host "`nAppuyez sur une touche pour terminer l'installation..."
    `$null = `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
catch {
    Write-Host "ERREUR: `$(`$_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nAppuyez sur une touche pour fermer..."
    `$null = `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
"@

        # Sauvegarder le script d'installation
        $installerPath = Join-Path $outputDir "install.ps1"
        $installerScript | Out-File -FilePath $installerPath -Encoding UTF8 -Force

        # Copier les fichiers nécessaires
        Write-Status "Copie des fichiers sources..."
        $sourceFiles = @(
            "Config.ps1",
            "ForexAnalyzer.ps1",
            "GptService.ps1",
            "LogService.ps1",
            "LogViewer.ps1",
            "MainWindow.xaml",
            "NewsService.ps1"
        )

        foreach ($file in $sourceFiles) {
            Copy-Item $file -Destination $outputDir -Force
        }

        # Convertir en .exe avec PS2EXE
        Write-Status "Conversion en exécutable..."
        $ps2exeParams = @{
            InputFile = $installerPath
            OutputFile = Join-Path $outputDir "ForexAnalyzerSetup.exe"
            NoConsole = $true
            Title = $appName
            Version = $version
            Publisher = $publisher
            RequireAdmin = $true
        }

        if (Get-Command ps2exe -ErrorAction SilentlyContinue) {
            ps2exe @ps2exeParams
        } else {
            Write-Warning "Le module PS2EXE n'est pas installé. Installation..."
            Install-Module ps2exe -Scope CurrentUser -Force
            Import-Module ps2exe
            ps2exe @ps2exeParams
        }

        Write-Status "Installateur créé avec succès!"
        Write-Host "`nL'installateur se trouve dans: $outputDir\ForexAnalyzerSetup.exe"
    }
    catch {
        Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Exécuter la création de l'installateur
Create-Installer