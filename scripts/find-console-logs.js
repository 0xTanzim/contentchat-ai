#!/usr/bin/env node
/**
 * Console.log Migration Script
 * Helps identify all console.log calls that need migration to logger
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function findConsoleLogs() {
  console.log('🔍 Searching for console.log calls...\n');

  try {
    const { stdout } = await execAsync(
      'grep -r "console\\.log\\|console\\.debug\\|console\\.warn\\|console\\.error" src/ --include="*.ts" --include="*.tsx" -n || true'
    );

    if (!stdout) {
      console.log('✅ No console.log calls found!\n');
      return;
    }

    const lines = stdout.trim().split('\n');
    const fileGroups = {};

    // Group by file
    lines.forEach((line) => {
      const [filePath, ...rest] = line.split(':');
      if (!fileGroups[filePath]) {
        fileGroups[filePath] = [];
      }
      fileGroups[filePath].push(rest.join(':'));
    });

    console.log(
      `📊 Found ${lines.length} console calls in ${
        Object.keys(fileGroups).length
      } files:\n`
    );

    // Print by file
    Object.entries(fileGroups).forEach(([file, calls]) => {
      console.log(`📁 ${file} (${calls.length} calls)`);
      calls.slice(0, 3).forEach((call) => {
        console.log(`   ${call}`);
      });
      if (calls.length > 3) {
        console.log(`   ... and ${calls.length - 3} more`);
      }
      console.log('');
    });

    console.log('\n📝 Migration Priority:\n');
    console.log('1. src/sidepanel/services/ - Service layer');
    console.log('2. src/sidepanel/hooks/ - Business logic hooks');
    console.log('3. src/lib/services/ - Utility services');
    console.log('4. src/sidepanel/components/ - UI components');
    console.log('\n💡 Use: import { createLogger } from "@/lib/logger";\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findConsoleLogs();
