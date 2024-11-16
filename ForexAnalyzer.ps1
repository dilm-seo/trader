# Configuration de l'encodage UTF-8 sans BOM
$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)

# Load required assemblies
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Web

# Import des services
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptPath\Config.ps1"
. "$scriptPath\NewsService.ps1"
. "$scriptPath\GptService.ps1"
. "$scriptPath\LogService.ps1"
. "$scriptPath\LogViewer.ps1"
. "$scriptPath\CheckPrerequisites.ps1"

function Start-ForexAnalyzer {
    try {
        # Vérifier les prérequis
        if (-not (Test-Prerequisites)) {
            return
        }

        # Définir la culture en français
        [System.Threading.Thread]::CurrentThread.CurrentUICulture = 'fr-FR'
        [System.Threading.Thread]::CurrentThread.CurrentCulture = 'fr-FR'

        Write-AppLog "Démarrage de l'application" -Source "Main"
        
        Write-AppLog "Chargement de l'interface..." -Source "UI"

        # Nettoyer les anciens logs
        $logPath = Join-Path $PSScriptRoot "logs"
        if (Test-Path $logPath) {
            Get-ChildItem $logPath -Filter "*.log" | 
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$Config.LogRetentionDays) } | 
            Remove-Item -Force
        }

        # Lire le XAML
        $xamlPath = Join-Path $scriptPath "MainWindow.xaml"
        if (-not (Test-Path $xamlPath)) {
            throw "Fichier XAML introuvable: $xamlPath"
        }

        $xamlContent = Get-Content $xamlPath -Raw -Encoding UTF8
        if ([string]::IsNullOrEmpty($xamlContent)) {
            throw "Le fichier XAML est vide"
        }

        [xml]$xaml = $xamlContent

        # Create window
        $reader = [System.Xml.XmlNodeReader]::new($xaml)
        $window = [Windows.Markup.XamlReader]::Load($reader)
        $reader.Close()

        if (-not $window) {
            throw "Échec de la création de la fenêtre principale"
        }

        # Get controls
        $controls = @{
            btnAnalyze = $window.FindName("btnAnalyze")
            btnSaveSettings = $window.FindName("btnSaveSettings")
            btnAddFeed = $window.FindName("btnAddFeed")
            feedsList = $window.FindName("feedsList")
            txtResults = $window.FindName("txtResults")
            txtApiKey = $window.FindName("txtApiKey")
            txtSystemPrompt = $window.FindName("txtSystemPrompt")
            newsList = $window.FindName("newsList")
        }

        # Vérifier que tous les contrôles sont trouvés
        $missingControls = $controls.Keys | Where-Object { $null -eq $controls[$_] }
        if ($missingControls) {
            throw "Contrôles manquants: $($missingControls -join ', ')"
        }

        # Charger les paramètres
        Write-AppLog "Chargement des paramètres" -Source "Settings"
        $apiKeyPath = Join-Path $scriptPath $Config.ApiKeyPath
        if (Test-Path $apiKeyPath) {
            $controls.txtApiKey.Text = Get-Content $apiKeyPath -Raw -Encoding UTF8
            Write-AppLog "Clé API chargée" -Source "Settings"
        } else {
            Write-AppLog "Aucune clé API trouvée" -Level "Warning" -Source "Settings"
        }

        $systemPromptPath = Join-Path $scriptPath "system_prompt.txt"
        if (Test-Path $systemPromptPath) {
            $controls.txtSystemPrompt.Text = Get-Content $systemPromptPath -Raw -Encoding UTF8
            Write-AppLog "Prompt système personnalisé chargé" -Source "Settings"
        } else {
            $controls.txtSystemPrompt.Text = $Config.DefaultSystemPrompt
            Write-AppLog "Utilisation du prompt système par défaut" -Source "Settings"
        }

        # Initialiser la liste des sources
        $feeds = Get-FeedSources
        $controls.feedsList.ItemsSource = $feeds
        Write-AppLog "Sources d'actualités chargées: $($feeds.Count) sources" -Source "Settings"

        # Event handlers
        $controls.btnAddFeed.Add_Click({
            Write-AppLog "Ajout d'une nouvelle source" -Source "Feeds"
            $newFeed = @{
                Name = "Nouvelle Source"
                Url = "https://"
                Enabled = $true
            }
            
            $feeds = Get-FeedSources
            $feeds += $newFeed
            Save-FeedSources $feeds
            $controls.feedsList.ItemsSource = Get-FeedSources
        })

        $controls.btnSaveSettings.Add_Click({
            try {
                Write-AppLog "Sauvegarde des paramètres" -Source "Settings"
                Set-Content -Path $apiKeyPath -Value $controls.txtApiKey.Text -Encoding UTF8 -NoNewline
                Set-Content -Path $systemPromptPath -Value $controls.txtSystemPrompt.Text -Encoding UTF8 -NoNewline
                
                $feeds = @($controls.feedsList.ItemsSource)
                Save-FeedSources $feeds

                Write-AppLog "Paramètres sauvegardés avec succès" -Source "Settings"
                [System.Windows.MessageBox]::Show(
                    "Paramètres sauvegardés avec succès",
                    "Succès",
                    "OK",
                    "Information"
                )
            }
            catch {
                $errorMsg = "Erreur lors de la sauvegarde: $($_.Exception.Message)"
                Write-AppLog $errorMsg -Level "Error" -Source "Settings"
                [System.Windows.MessageBox]::Show(
                    $errorMsg,
                    "Erreur",
                    "OK",
                    "Error"
                )
            }
        })

        $controls.btnAnalyze.Add_Click({
            try {
                Write-AppLog "Début de l'analyse des actualités" -Source "Analysis"
                $newsResult = Get-ForexNews
                if (-not $newsResult.Success) {
                    throw $newsResult.Error
                }

                Write-AppLog "Actualités récupérées, début de l'analyse GPT" -Source "Analysis"
                $controls.txtResults.Text = "Analyse en cours..."
                $analysis = Invoke-GptAnalysis -newsText $newsResult.FormattedText -modelName "GPT-3.5 Turbo" -systemPrompt $controls.txtSystemPrompt.Text

                if ($analysis.Success) {
                    $controls.txtResults.Text = $analysis.Content
                    Write-AppLog "Analyse terminée avec succès" -Source "Analysis"
                } else {
                    throw $analysis.Error
                }
            }
            catch {
                $errorMsg = $_.Exception.Message
                Write-AppLog "Erreur lors de l'analyse: $errorMsg" -Level "Error" -Source "Analysis"
                [System.Windows.MessageBox]::Show(
                    $errorMsg,
                    "Erreur",
                    "OK",
                    "Error"
                )
            }
        })

        # Rafraîchir automatiquement les news toutes les 5 minutes
        $timer = New-Object System.Windows.Threading.DispatcherTimer
        $timer.Interval = [TimeSpan]::FromMinutes(5)
        $timer.Add_Tick({
            try {
                Write-AppLog "Rafraîchissement automatique des actualités" -Source "News"
                $newsResult = Get-ForexNews
                if ($newsResult.Success) {
                    $controls.newsList.ItemsSource = $newsResult.News
                    Write-AppLog "Actualités rafraîchies avec succès" -Source "News"
                }
            }
            catch {
                $errorMsg = "Erreur lors du rafraîchissement automatique: $($_.Exception.Message)"
                Write-AppLog $errorMsg -Level "Warning" -Source "News"
            }
        })
        $timer.Start()

        Write-AppLog "Application prête" -Source "Main"

        # Show window
        $window.ShowDialog()
    }
    catch {
        $errorMessage = "Erreur critique: $($_.Exception.Message)`nStack: $($_.ScriptStackTrace)"
        Write-AppLog $errorMessage -Level "Error" -Source "Main"
        Write-Error $errorMessage
        [System.Windows.MessageBox]::Show($errorMessage, "Erreur", "OK", "Error")
    }
}

# Démarrer l'application
Start-ForexAnalyzer