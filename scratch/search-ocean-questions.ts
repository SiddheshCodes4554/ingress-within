import fs from 'fs';
import path from 'path';

const docsDir = 'C:/Users/siddh/.gemini/antigravity/brain/948714a0-b526-4e4b-964c-fc6829bd3df4/scratch/updated_docs';
const files = fs.readdirSync(docsDir);

for (const file of files) {
  if (file.endsWith('.txt')) {
    const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const l = line.toLowerCase();
      if (l.includes('ocean') || l.includes('openness') || l.includes('conscientiousness') || l.includes('agreeableness') || l.includes('q1') || l.includes('q12') || l.includes('personality')) {
        if (line.trim().length > 10 && line.trim().length < 150) {
          console.log(`[${file}:${idx+1}] ${line.trim()}`);
        }
      }
    });
  }
}
