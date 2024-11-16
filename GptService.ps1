# Configuration de l'encodage
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# Service pour l'interaction avec l'API GPT
. .\Config.ps1

function Initialize-ApiKey {
    $apiKey = Get-Content $Config.ApiKeyPath -Encoding UTF8 -ErrorAction SilentlyContinue
    if ([string]::IsNullOrWhiteSpace($apiKey) -or $apiKey -eq "your-api-key-here") {
        throw "Clé API non valide. Veuillez configurer votre clé API dans l'onglet Paramètres"
    }
    return $apiKey
}

function Invoke-GptAnalysis {
    param(
        [Parameter(Mandatory=$true)]
        [string]$newsText,
        [Parameter(Mandatory=$true)]
        [string]$modelName,
        [Parameter(Mandatory=$true)]
        [string]$systemPrompt
    )

    try {
        $apiKey = Initialize-ApiKey
        $model = $Config.Models[$modelName]
        
        if ([string]::IsNullOrEmpty($model)) {
            throw "Modèle GPT non valide: $modelName"
        }

        $headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }

        $bodyObj = @{
            "model" = $model
            "messages" = @(
                @{
                    "role" = "system"
                    "content" = $systemPrompt
                }
                @{
                    "role" = "user"
                    "content" = $newsText
                }
            )
            "temperature" = 0.7
            "max_tokens" = 2000
        }

        $bodyJson = $bodyObj | ConvertTo-Json -Depth 10 -Compress
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

        $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" `
                                    -Method Post `
                                    -Headers $headers `
                                    -Body $bodyBytes

        return @{
            Success = $true
            Content = $response.choices[0].message.content
        }
    }
    catch {
        $errorMessage = switch -Regex ($_.Exception.Message) {
            "401" { "Erreur d'authentification: Clé API invalide" }
            "429" { "Limite de requêtes atteinte. Veuillez réessayer plus tard." }
            "500" { "Erreur serveur OpenAI. Veuillez réessayer plus tard." }
            default { "Erreur lors de l'analyse GPT: $($_.Exception.Message)" }
        }

        return @{
            Success = $false
            Error = $errorMessage
        }
    }
}