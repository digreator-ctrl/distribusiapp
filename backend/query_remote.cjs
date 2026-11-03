const cp = require('child_process');

try {
  const batches = cp.execSync('npx wrangler d1 execute distribusiapp-db --remote --command "SELECT * FROM inbound_batches;" --json', { cwd: __dirname }).toString();
  console.log("Batches:", batches);
  const products = cp.execSync('npx wrangler d1 execute distribusiapp-db --remote --command "SELECT * FROM products;" --json', { cwd: __dirname }).toString();
  console.log("Products:", products);
  const tenants = cp.execSync('npx wrangler d1 execute distribusiapp-db --remote --command "SELECT * FROM tenants;" --json', { cwd: __dirname }).toString();
  console.log("Tenants:", tenants);
} catch (e) {
  console.error("Error:", e.message);
  if (e.stdout) console.log("stdout:", e.stdout.toString());
  if (e.stderr) console.log("stderr:", e.stderr.toString());
}
