# Interface de visualisation des logs
. .\Config.ps1
. .\LogService.ps1

function Show-LogViewer {
    Add-Type -AssemblyName PresentationFramework
    Add-Type -AssemblyName PresentationCore
    Add-Type -AssemblyName WindowsBase

    [xml]$xaml = @"
<Window
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    Title="Log Viewer - Forex Analyzer" 
    Height="600" 
    Width="1000"
    Background="#111827"
    WindowStartupLocation="CenterScreen">
    
    <Grid Margin="10">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <!-- Filtres -->
        <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="0,0,0,10">
            <ComboBox Name="levelFilter" Width="120" Margin="0,0,10,0">
                <ComboBoxItem Content="All Levels" IsSelected="True"/>
                <ComboBoxItem Content="Debug"/>
                <ComboBoxItem Content="Information"/>
                <ComboBoxItem Content="Warning"/>
                <ComboBoxItem Content="Error"/>
                <ComboBoxItem Content="Critical"/>
            </ComboBox>
            
            <ComboBox Name="sourceFilter" Width="120" Margin="0,0,10,0">
                <ComboBoxItem Content="All Sources" IsSelected="True"/>
            </ComboBox>
            
            <TextBox Name="searchBox" Width="200" Margin="0,0,10,0" 
                     Background="#1F2937" Foreground="White"
                     BorderBrush="#4F46E5"/>
                     
            <Button Name="refreshBtn" Content="🔄 Refresh" 
                    Background="#4F46E5" Foreground="White"
                    Padding="10,5"/>
                    
            <Button Name="exportBtn" Content="📥 Export" 
                    Background="#10B981" Foreground="White"
                    Padding="10,5" Margin="10,0,0,0"/>
                    
            <Button Name="analyzeBtn" Content="📊 Analyze" 
                    Background="#7C3AED" Foreground="White"
                    Padding="10,5" Margin="10,0,0,0"/>
        </StackPanel>

        <!-- Liste des logs -->
        <DataGrid Name="logGrid" Grid.Row="1" 
                  AutoGenerateColumns="False"
                  Background="#1F2937"
                  BorderThickness="0"
                  RowBackground="#1F2937"
                  AlternatingRowBackground="#374151"
                  GridLinesVisibility="None">
            <DataGrid.Columns>
                <DataGridTextColumn Header="Time" Binding="{Binding Timestamp}" Width="150"/>
                <DataGridTextColumn Header="Level" Binding="{Binding Level}" Width="80"/>
                <DataGridTextColumn Header="Source" Binding="{Binding Source}" Width="100"/>
                <DataGridTextColumn Header="Message" Binding="{Binding Message}" Width="*"/>
            </DataGrid.Columns>
        </DataGrid>

        <!-- Statistiques -->
        <StatusBar Grid.Row="2" Background="#1F2937">
            <StatusBarItem Name="totalCount"/>
            <Separator/>
            <StatusBarItem Name="errorCount"/>
            <Separator/>
            <StatusBarItem Name="warningCount"/>
        </StatusBar>
    </Grid>
</Window>
"@

    $reader = [System.Xml.XmlNodeReader]::new($xaml)
    $window = [Windows.Markup.XamlReader]::Load($reader)

    # Récupérer les contrôles
    $controls = @{
        logGrid = $window.FindName("logGrid")
        levelFilter = $window.FindName("levelFilter")
        sourceFilter = $window.FindName("sourceFilter")
        searchBox = $window.FindName("searchBox")
        refreshBtn = $window.FindName("refreshBtn")
        exportBtn = $window.FindName("exportBtn")
        analyzeBtn = $window.FindName("analyzeBtn")
        totalCount = $window.FindName("totalCount")
        errorCount = $window.FindName("errorCount")
        warningCount = $window.FindName("warningCount")
    }

    # Fonction de chargement des logs
    function Load-Logs {
        $logs = @()
        $mainLogPath = Join-Path ([LogManager]::LogPath) "forex_analyzer.log"
        
        if (Test-Path $mainLogPath) {
            Get-Content $mainLogPath -Encoding UTF8 | ForEach-Object {
                if ($_ -match '^\[(.*?)\] \[(.*?)\] \[(.*?)\].*?\] (.*?)$') {
                    $logs += [PSCustomObject]@{
                        Timestamp = [DateTime]::ParseExact($matches[1], 'yyyy-MM-dd HH:mm:ss.fff', $null)
                        Level = $matches[2]
                        Source = $matches[3]
                        Message = $matches[4]
                    }
                }
            }
        }
        
        return $logs
    }

    # Fonction de mise à jour des statistiques
    function Update-Statistics {
        $logs = @($controls.logGrid.ItemsSource)
        $controls.totalCount.Content = "Total: $($logs.Count) logs"
        $controls.errorCount.Content = "Errors: $($logs.Where({$_.Level -eq 'Error'}).Count)"
        $controls.warningCount.Content = "Warnings: $($logs.Where({$_.Level -eq 'Warning'}).Count)"
    }

    # Fonction de filtrage des logs
    function Filter-Logs {
        $logs = Load-Logs
        
        # Filtre par niveau
        $selectedLevel = $controls.levelFilter.SelectedItem.Content
        if ($selectedLevel -ne "All Levels") {
            $logs = $logs.Where({$_.Level -eq $selectedLevel})
        }
        
        # Filtre par source
        $selectedSource = $controls.sourceFilter.SelectedItem.Content
        if ($selectedSource -ne "All Sources") {
            $logs = $logs.Where({$_.Source -eq $selectedSource})
        }
        
        # Filtre par recherche
        $searchText = $controls.searchBox.Text
        if ($searchText) {
            $logs = $logs.Where({
                $_.Message -like "*$searchText*" -or
                $_.Source -like "*$searchText*" -or
                $_.Level -like "*$searchText*"
            })
        }
        
        $controls.logGrid.ItemsSource = $logs
        Update-Statistics
    }

    # Événements
    $controls.refreshBtn.Add_Click({ Filter-Logs })
    
    $controls.exportBtn.Add_Click({
        $saveDialog = New-Object Microsoft.Win32.SaveFileDialog
        $saveDialog.Filter = "CSV files (*.csv)|*.csv|All files (*.*)|*.*"
        $saveDialog.DefaultExt = "csv"
        
        if ($saveDialog.ShowDialog()) {
            $controls.logGrid.ItemsSource | 
            Select-Object Timestamp,Level,Source,Message |
            Export-Csv -Path $saveDialog.FileName -NoTypeInformation -Encoding UTF8
            
            [System.Windows.MessageBox]::Show(
                "Logs exported successfully!",
                "Export Complete",
                [System.Windows.MessageBoxButton]::OK,
                [System.Windows.MessageBoxImage]::Information
            )
        }
    })
    
    $controls.analyzeBtn.Add_Click({
        $logs = @($controls.logGrid.ItemsSource)
        
        $analysis = [PSCustomObject]@{
            TotalLogs = $logs.Count
            ErrorRate = [math]::Round(($logs.Where({$_.Level -eq 'Error'}).Count / $logs.Count) * 100, 2)
            WarningRate = [math]::Round(($logs.Where({$_.Level -eq 'Warning'}).Count / $logs.Count) * 100, 2)
            TopSources = $logs | Group-Object Source | Sort-Object Count -Descending | Select-Object -First 5
            TimeDistribution = $logs | Group-Object { $_.Timestamp.ToString('HH:mm') } | Sort-Object Name
        }
        
        $report = @"
Log Analysis Report
------------------
Total Logs: $($analysis.TotalLogs)
Error Rate: $($analysis.ErrorRate)%
Warning Rate: $($analysis.WarningRate)%

Top Sources:
$(($analysis.TopSources | ForEach-Object { "- $($_.Name): $($_.Count) logs" }) -join "`n")

Time Distribution:
$(($analysis.TimeDistribution | ForEach-Object { "$($_.Name): $($_.Count) logs" }) -join "`n")
"@
        
        [System.Windows.MessageBox]::Show(
            $report,
            "Log Analysis",
            [System.Windows.MessageBoxButton]::OK,
            [System.Windows.MessageBoxImage]::Information
        )
    })

    # Initialisation
    $logs = Load-Logs
    
    # Remplir les sources uniques
    $sources = @("All Sources") + ($logs | Select-Object -ExpandProperty Source -Unique)
    $sources | ForEach-Object {
        $item = New-Object System.Windows.Controls.ComboBoxItem
        $item.Content = $_
        $controls.sourceFilter.Items.Add($item)
    }
    
    # Filtres dynamiques
    $controls.levelFilter.Add_SelectionChanged({ Filter-Logs })
    $controls.sourceFilter.Add_SelectionChanged({ Filter-Logs })
    $controls.searchBox.Add_TextChanged({ Filter-Logs })
    
    # Afficher les logs initiaux
    Filter-Logs

    # Afficher la fenêtre
    $window.ShowDialog()
}