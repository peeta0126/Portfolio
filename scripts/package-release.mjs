import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root=process.cwd();
const manifestPath="artifacts/release/source-manifest.json";
if(process.argv[2]==="chunk") {
  const manifest=JSON.parse(await readFile(manifestPath,"utf8"));
  const index=Number(process.argv[3]),offset=Number(process.argv[4]),entry=manifest.files[index];
  if(!entry||!Number.isSafeInteger(offset)||offset<0)throw new Error("INVALID_CHUNK");
  const bytes=await readFile(path.join(root,entry.file));
  if(createHash("sha1").update(bytes).digest("hex")!==entry.sha)throw new Error("SOURCE_CHANGED_REPACKAGE");
  process.stdout.write(bytes.toString("base64").slice(offset,offset+8192));
} else {
  const selected=[];
  async function visit(directory) {
    for(const item of await readdir(directory,{withFileTypes:true})) {
      const file=path.join(directory,item.name);
      if(item.isSymbolicLink())throw new Error("SYMLINK_IN_RELEASE");
      if(item.isDirectory())await visit(file);else if(item.isFile())selected.push(file.replaceAll("\\","/"));
    }
  }
  for(const directory of ["app","components","data","lib","public","sections","types"])await visit(directory);
  selected.push("package.json","package-lock.json","next.config.ts","next-env.d.ts","tsconfig.json","postcss.config.mjs","tailwind.config.ts","eslint.config.mjs","vercel.json");
  const files=[];
  for(const file of selected.sort()) {
    if(/(^|\/)(?:\.env|\.git|artifacts|backups)/.test(file))throw new Error("PRIVATE_RELEASE_FILE");
    const bytes=await readFile(file);
    files.push({file,size:bytes.length,sha:createHash("sha1").update(bytes).digest("hex"),base64Length:4*Math.ceil(bytes.length/3)});
  }
  await mkdir("artifacts/release",{recursive:true});
  const manifest={projectId:"prj_r7sCHCSHUjSUqjSzoOwwfPuWs0Vl",teamId:"team_hbhImSBWczhuuhg2g8oKMnTJ",productionDomain:"portfolio-iota-sage-3jin175bbg.vercel.app",createdAt:new Date().toISOString(),files};
  await writeFile(manifestPath,JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({files:files.length,bytes:files.reduce((sum,f)=>sum+f.size,0),manifest:manifestPath,excluded:".env / artifacts / backups / docs / tests / scripts / node_modules / .git"}));
}
