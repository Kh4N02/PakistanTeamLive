/**
 * Try to get "all channels" m3u8 from live.vpnhosted.com:
 * 1) Try common master playlist URLs with your token; save first that works.
 * 2) If CHANNEL_SLUGS is set in .env, build per-channel URLs and optionally check which work.
 *
 * .env (optional):
 *   CHANNEL_M3U8_TOKEN=5d4b5bf07d959f3c2d83ba82b413d5d3
 *   CHANNEL_SLUGS=Sky_sports_cricket_HD,Sky_sports_main_HD,Sky_sports_football_HD
 *
 * Usage: node get-all-m3u8.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ENV_PATH = path.join(__dirname, '.env');
const OUT_PLAYLIST = path.join(__dirname, 'all-channels.m3u8');
const BASE = 'https://live.vpnhosted.com';

const MASTER_PLAYLIST_PATHS = [
  '/playlist.m3u8',
  '/index.m3u8',
  '/all.m3u8',
  '/channels.m3u8',
  '/playlist.m3u',
];

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const content = fs.readFileSync(ENV_PATH, 'utf8');
  const out = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) out[key] = value;
  });
  return out;
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function looksLikePlaylist(body) {
  if (!body || typeof body !== 'string') return false;
  const t = body.trim();
  return t.startsWith('#EXTM3U') || t.includes('#EXTINF') || t.includes('.m3u8');
}

async function main() {
  const env = loadEnv();
  const token = env.CHANNEL_M3U8_TOKEN || '5d4b5bf07d959f3c2d83ba82b413d5d3';
  const slugsStr = env.CHANNEL_SLUGS || '';

  console.log('Using token:', token.slice(0, 8) + '...');
  console.log('');

  // 1) Try master playlists
  for (const p of MASTER_PLAYLIST_PATHS) {
    const url = `${BASE}${p}?token=${token}`;
    process.stdout.write(`Trying ${p} ... `);
    try {
      const { statusCode, body } = await get(url);
      if (statusCode === 200 && looksLikePlaylist(body)) {
        fs.writeFileSync(OUT_PLAYLIST, body, 'utf8');
        console.log('OK -> saved to all-channels.m3u8');
        console.log('Preview (first 500 chars):');
        console.log(body.slice(0, 500));
        break;
      }
      console.log(statusCode, '(not a playlist or empty)');
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  // 2) Per-channel URLs from CHANNEL_SLUGS
  if (slugsStr) {
    const slugs = slugsStr.split(',').map((s) => s.trim()).filter(Boolean);
    console.log('');
    console.log('Per-channel m3u8 URLs:');
    for (const slug of slugs) {
      const url = `${BASE}/${slug}/index.m3u8?token=${token}`;
      process.stdout.write(`  ${slug} ... `);
      try {
        const { statusCode } = await get(url);
        console.log(statusCode === 200 ? 'OK' : statusCode);
      } catch (e) {
        console.log('Error:', e.message);
      }
      console.log('    ' + url);
    }
  } else {
    console.log('');
    console.log('Tip: set CHANNEL_SLUGS in .env (comma-separated) to build and test per-channel URLs.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
