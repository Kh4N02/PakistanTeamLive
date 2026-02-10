# Step-by-step: Add your MPD and keys (tomorrow morning)

Do **not** put real keys in `.env.example`. That file is only a template (it can be committed). Put real values **only** in `.env`.

---

## 1. Copy the example file to `.env` (one time)

In the project folder (`PakistanTeamLive`), run:

```bash
copy .env.example .env
```

Or manually: duplicate `.env.example`, rename the copy to `.env`.

---

## 2. Convert your keys to one-line JSON

You get keys in this form (one per line):

```
keyIdHex:keyHex
keyIdHex:keyHex
```

**Example:**

```
e0fbdde6ff7fc860f8d830b2e365ba80:4e7f93ee0b0e31d255e47ab086cf5f8c
b770d5b4bb6b594daf985845aae9aa5f:b0cb46d2d31cf044bc73db71e9865f6f
```

Turn that into **one line of JSON** (keyId in quotes, key in quotes, comma between pairs, no spaces):

```json
{"e0fbdde6ff7fc860f8d830b2e365ba80":"4e7f93ee0b0e31d255e47ab086cf5f8c","b770d5b4bb6b594daf985845aae9aa5f":"b0cb46d2d31cf044bc73db71e9865f6f"}
```

Use that single line in `.env` for `STREAM1_KEYS` (see below).

---

## 3. Fill in `.env`

Open `.env` in a text editor. Fill in:

- **STREAM1_MPD** = full MPD URL (e.g. `https://a199aivottlinear-a.akamaihd.net/.../cenc.mpd`)
- **STREAM1_KEYS** = the one-line JSON from step 2

If you have three different streams, fill **STREAM2_MPD**, **STREAM2_KEYS**, **STREAM3_MPD**, **STREAM3_KEYS** the same way. If you only have one stream for now, leave the others empty; that match will not play until you add them.

**Example `.env` (one stream; use your real MPD URL and keys JSON):**

```env
STREAM1_MPD=https://your-cdn.example.com/.../cenc.mpd
STREAM1_KEYS={"keyIdHex1":"keyHex1","keyIdHex2":"keyHex2"}

STREAM2_MPD=
STREAM2_KEYS=

STREAM3_MPD=
STREAM3_KEYS=
```

Save the file.

---

## 4. Use the example config (so placeholders are replaced)

Copy the **example** config over your real one so it has the right structure and placeholders:

```bash
copy matches-config.example.json matches-config.json
```

Or: open `matches-config.example.json`, copy all its contents, paste into `matches-config.json` and save.

That way `matches-config.json` will have:

- `"uri": "__ENV_STREAM1_MPD__"` and `"keys": "__ENV_STREAM1_KEYS__"` (and same for 2 and 3).

The build script will replace those with the values from `.env`.

---

## 5. Run the build

In the same folder:

```bash
node build.js
```

You should see: `Done. Encoded 3 match(es) into pakistan-team-live.html`

---

## 6. Test locally (use a local web server)

**Do not** double-click `pakistan-team-live.html` (that opens it as `file://`). The stream CDN and the browser often block `file://` (CORS / secure context). So local playback will fail when opened as a file.

**Use a local web server** so the page is served over `http://localhost` (same behaviour as on GitHub Pages):

1. In the project folder (`PakistanTeamLive`), run:
   ```bash
   npx serve .
   ```
   (If you don’t have Node, install it first. First run may ask to install `serve` — type `y`.)

2. Open in the browser: **http://localhost:3000/pakistan-team-live.html** (or the port shown in the terminal).

3. Click the first match (Netherlands vs Namibia). The stream should load if the MPD and keys are correct.

**Alternative:** In VS Code, install the “Live Server” extension, right‑click `pakistan-team-live.html` → “Open with Live Server”. Then test from the URL it opens (e.g. `http://127.0.0.1:5500/...`).

Once it works on `http://localhost`, it will behave the same after you push and open the GitHub Pages URL.

---

## 7. Push to GitHub (no secrets in the repo)

Only push the built page and other **non-secret** files. Do **not** add `.env` or `matches-config.json`:

```bash
git add pakistan-team-live.html index.html build.js matches-config.example.json .gitignore .env.example GITHUB-PAGES.md SETUP-STREAMS.md
git status
```

Confirm that `.env` and `matches-config.json` do **not** appear under “Changes to be committed”. Then:

```bash
git commit -m "Update streams"
git push
```

`.env` and `matches-config.json` stay only on your PC; the site uses the encoded data inside `pakistan-team-live.html`.

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | Copy `.env.example` → `.env` |
| 2 | Convert key lines `keyId:key` into one-line JSON `{"keyId":"key",...}` |
| 3 | Put MPD URL in `STREAM1_MPD` and keys JSON in `STREAM1_KEYS` in `.env` |
| 4 | Copy `matches-config.example.json` → `matches-config.json` |
| 5 | Run `node build.js` |
| 6 | Run `npx serve .` and open http://localhost:3000/pakistan-team-live.html to test |
| 7 | `git add` only the files listed above, then `git commit` and `git push` |

---

## If you get new keys later

1. Edit **`.env`** (update `STREAM1_KEYS` or add another stream).
2. Run **`node build.js`** again.
3. Commit and push **`pakistan-team-live.html`** only.

Never commit `.env` or `matches-config.json`.
