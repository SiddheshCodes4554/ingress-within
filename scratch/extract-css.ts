import fs from 'fs';
import path from 'path';

async function main() {
  const htmlPath = 'C:/Users/siddh/Downloads/emotion-kb-ingress-within.html';
  const cssDest = 'D:/Internship/Ingress Within/src/pages/KnowledgeBankPage.css';

  console.log(`Reading HTML file from ${htmlPath}...`);
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Find all <style> tags content
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  let combinedCss = '';

  while ((match = styleRegex.exec(htmlContent)) !== null) {
    combinedCss += match[1].trim() + '\n\n';
  }

  if (!combinedCss) {
    console.error('No style blocks found in the HTML spec!');
    return;
  }

  // Add additional CSS styles for proper page container layout and auth navbar padding
  const customPadding = `
/* Custom layout fixes for Ingress Within app container integration */
.app {
  max-width: 680px;
  margin: 0 auto;
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 20px rgba(0,0,0,0.05);
}

/* Ensure detail links in confused-with lists and similar are clickable */
.cw-row {
  cursor: pointer;
}
`;
  combinedCss += customPadding;

  console.log(`Writing extracted CSS to ${cssDest}...`);
  fs.writeFileSync(cssDest, combinedCss, 'utf8');
  console.log('CSS successfully extracted and saved!');
}

main().catch(console.error);
