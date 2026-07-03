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

console.log('=== AUDITING API ROUTES FOR USER SCOPING ===');

const unscopedQueries: any[] = [];

walkDir('./src/app/api', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, idx) => {
    if (line.includes('.from(')) {
      // Analyze 10 lines of context to find if user_id or authUser is filtered
      const blockLines: string[] = [];
      for (let i = idx; i < Math.min(idx + 10, lines.length); i++) {
        blockLines.push(lines[i].trim());
      }
      const blockText = blockLines.join(' ');
      
      const tableMatch = line.match(/\.from\(['"]([^'"]+)['"]\)/);
      const tableName = tableMatch ? tableMatch[1] : 'unknown';
      
      // We ignore global/public tables or checks that don't leak user data:
      // - exercise_templates is global
      // - column checks (with .limit(1) and no values returned)
      const isGlobalTable = ['exercise_templates'].includes(tableName);
      const isColumnCheck = blockText.includes('.limit(1)') && !blockText.includes('.eq(') && !blockText.includes('.select(\'*\'');
      
      const hasUserIdFilter = blockText.includes('user_id') || blockText.includes('userId') || blockText.includes('authUser.userId');
      
      if (!hasUserIdFilter && !isGlobalTable && !isColumnCheck) {
        unscopedQueries.push({
          file: filePath,
          line: idx + 1,
          table: tableName,
          snippet: line.trim(),
          context: blockLines.slice(0, 4).join(' ')
        });
      }
    }
  });
});

console.log(`Found ${unscopedQueries.length} unscoped or suspicious API queries:\n`);

let report = '=== API ROUTE USER SCOPING AUDIT ===\n\n';
unscopedQueries.forEach((q, index) => {
  report += `${index + 1}. [Table: ${q.table}] ${q.file}:${q.line}\n`;
  report += `   Snippet: ${q.snippet}\n`;
  report += `   Context: ${q.context}\n\n`;
});

fs.writeFileSync('./scratch/api-audit-report.txt', report);
console.log(`Successfully wrote ${unscopedQueries.length} unscoped queries to ./scratch/api-audit-report.txt`);

