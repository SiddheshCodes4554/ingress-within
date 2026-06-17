import fs from 'fs';
import path from 'path';

const specDir = 'D:/Internship/Ingress Within Files/Dashboard backend';
const files = [
  'ingress_within_system_spec.html',
  'ingress_within_implementation_guide.html',
  'ingress_within_dashboard_backend.html'
];

function search() {
  const query = 'createTable';
  console.log(`Searching for "${query}" in spec files...\n`);
  
  files.forEach(file => {
    const filePath = path.join(specDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let matchesCount = 0;
    
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        console.log(`[${file}:${idx + 1}] ${line.trim()}`);
        matchesCount++;
      }
    });
    
    console.log(`--> Found ${matchesCount} matches in ${file}\n`);
  });
}

search();
