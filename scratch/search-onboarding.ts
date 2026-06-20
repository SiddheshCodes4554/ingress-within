import fs from 'fs';
import path from 'path';

const docsDir = 'C:/Users/siddh/.gemini/antigravity/brain/948714a0-b526-4e4b-964c-fc6829bd3df4/scratch/updated_docs';
const content = fs.readFileSync(path.join(docsDir, 'Ingress_Within_Exercise_System_v2_5_CORRECTED2.txt'), 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  const l = line.toLowerCase();
  if (l.includes('ocean') || l.includes('question') || l.includes('q1') || l.includes('q2')) {
    if (idx < 200) { // show early parts
      console.log(`[Line ${idx + 1}] ${line.trim()}`);
    }
  }
});
