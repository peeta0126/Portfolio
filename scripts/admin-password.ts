import { createInterface } from "node:readline/promises";
import { hashPassword } from "../lib/automation/session";
async function main() {
const rl=createInterface({input:process.stdin,output:process.stdout});
try {
  const password=await rl.question("New admin password (at least 16 characters; use a private terminal): ");
  if (password.length<16) throw new Error("Use at least 16 characters");
  console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}`);
} finally { rl.close(); }
}
main().catch(()=>{console.error("Password hash generation failed. Use at least 16 characters.");process.exitCode=1;});
