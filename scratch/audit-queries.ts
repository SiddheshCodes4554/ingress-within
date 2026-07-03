import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        walkDir(filePath, callback);
      }
    } else {
      if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        callback(filePath);
      }
    }
  }
}

console.log('=== SCANNING CODEBASE FOR SUPABASE QUERIES ===');

const queriesReport: any[] = [];

walkDir('./src', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    if (line.includes('.from(')) {
      // Look at the block around it (next 10 lines)
      const blockLines: string[] = [];
      for (let i = idx; i < Math.min(idx + 10, lines.length); i++) {
        blockLines.push(lines[i].trim());
      }
      const blockText = blockLines.join(' ');
      
      const tableMatch = line.match(/\.from\(['"]([^'"]+)['"]\)/);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      
      const hasUserIdFilter = blockText.includes("user_id") || blockText.includes("userId");
      
      queriesReport.push({
        file: filePath,
        line: idx + 1,
        table: tableName,
        codeSnippet: line.trim(),
        blockText: blockText.substring(0, 150),
        hasUserIdFilter
      });
    }
  });
});

console.log(`Found ${queriesReport.length} queries.\n`);

let reportContent = '=== UNSCOPED OR SUSPICIOUS SUPABASE QUERIES ===\n\n';
let unscopedCount = 0;
queriesReport.forEach((q) => {
  const isGlobalTable = ['exercise_templates'].includes(q.table);
  const isBufferMatch = q.table === 'unknown';
  if (!q.hasUserIdFilter && !isGlobalTable && !isBufferMatch) {
    unscopedCount++;
    reportContent += `[Unscoped] File: ${q.file}:${q.line}\n`;
    reportContent += `  Table: "${q.table}"\n`;
    reportContent += `  Snippet: "${q.codeSnippet}"\n`;
    reportContent += `  Context: "${q.blockText}..."\n\n`;
  }
});

reportContent += `\nTotal unscoped/suspicious queries: ${unscopedCount}\n`;

fs.writeFileSync('./scratch/queries-audit-report.txt', reportContent);
console.log(`Successfully wrote ${unscopedCount} unscoped queries to ./scratch/queries-audit-report.txt`);

