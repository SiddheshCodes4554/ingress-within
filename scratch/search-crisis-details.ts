import fs from 'fs';
import path from 'path';

const docsDir = 'C:/Users/siddh/.gemini/antigravity/brain/948714a0-b526-4e4b-964c-fc6829bd3df4/scratch/updated_docs';
const content = fs.readFileSync(path.join(docsDir, 'Ingress_Within_Crisis_Protocol_UPDATED.txt'), 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  const l = line.toLowerCase();
  if (l.includes('suppress') || l.includes('thread') || l.includes('clos')) {
    console.log(`[Line ${idx + 1}] ${line.trim()}`);
  }
});
