import { execSync } from 'child_process';

async function run() {
  console.log('Finding files in commit 5241963...');
  const filesStr = execSync('git show --name-only --pretty=format: 5241963').toString();
  const files = filesStr.split('\n').map(f => f.trim()).filter(f => f && !f.includes('package-lock.json') && !f.includes('tsbuildinfo'));

  for (const file of files) {
    try {
      const fileDiff = execSync(`git show 5241963 -- "${file}"`).toString();
      if (fileDiff.toLowerCase().includes('snapshot') || fileDiff.toLowerCase().includes('shift')) {
        console.log(`=========================================`);
        console.log(`MATCH IN FILE: ${file}`);
        const lines = fileDiff.split('\n');
        for (const line of lines) {
          if (line.toLowerCase().includes('snapshot') || line.toLowerCase().includes('shift')) {
            console.log(`  ${line.trim()}`);
          }
        }
      }
    } catch (e: any) {
      console.error(`Error showing ${file}:`, e.message);
    }
  }
}

run().catch(console.error);
