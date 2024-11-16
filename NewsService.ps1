# Service pour la récupération des news
. .\Config.ps1

function Get-FeedSources {
    try {
        if (Test-Path $Config.FeedsPath) {
            $feedsContent = Get-Content $Config.FeedsPath -Raw -Encoding UTF8
            if ([string]::IsNullOrEmpty($feedsContent)) {
                return $Config.DefaultFeeds
            }
            return $feedsContent | ConvertFrom-Json
        }
        return $Config.DefaultFeeds
    }
    catch {
        Write-Warning "Erreur lors de la lecture des sources: $($_.Exception.Message)"
        return $Config.DefaultFeeds
    }
}

function Save-FeedSources {
    param([array]$feeds)
    try {
        $feedsJson = $feeds | ConvertTo-Json
        Set-Content -Path $Config.FeedsPath -Value $feedsJson -Encoding UTF8 -NoNewline
        return $true
    }
    catch {
        Write-Warning "Erreur lors de la sauvegarde des sources: $($_.Exception.Message)"
        return $false
    }
}

function Convert-HtmlToText {
    param([string]$html)
    if ([string]::IsNullOrEmpty($html)) { return "" }
    $html = $html -replace '<[^>]+>', ' '
    $html = [System.Web.HttpUtility]::HtmlDecode($html)
    $html = $html -replace '\s+', ' '
    return $html.Trim()
}

function Format-NewsDate {
    param([string]$date)
    try {
        $dateObj = [DateTime]::Parse($date)
        return $dateObj.ToString("dd/MM/yyyy HH:mm")
    }
    catch {
        return $date
    }
}

function Get-ForexNews {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $webClient = New-Object System.Net.WebClient
        $webClient.Encoding = [System.Text.Encoding]::UTF8
        
        $feeds = Get-FeedSources
        $enabledFeeds = $feeds | Where-Object { $_.Enabled -eq $true }
        
        if ($enabledFeeds.Count -eq 0) {
            throw "Aucune source d'actualités activée"
        }

        $allNews = @()
        
        foreach ($feed in $enabledFeeds) {
            try {
                $feedContent = $webClient.DownloadString($feed.Url)
                [xml]$feedXml = $feedContent

                $news = $feedXml.rss.channel.item | ForEach-Object {
                    $title = if ($_.title.'#cdata-section') { $_.title.'#cdata-section' } else { $_.title }
                    $description = if ($_.description.'#cdata-section') { $_.description.'#cdata-section' } else { $_.description }
                    
                    @{
                        Source = $feed.Name
                        Title = Convert-HtmlToText $title
                        Description = Convert-HtmlToText $description
                        PubDate = Format-NewsDate $_.pubDate
                        Link = $_.link
                    }
                }
                
                $allNews += @($news)
            }
            catch {
                Write-Warning "Erreur lors de la lecture de $($feed.Name): $($_.Exception.Message)"
            }
        }
        
        $allNews = @($allNews | Sort-Object PubDate -Descending | Select-Object -First $Config.NewsLimit)
        
        if ($allNews.Count -eq 0) {
            throw "Aucune actualité récupérée"
        }

        $newsText = $allNews | ForEach-Object {
            "SOURCE: $($_.Source)`nTITRE: $($_.Title)`nDATE: $($_.PubDate)`nDESCRIPTION: $($_.Description)`n`n"
        }

        return @{
            Success = $true
            News = $allNews
            FormattedText = $newsText -join "`n"
        }
    }
    catch {
        return @{
            Success = $false
            Error = "Erreur lors de la récupération des actualités: $($_.Exception.Message)"
        }
    }
    finally {
        if ($webClient) {
            $webClient.Dispose()
        }
    }
}