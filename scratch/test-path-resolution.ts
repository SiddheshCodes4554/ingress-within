import fs from 'fs';
import path from 'path';

const artifactDir = 'C:\\Users\\siddh\\.gemini\\antigravity-ide\\brain\\e1f19012-8aa7-4f9e-bc76-47d893a98e22';
const testPath = '/Users/siddh/.gemini/antigravity-ide/brain/e1f19012-8aa7-4f9e-bc76-47d893a98e22/perf_monitor_ok_1782215137488.png';

try {
  const resolved = path.resolve(testPath);
  console.log(`Path: ${testPath}`);
  console.log(`  Resolved: ${resolved}`);
  
  const real = fs.realpathSync(resolved);
  console.log(`  Real Path: ${real}`);
  
  const isInside = real.toLowerCase().startsWith(artifactDir.toLowerCase());
  console.log(`  Is Inside: ${isInside}`);
} catch (e: any) {
  console.error('Error resolving realpath:', e.message);
}
