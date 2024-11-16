import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

async function install() {
  try {
    console.log('🚀 Installing Forex Analyzer Pro...');

    // Determine installation directory
    const homeDir = os.homedir();
    const installDir = path.join(homeDir, '.forex-analyzer-pro');

    // Create installation directory
    console.log('Creating installation directory...');
    await fs.mkdir(installDir, { recursive: true });

    // Copy application files
    console.log('Copying application files...');
    await fs.cp('dist', installDir, { recursive: true });

    // Create configuration directory
    const configDir = path.join(installDir, 'config');
    await fs.mkdir(configDir, { recursive: true });

    // Create logs directory
    const logsDir = path.join(installDir, 'logs');
    await fs.mkdir(logsDir, { recursive: true });

    // Create desktop shortcut
    console.log('Creating shortcuts...');
    const desktopDir = path.join(homeDir, 'Desktop');
    const executableName = process.platform === 'win32' ? 'forex-analyzer-pro.exe' : 'forex-analyzer-pro';
    
    if (process.platform === 'win32') {
      // Windows shortcut
      const shortcutScript = `
        $WshShell = New-Object -comObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut("${path.join(desktopDir, 'Forex Analyzer Pro.lnk')}")
        $Shortcut.TargetPath = "${path.join(installDir, executableName)}"
        $Shortcut.Save()
      `;
      await fs.writeFile('create-shortcut.ps1', shortcutScript);
      await execAsync('powershell -ExecutionPolicy Bypass -File create-shortcut.ps1');
      await fs.unlink('create-shortcut.ps1');
    } else {
      // Linux/macOS shortcut
      const desktopEntry = `
[Desktop Entry]
Name=Forex Analyzer Pro
Exec=${path.join(installDir, executableName)}
Type=Application
Terminal=false
Categories=Finance;
      `;
      await fs.writeFile(path.join(desktopDir, 'forex-analyzer-pro.desktop'), desktopEntry);
      await execAsync(`chmod +x "${path.join(desktopDir, 'forex-analyzer-pro.desktop')}"`);
    }

    console.log('✅ Installation complete!');
    console.log(`Application installed to: ${installDir}`);
    console.log('A desktop shortcut has been created.');
  } catch (error) {
    console.error('❌ Error during installation:', error);
    process.exit(1);
  }
}

install();