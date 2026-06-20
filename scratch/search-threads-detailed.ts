import fs from 'fs';
import path from 'path';

const docsDir = 'C:/Users/siddh/.gemini/antigravity/brain/948714a0-b526-4e4b-964c-fc6829bd3df4/scratch/updated_docs';
const targetFiles = [
  'Ingress_Within_Crisis_Protocol_UPDATED.txt',
  'Ingress_Within_Prompt_System_v1.0.txt',
  'Ingress_Within_Decision_Log_UPDATED.txt',
  'Ingress_Within_Developer_Reference_UPDATED.txt'
];

for (const file of targetFiles) {
  const filePath = path.join(docsDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File ${file} does not exist at ${filePath}`);
    continue;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log(`=== Matches in ${file} ===`);
  lines.forEach((line, idx) => {
    const l = line.toLowerCase();
    if (l.includes('thread') || l.includes('suppress')) {
      console.log(`  [Line ${idx + 1}] ${line.trim()}`);
    }
  });
  console.log('');
}
