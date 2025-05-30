#!/usr/bin/env node
// Auto-generate SUMMARY.md for GitBook
const fs = require('fs');
const path = require('path');

const EXCLUDE = ['SUMMARY.md', 'README.md', '_book', 'node_modules', '.git'];
const ROOT = process.cwd();

function getMarkdownFiles(dir, prefix = '') {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.join(prefix, file);
    if (EXCLUDE.includes(file) || file.startsWith('.')) return;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getMarkdownFiles(fullPath, relPath));
    } else if (file.endsWith('.md')) {
      files.push(relPath);
    }
  });
  return files;
}

function generateSummary(files) {
  let summary = '# Summary\n\n';
  if (files.includes('README.md')) {
    summary += '* [Introduction](README.md)\n';
    files = files.filter(f => f !== 'README.md');
  }
  files.forEach(f => {
    // Remove leading number and dash/underscore from filename for the title
    const title = f.replace(/^(\d+[-_])?/, '').replace(/.md$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    summary += `* [${title}](${f})\n`;
  });
  return summary;
}

const mdFiles = getMarkdownFiles(ROOT);
const summary = generateSummary(mdFiles);
fs.writeFileSync(path.join(ROOT, 'SUMMARY.md'), summary);
console.log('SUMMARY.md updated!');
