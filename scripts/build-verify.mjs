import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
const originalEnvTypes=await readFile("next-env.d.ts","utf8");
const child=spawn(process.execPath,["node_modules/next/dist/bin/next","build"],{stdio:"inherit",windowsHide:true,env:{...process.env,PORTFOLIO_VERIFY_BUILD:"1"}});
child.on("exit",async code=>{
  const current=await readFile("next-env.d.ts","utf8");
  if (current.includes('./.next-verify/types/routes.d.ts')) await writeFile("next-env.d.ts",originalEnvTypes);
  process.exitCode=code ?? 1;
});
