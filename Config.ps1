# Configuration de l'encodage UTF-8
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

# Configuration globale
$script:Config = @{
    ApiKeyPath = "gpt_api_key.txt"
    FeedsPath = "feeds.json"
    NewsLimit = 100
    DebugMode = $true  # Activer/désactiver le mode debug
    LogRetentionDays = 30  # Nombre de jours de conservation des logs
    Models = @{
        "GPT-3.5 Turbo" = "gpt-3.5-turbo"
        "GPT-4" = "gpt-4"
        "GPT-4 Turbo" = "gpt-4-turbo-preview"
    }
    DefaultFeeds = @(
        @{
            Name = "ForexLive"
            Url = "https://www.forexlive.com/feed/news"
            Enabled = $true
        }
    )
    Styles = @{
        PrimaryColor = "#7C3AED"
        AccentColor = "#4F46E5"
        SuccessColor = "#10B981"
        BackgroundColor = "#111827"
        SecondaryBackground = "#1F2937"
        TextColor = "#F3F4F6"
        MutedText = "#9CA3AF"
    }
    DefaultSystemPrompt = @"
Tu es un expert en trading Forex spécialisé dans l'analyse des actualités financières. Ta mission est de fournir des recommandations de trading précises et exploitables.

Format de réponse requis:

SYNTHÈSE DU MARCHÉ:
- Résumé bref des points clés des actualités

OPPORTUNITÉS DE TRADING:
1. [Paire de devises] - [Direction: ACHAT/VENTE]
   - Point d'entrée: [niveau]
   - Stop loss: [niveau]
   - Take profit: [niveau]
   - Ratio risque/rendement: [ratio]
   - Justification: [explication courte]

RISQUES PRINCIPAUX:
- Liste des risques majeurs à surveiller

HORIZON DE TRADING:
- Court terme (intraday/swing)

Important:
- Concentre-toi uniquement sur les paires majeures (EUR/USD, GBP/USD, USD/JPY, etc.)
- Fournis des niveaux précis pour chaque recommandation
- Sois direct et concis dans tes recommandations
- Base tes analyses sur les actualités fournies
"@
}