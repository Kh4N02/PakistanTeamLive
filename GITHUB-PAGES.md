# Host T20 World Cup Live on GitHub Pages

Host your page so you get a **GitHub URL** (e.g. `https://yourusername.github.io/t20live/`) that you can share on Telegram. You choose the repo name with your friends to get a clean link.

---

## 1. Create a GitHub repo (for the live page only)

1. On GitHub: **New repository**.
2. **Repository name**: e.g. `t20live` or `t20wc-live` (this becomes part of your URL).
3. **Public**, no README (or add one later).
4. Create the repo.

Your live URL will be:

- **`https://<your-username>.github.io/<repo-name>/`**  
  Example: `https://johndoe.github.io/t20live/`

---

## 2. Push the page to the repo

From your machine (PowerShell or Git Bash), in the folder that contains `pakistan-team-live.html`:

```bash
cd "d:\Cricket Matches-Shots\Scripts"

git init
git add pakistan-team-live.html index.html
git commit -m "T20 WC live page"

git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and the repo name you chose.

---

## 3. Turn on GitHub Pages

1. In the repo: **Settings** → **Pages** (left sidebar).
2. **Source**: **Deploy from a branch**.
3. **Branch**: `main` (or `master`) → **/ (root)**.
4. **Save**.

After a minute or two, your site will be at:

**`https://<your-username>.github.io/<repo-name>/`**

- **Root URL** (with the included `index.html`):  
  **`https://<your-username>.github.io/<repo-name>/`**  
  This redirects to the live page. Share this link with your Telegram channels.

- **Direct link**:  
  **`https://<your-username>.github.io/<repo-name>/pakistan-team-live.html`**

---

## 4. (Optional) Custom domain

If you have a domain (e.g. `t20wc.yourdomain.com`):

1. In the repo: **Settings** → **Pages**.
2. Under **Custom domain**, enter the domain and save.
3. In your domain DNS, add a **CNAME** record pointing that subdomain to `YOUR_USERNAME.github.io`.

GitHub will then serve your site on that URL (may take a few minutes to propagate).

---

## 5. Daily updates — use external config (recommended)

Match data (titles, dates, images, MPD/keys) is kept in an **external file** so you never edit the HTML by hand. You edit the config, run a build, then push only the HTML. The raw config is **not** in the repo (so people can't open it on GitHub).

### One-time setup

1. **Create your private config** (this file is in `.gitignore` and is never pushed):
   - Copy `matches-config.example.json` to `matches-config.json`.
   - Fill in your 3 matches. Each object can include:
     - `title`, `date`, `venue`, `status` (`"live"` or `"upcoming"`), `tournament`, `description`
     - `image` — URL for the card background
     - `flags` — e.g. `["🇵🇰", "🇺🇸"]`
     - **`manifest`** — the stream for Shaka Player (MPD = DASH manifest), e.g. `"manifest": { "uri": "__ENV_STREAM1_MPD__" }`.
     - **`keys`** — Shaka clearKeys as one-line JSON. Your source often gives lines like `keyIdHex:keyHex`; convert to `{"keyIdHex":"keyHex",...}` and put in `.env` as `STREAM1_KEYS=...`, then in config `"keys": "__ENV_STREAM1_KEYS__"`.
     - To keep MPD and keys **out of the config file**, put them in **`.env`** and use placeholders: `__ENV_STREAM1_MPD__`, `__ENV_STREAM1_KEYS__`, etc. Copy `.env.example` to `.env` and fill in real values; **never commit `.env`** (it is in `.gitignore`). See **SETUP-STREAMS.md** for a full step-by-step.
   - To start from your current live page: open the page in the browser, DevTools → Console, run:  
     `copy(JSON.stringify(window._s))`  
     then paste into `matches-config.json` (as a JSON array) and add/update `image` URLs as you like.

2. **Build** (encodes the config and injects it into the HTML):
   ```bash
   node build.js
   ```

3. **Push only the HTML** (do not add `matches-config.json`):
   ```bash
git add pakistan-team-live.html index.html build.js matches-config.example.json .gitignore
  git commit -m "Update streams"
  git push
  ```
  (Do **not** add `matches-config.json` or `.env` — both are in `.gitignore` and stay only on your machine.)

### When you need to change matches

- Edit **`matches-config.json`** (titles, dates, venue, images, manifest, etc.).
- Run **`node build.js`**.
- Commit and push **`pakistan-team-live.html`** (and optionally `index.html`).

GitHub Pages will redeploy. The link (e.g. `https://yourusername.github.io/t20live/pakistan-team-live.html`) stays the same.

### What gets encoded

- The build script loads `.env`, then reads `matches-config.json` and replaces any `__ENV_VARNAME__` with the value from `.env`. The resulting array is then **JSON → base64 → reverse** and embedded in `pakistan-team-live.html`.
- So in the repo, people see only the encoded blob in the HTML; they cannot open `matches-config.json` or `.env` on GitHub (both are in `.gitignore`). Your secrets stay in `.env` and the config file on your machine only.

### Keeping MPD and keys safe

- **Yes, manifest is the MPD** (DASH manifest URL). Keys or auth are usually passed via **headers** (e.g. `Authorization: Bearer ...`) in the manifest object.
- Put MPD URLs and auth/keys in **`.env`** and reference them in the config as `__ENV_STREAM1_MPD__`, `__ENV_STREAM1_AUTH__`, etc. Never commit `.env`; the build script injects those values when you run `node build.js`.
- **Note:** The built HTML that you push still contains the encoded payload (with the substituted values). So anyone who opens the live page can recover the stream data via dev tools. For a private Telegram audience this is a common trade-off; for stronger protection you’d need a backend that serves keys only to authenticated users.

---

## Security note (MPD/keys)

- Stream URLs and keys are **not** stored in plain text; they exist only inside the **encoded** payload in the HTML (and in your local `matches-config.json`, which is not pushed). They are not visible in a simple “View Page Source” or by searching the repo for “.mpd” or “keys”.
- Anyone who can open the page in a browser can still recover the stream data with dev tools (e.g. `window._s`). For a private audience (e.g. your Telegram channels), this is a reasonable trade-off; for stronger protection you’d need a backend that serves keys only to authenticated users.
