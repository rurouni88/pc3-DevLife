#!/usr/bin/env node
// Prints the dev-serve instructions after a build, so the "which directory do
// I serve?" question doesn't come up. Since source moved to src/, the project
// root is no longer a servable site — the runnable site is assembled into dist/.
const port = 8000;
const rule = '─'.repeat(60);
console.log([
  '',
  `  ${rule}`,
  '  DevLife dev build ready — dist/ is up to date.',
  '',
  '  In a SECOND terminal, serve the built site and open it:',
  '',
  `    python3 -m http.server ${port} --directory dist`,
  `    then open  http://localhost:${port}`,
  '',
  '  • Use http://, not https:// (the server speaks HTTP only).',
  '  • Edit a .ts file → auto-rebuilds, just reload the browser.',
  '  • Edit an event JSON or CSS → re-run "npm run assemble", reload.',
  `  ${rule}`,
  '',
  '  Watching for .ts changes… (Ctrl+C to stop)',
  '',
].join('\n'));
