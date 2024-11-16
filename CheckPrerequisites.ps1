# Script de vérification des prérequis
. .\Config.ps1
. .\LogService.ps1

function Test-Prerequisites {
    try {
        Write-AppLog "Vérification des prérequis..." -Source "Prerequisites"

        # Liste des assemblies Windows requises
        $requiredAssemblies = @(
            "PresentationFramework",
            "PresentationCore",
            "WindowsBase",
            "System.Windows.Forms",
            "System.Web"
        )

        # Vérifier les assemblies
        foreach ($assembly in $requiredAssemblies) {
            try {
                Add-Type -AssemblyName $assembly -ErrorAction Stop
                Write-AppLog "Assembly $assembly : OK" -Source "Prerequisites" -Level "Debug"
            }
            catch {
                throw "Assembly $assembly non trouvée. Veuillez installer .NET Framework 4.8 ou supérieur"
            }
        }

        # Vérifier PowerShell
        $psVersion = $PSVersionTable.PSVersion
        if ($psVersion.Major -lt 5) {
            throw "PowerShell 5.1 ou supérieur est requis. Version actuelle : $psVersion"
        }
        Write-AppLog "Version PowerShell : $psVersion" -Source "Prerequisites" -Level "Debug"

        # Vérifier les droits d'exécution
        $executionPolicy = Get-ExecutionPolicy
        if ($executionPolicy -eq "Restricted") {
            Write-AppLog "Modification de la politique d'exécution..." -Source "Prerequisites"
            try {
                Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
                Write-AppLog "Politique d'exécution mise à jour" -Source "Prerequisites"
            }
            catch {
                throw "Impossible de modifier la politique d'exécution. Veuillez exécuter en tant qu'administrateur"
            }
        }

        # Vérifier/Créer le dossier logs
        $logPath = Join-Path $PSScriptRoot "logs"
        if (-not (Test-Path $logPath)) {
            try {
                New-Item -ItemType Directory -Path $logPath -Force | Out-Null
                Write-AppLog "Dossier logs créé" -Source "Prerequisites"
            }
            catch {
                throw "Impossible de créer le dossier logs : $($_.Exception.Message)"
            }
        }

        # Vérifier les permissions d'écriture
        try {
            $testFile = Join-Path $logPath "test.txt"
            "Test" | Out-File -FilePath $testFile -Force
            Remove-Item $testFile -Force
            Write-AppLog "Permissions d'écriture : OK" -Source "Prerequisites" -Level "Debug"
        }
        catch {
            throw "Permissions insuffisantes dans le dossier de l'application"
        }

        Write-AppLog "Tous les prérequis sont satisfaits" -Source "Prerequisites"
        return $true
    }
    catch {
        $errorMessage = $_.Exception.Message
        Write-AppLog $errorMessage -Level "Error" -Source "Prerequisites"
        
        # Afficher un message d'erreur convivial
        $message = @"
ERREUR : L'application ne peut pas démarrer

$errorMessage

Solutions possibles :
1. Installer .NET Framework 4.8 ou supérieur
2. Mettre à jour PowerShell vers la version 5.1 ou supérieure
3. Exécuter l'application en tant qu'administrateur
4. Vérifier les permissions du dossier

Voulez-vous que j'essaie d'installer les composants manquants ?
"@

        $result = [System.Windows.MessageBox]::Show(
            $message,
            "Erreur de prérequis",
            [System.Windows.MessageBoxButton]::YesNo,
            [System.Windows.MessageBoxImage]::Error
        )

        if ($result -eq [System.Windows.MessageBoxResult]::Yes) {
            try {
                # Installer .NET Framework si nécessaire
                if (-not (Test-Path "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full")) {
                    Write-AppLog "Installation de .NET Framework..." -Source "Prerequisites"
                    Start-Process "https://go.microsoft.com/fwlink/?LinkId=2085155" # URL de .NET Framework 4.8
                }

                # Installer PowerShell si nécessaire
                if ($PSVersionTable.PSVersion.Major -lt 5) {
                    Write-AppLog "Installation de PowerShell..." -Source "Prerequisites"
                    Start-Process "https://github.com/PowerShell/PowerShell/releases/latest"
                }

                [System.Windows.MessageBox]::Show(
                    "Veuillez redémarrer l'ordinateur après l'installation des composants.",
                    "Installation des prérequis",
                    [System.Windows.MessageBoxButton]::OK,
                    [System.Windows.MessageBoxImage]::Information
                )
            }
            catch {
                Write-AppLog "Erreur lors de l'installation des prérequis : $($_.Exception.Message)" -Level "Error" -Source "Prerequisites"
            }
        }

        return $false
    }
}