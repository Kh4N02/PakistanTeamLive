/**
 * Build script: reads matches-config.json, encodes it (base64 + reverse),
 * and injects into pakistan-team-live.html so stream data is not stored in plain text.
 *
 * Usage: node build.js
 *
 * - Edit matches-config.json with your 3 matches (title, date, venue, image, manifest, etc.).
 * - Run: node build.js
 * - Commit only pakistan-team-live.html to GitHub (add matches-config.json to .gitignore).
 * - On GitHub Pages, only the encoded payload is visible; raw config is not in the repo.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'matches-config.json');
const HTML_PATH = path.join(__dirname, 'pakistan-team-live.html');

function encodePayload(data) {
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json, 'utf8').toString('base64');
  return base64.split('').reverse().join('');
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('matches-config.json not found. Copy from matches-config.example.json and fill in your matches.');
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Invalid matches-config.json:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('matches-config.json must be a JSON array of match objects.');
    process.exit(1);
  }

  const encoded = encodePayload(data);

  let html = fs.readFileSync(HTML_PATH, 'utf8');

  // Replace the payload inside (function(){var _='...';try{window._s=...
  const startMarker = "(function(){var _='";
  const endMarker = "';try{window._s=JSON.parse(atob(_.split('').reverse().join('')));}catch(e){window._s=[];}";
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error('Could not find payload placeholder in pakistan-team-live.html');
    process.exit(1);
  }
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  html = before + encoded + after;

  fs.writeFileSync(HTML_PATH, html, 'utf8');
  console.log('Done. Encoded', data.length, 'match(es) into pakistan-team-live.html');
}

main();
