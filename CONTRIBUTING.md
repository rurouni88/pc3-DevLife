# 🧑‍💻 Contributing

## 📁 File Structure

See the [README's File Structure section](README.md#-file-structure) for the complete layout. In short:
- **Source:** `src/js/` (TypeScript), `src/data/events/` (event JSON), `src/css/`, `src/index.html`
- **Build output:** `dist/` (gitignored)
- **Tests:** `test/`
- **CI/CD:** `.github/workflows/`

## 🚀 Deployment

### GitHub Pages (Recommended)

The site is built before it's served: `tsc` compiles the TypeScript to plain
JS in `dist/`, and `assemble-dist.js` adds `index.html`, `css/`, and the event
JSON. A GitHub Actions workflow (`.github/workflows/pages.yml`) runs this build
and uploads the finished `dist/` to GitHub Pages on every push to `main`.

To enable it (one-time):
1. Push this repo to GitHub
2. Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically
4. Your game will be live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```

### Local Development

Build the site into `dist/`, then serve `dist/` over HTTP (opening the page
directly via `file://` won't work — the event files are loaded with `fetch()`):

```bash
npm install      # installs TypeScript (dev dependency only)
npm run dev      # build + assemble into dist/, print the serve command, then watch
```

In a second terminal, serve the built site and open `http://localhost:8000`:

```bash
python3 -m http.server 8000 --directory dist    # or: npx serve dist
```

Use `http://`, not `https://` — the local server speaks HTTP only.

## 🛠️ Tech Stack

- **HTML5 / CSS3 / TypeScript** — No frameworks; a `tsc` build step compiles the TS source to plain, module-free JS in `dist/`
- **TypeScript** — Full `strict` type checking + a build step (`tsc`) that emits plain JS (no bundler, `file://`-safe)
- **Web Audio API** — 8 synthesized sound effects, no audio files
- **Node VM test suite** — Core game logic tested against the built output, without a browser or framework
- **LocalStorage** — Save games and meta-progression
- **Single-Page Application** — Screen-based navigation
- **Mobile-First Responsive Design** — Works on all screen sizes

## 🧪 Building & Verifying

DevLife is a static site with a single build step: `tsc` compiles the
TypeScript source in `src/js/` to plain, module-free JavaScript in `dist/`. The
browser and the tests both load the built output, so you always verify what
ships:

```bash
npm install          # installs TypeScript (dev dependency only)
npm run dev          # build + assemble into dist/, print the serve command, then watch
npm run build        # one-off build to dist/
npm run assemble     # add index.html, css/, and event JSON to dist/ (for deployment)
npm run typecheck    # type-check without emitting
npm test             # build + assemble, then run the core + smoke tests against dist/
```

- The source is TypeScript (`src/js/*.ts`) under full `strict` checking; [`src/js/types.ts`](src/js/types.ts) holds the shared types (interfaces — no runtime code).
- [`tsconfig.json`](tsconfig.json) is the type-checker config (`noEmit`); [`tsconfig.build.json`](tsconfig.build.json) extends it to emit to `dist/`.
- The emitted JS is plain scripts (no `import`/`export`), so the game needs no bundler and still works from `file://`.
- Tests live in [`test/`](test/): the logic modules run in a Node VM context with stubbed browser globals, loaded from the **built** `dist/js/`, so the rules (stat checks, perk activation and grace rules, equipment drops, carry-over) are verified against exactly what ships.
- A smoke test ([`test/smoke.test.js`](test/smoke.test.js)) verifies the built `dist/` is a self-contained, deployable site — every referenced script/style and runtime-fetched event is present (checks the filesystem, no live server).
- CI (`.github/workflows/ci.yml`) runs `npm run typecheck` and `npm test` on every push to `main` and on all pull requests (Node 20, two jobs).
- Deployment (`.github/workflows/pages.yml`) builds the site and uploads `dist/` to GitHub Pages on every push to `main`.

## 📋 Roadmap

This is a prototype/vertical slice. Planned features:

- [ ] Achievement system
- [ ] Animated transitions
- [ ] More events (50+ per phase)
- [ ] Export/share career summaries

Current state:
- 57 events across 4 career phases (13–16 per phase)
- Boss events ending each phase ✓
- d20 stat checks with competence gate and saving rolls ✓
- Perk system with once-per-run interventions ✓
- Meta progression: carry equipment/consumables between runs ✓
- Synthesized sound effects ✓
