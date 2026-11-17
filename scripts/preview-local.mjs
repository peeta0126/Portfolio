import { spawn } from "node:child_process";

// Empty variables override .env.local so this preview cannot use production services.
const preview = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3108"], {
  stdio: "inherit",
  windowsHide: true,
  env: {...process.env, PORTFOLIO_VERIFY_BUILD:"1", DATABASE_URL:"", OPENAI_API_KEY:"", GITHUB_TOKEN:"", ADMIN_PASSWORD_HASH:"", ADMIN_SESSION_SECRET:"", CRON_SECRET:"", GITHUB_WEBHOOK_SECRET:""},
});
preview.on("exit", code => { process.exitCode = code ?? 1; });
process.on("SIGINT", () => preview.kill("SIGINT"));
process.on("SIGTERM", () => preview.kill("SIGTERM"));
