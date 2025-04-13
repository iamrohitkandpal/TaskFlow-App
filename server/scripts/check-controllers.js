import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const controllersDir = path.join(__dirname, '..', 'controllers');

// Patterns to look for
const patterns = [
  { regex: /req\.user\.userId(?!\s*\?)/g, issue: 'Accessing req.user.userId without checking if it exists' },
  { regex: /\s+catch\s*\(error\)[^{]*{[^}]*console\.error/g, issue: 'Error handling without proper stack tracing' },
  { regex: /\.find\({[^}]*}\)/g, issue: 'MongoDB query without error handling' },
];

console.log('Scanning controllers for potential issues...');

fs.readdir(controllersDir, (err, files) => {
  if (err) {
    console.error('Error reading controllers directory:', err);
    return;
  }

  files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const filePath = path.join(controllersDir, file);
      fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
          console.error(`Error reading ${file}:`, err);
          return;
        }

        console.log(`\nChecking ${file}...`);
        let hasIssues = false;

        patterns.forEach(({ regex, issue }) => {
          const matches = content.match(regex);
          if (matches && matches.length > 0) {
            console.log(`  - ${issue} (${matches.length} occurrences)`);
            hasIssues = true;
          }
        });

        if (!hasIssues) {
          console.log('  No common issues found');
        }
      });
    }
  });
});