// Runs the API server and the Vite dev server together so `bun run dev`
// is the only command needed for local development.
export {};

const children = [
  Bun.spawn(['bun', '--watch', 'server/index.ts'], { stdout: 'inherit', stderr: 'inherit' }),
  Bun.spawn(['bunx', 'vite'], { stdout: 'inherit', stderr: 'inherit' }),
];

function shutdown() {
  for (const child of children) child.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// If either process dies, stop the other so the failure is obvious.
const exitCode = await Promise.race(children.map((child) => child.exited));
shutdown();
process.exit(exitCode);
