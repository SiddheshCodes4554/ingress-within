import fs from 'fs';
import path from 'path';

const specPath = 'D:/Internship/Ingress Within Files/Dashboard backend/ingress_within_implementation_guide.html';
const content = fs.readFileSync(specPath, 'utf8');

function viewJob() {
  const lines = content.split('\n');
  
  for (let j = 2050; j < 2250; j++) {
    if (lines[j]) {
      console.log(`${j + 1}: ${lines[j]}`);
    }
  }
}

viewJob();
