import { test, expect } from "@playwright/test";

test("2차 UI 검토: 정리된 원고·이미지·4개 사례·모든 상세·테마별 전체 캡처",async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:"reduce"});
  for(const theme of ["light","dark"]) for(const width of [375,768,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.addInitScript(value=>localStorage.setItem("theme",value),theme);
    await page.goto("/");
    await expect(page.locator("#projects article")).toHaveCount(7);
    await expect(page.locator("#problem-solving article")).toHaveCount(4);
    await expect(page.locator("main")).not.toContainText(/기간 확인|개발 기간 확인/);
    for(const image of await page.locator("main img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
    }
    await expect(page.locator("#projects article img")).toHaveCount(6);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const heights=await page.locator("#projects > div > div:nth-of-type(2) article").evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
    if(width===1440 && heights.length===3) expect(Math.max(...heights)-Math.min(...heights)).toBeLessThan(2);
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:`artifacts/second-pass/home-${width}-${theme}.png`,fullPage:true});
    if(width===1440 && theme==="light") {
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:"artifacts/second-pass/hero-desktop.png"});
      for(const id of ["projects","problem-solving","skills","ai-experience","contact"]) await page.locator(`#${id}`).screenshot({path:`artifacts/second-pass/section-${id}.png`});
    }
    if(width===375 && theme==="light") {
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:"artifacts/second-pass/hero-mobile.png"});
    }
  }
  for(const width of [375,1440]) for(const theme of ["light","dark"]) {
    await page.setViewportSize({width,height:1000});
    await page.addInitScript(value=>localStorage.setItem("theme",value),theme);
    for(const slug of ["starlight-tarot","github-1407847850","github-1431052115"]) {
      await page.goto(`/projects/${slug}`);
      for(const image of await page.locator("main img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
      }
      await expect(page.locator(".architecture-flow")).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`artifacts/second-pass/detail-${slug}-${width}-${theme}.png`,fullPage:true});
    }
  }
  await page.setViewportSize({width:375,height:1000});
  await page.goto("/problem-solving");
  await expect(page.locator("main article")).toHaveCount(10);
  await expect(page.locator("main")).toContainText("발사력 UI 초기화");
  await expect(page.locator("main")).toContainText("동결 상태에서 턴 진행");
  for(const link of await page.locator("main article a[href^='/projects/']").all()) expect((await page.request.get(await link.getAttribute("href") ?? "")).ok()).toBe(true);
  await page.screenshot({path:"artifacts/second-pass/all-problems-mobile-dark.png",fullPage:true});
  expect(errors).toEqual([]);
});
