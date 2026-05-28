#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.OPENAI_API_KEY;
const API_BASE = (process.env.OPENAI_API_BASE || 'api.openai.com').replace(/^https?:\/\//, '');

if (!API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  OPENAI_API_KEY=sk-xxxxx node scripts/generate-image.js "a cyberpunk cat"');
  console.error('');
  console.error('Optional environment variables:');
  console.error('  OPENAI_API_BASE  - API base hostname (default: api.openai.com)');
  console.error('  OPENAI_MODEL     - Model name (default: dall-e-3)');
  process.exit(1);
}

const prompt = process.argv[2];
if (!prompt) {
  console.error('Error: prompt argument is required');
  console.error('Usage: node scripts/generate-image.js "your image description" [output.png]');
  process.exit(1);
}

const outputPath = process.argv[3] || `generated-${Date.now()}.png`;
const model = process.env.OPENAI_MODEL || 'dall-e-3';

function apiRequest(apiPath, method, data) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: API_BASE,
      path: apiPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`Model: ${model}`);
  console.log(`Prompt: ${prompt}`);
  console.log('Generating...');

  const result = await apiRequest('/v1/images/generations', 'POST', {
    model: model,
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'url'
  });

  if (result.error) {
    console.error('API Error:', result.error.message);
    if (result.error.code === 'invalid_api_key') {
      console.error('Hint: Check your OPENAI_API_KEY is correct');
    }
    process.exit(1);
  }

  const imageUrl = result.data[0].url;
  const revisedPrompt = result.data[0].revised_prompt;

  if (revisedPrompt) {
    console.log('Revised prompt:', revisedPrompt);
  }

  console.log('Downloading...');
  await downloadImage(imageUrl, outputPath);

  console.log('');
  console.log('Success! Image saved to:', path.resolve(outputPath));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
