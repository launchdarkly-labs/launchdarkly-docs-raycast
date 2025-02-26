import * as fs from 'fs';
import * as path from 'path';

const inputFile = 'node_modules/@launchpad-ui/icons/dist/sprite.svg';
const outputDir = 'icons';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Read the sprite SVG file
const spriteContent = fs.readFileSync(inputFile, 'utf-8');

// Regular expression to match symbol elements
const symbolRegex = /<symbol\s+viewBox="([^"]+)"\s+id="([^"]+)">([\s\S]*?)<\/symbol>/g;

let match;
while ((match = symbolRegex.exec(spriteContent)) !== null) {
  const [_, viewBox, id, content] = match;
  
  // Create individual SVG content
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${content.trim()}
</svg>`;

  // Write to file
  const fileName = `${id}.svg`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, svgContent);
  
  console.log(`Created ${fileName}`);
}

console.log('Extraction complete!'); 