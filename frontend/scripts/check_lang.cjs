const fs = require('fs');
const glob = require('glob');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

// Function to find the exact match string from regex match
function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /lang\s*===\s*'vi'\s*\?\s*('[^']+'|"[^"]+"|`[^`]+`)\s*:\s*('[^']+'|"[^"]+"|`[^`]+`)/g;
    let match;
    let found = [];
    while ((match = regex.exec(content)) !== null) {
        found.push({
            full: match[0],
            vi: match[1],
            en: match[2]
        });
    }
    
    // Check for `lang === 'vi' ? A : B` without quotes just in case
    const regex2 = /lang\s*===\s*'vi'\s*\?\s*([^:<]+)\s*:\s*([^<}]+)/g;
    while ((match = regex2.exec(content)) !== null) {
        // Simple heuristic filtering
        if (!match[0].includes('(') && !match[0].includes(')')) {
            found.push({
               full: match[0],
               vi: match[1].trim(),
               en: match[2].trim()
            });
        }
    }
    
    if (found.length > 0) {
        console.log(`\n--- ${path.relative(srcDir, filePath)} ---`);
        found.slice(0, 10).forEach(f => {
            console.log(f.full);
        });
    }
}

function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath);
        } else if (entry.name.endsWith('.jsx')) {
            analyzeFile(fullPath);
        }
    }
}

walkDir(srcDir);
