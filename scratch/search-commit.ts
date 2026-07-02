import { execSync } from 'child_process';

try {
  console.log('Running git show 5241963...');
  const diff = execSync('git show 5241963', { maxBuffer: 1024 * 1024 * 50 }).toString();
  console.log('Searching diff for "snapshot" or "shift"...');
  
  const lines = diff.split('\n');
  let matchCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('snapshot') || line.toLowerCase().includes('shift')) {
      matchCount++;
      console.log(`Line ${i}: ${line.trim()}`);
      if (matchCount > 50) {
        console.log('Too many matches, stopping...');
        break;
      }
    }
  }
} catch (e: any) {
  console.error('Error:', e.message);
}
