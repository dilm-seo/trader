import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function packageApp() {
  try {
    console.log('📦 Packaging Forex Analyzer Pro...');

    // Build the application
    console.log('Building application...');
    await execAsync('npm run build');

    // Create dist folder if it doesn't exist
    await fs.mkdir('dist', { recursive: true });

    // Package the application using pkg
    console.log('Creating executables...');
    await execAsync('pkg . --targets node16-win-x64,node16-macos-x64,node16-linux-x64 --output dist/forex-analyzer-pro');

    console.log('✅ Packaging complete! Executables are available in the dist folder:');
    console.log('  • dist/forex-analyzer-pro-win.exe (Windows)');
    console.log('  • dist/forex-analyzer-pro-macos (macOS)');
    console.log('  • dist/forex-analyzer-pro-linux (Linux)');
  } catch (error) {
    console.error('❌ Error during packaging:', error);
    process.exit(1);
  }
}

packageApp();