#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'skills', 'index.json');

function listSkills() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('Skills index not found. Run: node scripts/update-skills-index.js');
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));

  console.log('');
  console.log(`Available Skills (${index.count}):`);
  console.log('');

  const maxNameLen = Math.max(...index.skills.map(s => s.name.length), 4);

  console.log(`${'Name'.padEnd(maxNameLen)} | Description`);
  console.log('-'.repeat(maxNameLen) + '-+-' + '-'.repeat(50));

  for (const skill of index.skills) {
    const desc = skill.description.length > 50
      ? skill.description.slice(0, 47) + '...'
      : skill.description;
    console.log(`${skill.name.padEnd(maxNameLen)} | ${desc}`);
  }

  console.log('');
  console.log('Usage: Say "use <skill-name> skill" in conversation, or read the SKILL.md directly.');
  console.log(`Index last updated: ${index.updatedAt}`);
  console.log('');
}

listSkills();
