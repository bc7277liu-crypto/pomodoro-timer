#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const INDEX_PATH = path.join(SKILLS_DIR, 'index.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const lines = match[1].split('\n');
  const frontmatter = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
    frontmatter[key] = value;
  }

  return frontmatter;
}

function updateIndex() {
  const entries = [];

  const items = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  for (const item of items) {
    if (!item.isDirectory()) continue;

    const skillPath = path.join(SKILLS_DIR, item.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    const content = fs.readFileSync(skillPath, 'utf-8');
    const frontmatter = parseFrontmatter(content);

    if (frontmatter && frontmatter.name) {
      entries.push({
        name: frontmatter.name,
        description: frontmatter.description || '',
        directory: item.name,
        path: `skills/${item.name}/SKILL.md`
      });
    }
  }

  const index = {
    updatedAt: new Date().toISOString(),
    count: entries.length,
    skills: entries
  };

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log(`Updated skills index: ${entries.length} skill(s) registered.`);
  for (const s of entries) {
    console.log(`  - ${s.name}: ${s.description.slice(0, 60)}${s.description.length > 60 ? '...' : ''}`);
  }
}

updateIndex();
