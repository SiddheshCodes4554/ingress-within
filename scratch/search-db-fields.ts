import fs from 'fs';
import path from 'path';

const specDir = 'C:/Users/siddh/.gemini/antigravity/brain/948714a0-b526-4e4b-964c-fc6829bd3df4/scratch/updated_docs';

function search() {
  const query = 'vocab';
  console.log(`Searching for "${query}" or "cluster" in updated docs...\n`);
  
  if (!fs.existsSync(specDir)) {
    console.error(`Spec directory not found: ${specDir}`);
    return;
  }

  const files = fs.readdirSync(specDir);
  
  files.forEach(file => {
    if (!file.endsWith('.txt')) return;
    const filePath = path.join(specDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let matchesCount = 0;
    
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('vocab') || line.toLowerCase().includes('cluster')) {
        console.log(`[${file}:${idx + 1}] ${line.trim()}`);
        matchesCount++;
      }
    });
    
    if (matchesCount > 0) {
      console.log(`--> Found ${matchesCount} matches in ${file}\n`);
    }
  });
}

search();
