/**
 * Build script: reads matches-config.json, optionally substitutes __ENV_VAR__ from .env,
 * then encodes and injects into pakistan-team-live.html.
 *
 * Manifest = MPD (DASH). Can be:
 *   - A string: MPD URL, e.g. "https://example.com/stream.mpd"
 *   - An object for Shaka: { "uri": "https://...mpd", "headers": { "Authorization": "Bearer ..." } }
 *
 * Keep secrets (MPD URLs, auth headers, keys) in .env — never commit .env or matches-config.json.
 *
 * Usage: node build.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'matches-config.json');
const HTML_PATH = path.join(__dirname, 'pakistan-team-live.html');
const ENV_PATH = path.join(__dirname, '.env');

/** Load .env into process.env (simple parser, no extra deps) */
function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] = val;
  });
}

/** Replace __ENV_VARNAME__ in any string with process.env.VARNAME */
function substituteEnv(obj) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    const m = obj.match(/^__ENV_([A-Za-z0-9_]+)__$/);
    if (m && process.env[m[1]] !== undefined) return process.env[m[1]];
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item) => substituteEnv(item));
    return;
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') {
        const m = obj[key].match(/^__ENV_([A-Za-z0-9_]+)__$/);
        if (m && process.env[m[1]] !== undefined) obj[key] = process.env[m[1]];
      } else {
        substituteEnv(obj[key]);
      }
    }
  }
}

function encodePayload(data) {
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json, 'utf8').toString('base64');
  return base64.split('').reverse().join('');
}

function main() {
  loadEnv();

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

  const isArray = Array.isArray(data);
  if (!isArray && (!data.streams || !Array.isArray(data.streams))) {
    console.error('matches-config.json must be a JSON array of match objects, or an object with "streams" array (and optional "maxVisibleStreams" number).');
    process.exit(1);
  }

  substituteEnv(data);

  const encoded = encodePayload(data);

  let html = fs.readFileSync(HTML_PATH, 'utf8');

  const startMarker = "const _payload = (function(){var _='";
  const endMarker = "';try{return JSON.parse(atob(_.split('').reverse().join('')));}catch(e){return {};}})();";
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    console.error('Could not find payload placeholder in pakistan-team-live.html (expected _payload IIFE with endMarker).');
    process.exit(1);
  }
  const before = html.slice(0, startIdx + startMarker.length);
  const after = html.slice(endIdx);
  html = before + encoded + after;

  fs.writeFileSync(HTML_PATH, html, 'utf8');
  const streamCount = isArray ? data.length : data.streams.length;
  console.log('Done. Encoded', streamCount, 'match(es) into pakistan-team-live.html.');
}

main();
