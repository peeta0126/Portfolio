import { chromium } from 'playwright';
import fs from 'node:fs/promises';

(async () => {
  const browser = await chromium.launch({headless:true});
  try {
  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await page.goto('https://crew-space-nine.vercel.app/',{waitUntil:'networkidle'});
  await page.screenshot({path:'public/projects/crewspace-screen.png'});
  console.log(JSON.stringify({url:page.url(),title:await page.title(),text:(await page.locator('body').innerText()).slice(0,500)}));
  await fs.copyFile('artifacts/refresh/preview-hero-1440.png','public/projects/portfolio-screen.png');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error.message);process.exitCode=1});
