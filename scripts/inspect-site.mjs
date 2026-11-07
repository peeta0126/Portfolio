import { readFile, writeFile, mkdir } from "node:fs/promises";
const origin="https://portfolio-iota-sage-3jin175bbg.vercel.app";
const saved=JSON.parse(await readFile("artifacts/portfolio-research.json","utf8"));
await mkdir("artifacts/research/site",{recursive:true});
for(const path of ["/",...saved.projects.map(p=>`/projects/${p.slug}`)]) {
  try {
    const response=await fetch(origin+path,{signal:AbortSignal.timeout(15000)});
    const html=await response.text();
    await writeFile(`artifacts/research/site/${path==="/"?"home":path.split("/").at(-1)}.html`,html);
    console.log(JSON.stringify({path,status:response.status,title:html.match(/<title>(.*?)<\/title>/)?.[1],bytes:html.length}));
  } catch(error){console.log(JSON.stringify({path,error:error.cause?.code??"FETCH_FAILED"}));process.exitCode=1;break;}
}
