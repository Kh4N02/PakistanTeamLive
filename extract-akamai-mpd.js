#!/usr/bin/env node
/**
 * Extract Akamai manifest (MPD) URLs from Prime/ICC playback API JSON.
 *
 * Usage:
 *   node extract-akamai-mpd.js                    # paste JSON, then Ctrl+Z (Win) / Ctrl+D (Unix)
 *   node extract-akamai-mpd.js < playback.json    # from file
 *   node extract-akamai-mpd.js playback.json      # from filename
 *
 * Output: One Akamai manifest URL per line (akamaihd.net or akamaized.net).
 * These URLs require the x-pv-cdn-access-token header (PVExchangeV1); the script
 * does not convert paths to OTTB/... style — it only extracts what's in the response.
 */

const fs = require('fs');

function readInput() {
  const fileArg = process.argv[2];
  if (fileArg && fs.existsSync(fileArg)) {
    return fs.readFileSync(fileArg, 'utf8');
  }
  if (process.stdin.isTTY) {
    console.error('Paste the raw JSON (playback response), then press Ctrl+Z (Windows) or Ctrl+D (Unix) to finish.');
    return null;
  }
  return fs.readFileSync(0, 'utf8');
}

function extractAkamaiManifestUrls(data) {
  let obj;
  try {
    obj = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Invalid JSON:', e.message);
    process.exit(1);
  }

  const urlSets = obj?.livePlaybackUrls?.result?.urlSets;
  if (!Array.isArray(urlSets)) {
    console.error('No livePlaybackUrls.result.urlSets found in JSON.');
    process.exit(1);
  }

  const seen = new Set();
  const akamaiUrls = [];

  for (const set of urlSets) {
    const manifest = set?.urls?.manifest;
    if (!manifest) continue;
    const cdn = manifest.cdn;
    const url = manifest.url;
    if (cdn !== 'Akamai' || !url || typeof url !== 'string') continue;
    // Only Akamai hosts (akamaihd.net or akamaized.net)
    if (!/akamaihd\.net|akamaized\.net/i.test(url)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    akamaiUrls.push({ url, origin: manifest.origin || manifest.cdnOrigin || '' });
  }

  return akamaiUrls;
}

function main() {
  const input = readInput();
  if (!input || !input.trim()) {
    console.error('No input.');
    process.exit(1);
  }

  const results = extractAkamaiManifestUrls(input.trim());
  if (results.length === 0) {
    console.error('No Akamai manifest URLs found.');
    process.exit(1);
  }

  const urlsOnly = results.map((r) => r.url);
  const jsonOut = process.argv.includes('--json');

  if (jsonOut) {
    console.log(JSON.stringify(urlsOnly, null, 2));
  } else {
    console.error(`Found ${results.length} Akamai manifest URL(s):\n`);
    for (const url of urlsOnly) {
      console.log(url);
    }
  }
}

main();
