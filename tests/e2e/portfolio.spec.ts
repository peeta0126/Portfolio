import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { contact } from "../../data/contact";

test("프로젝트 우선 구성·대표 순서·반응형·이미지·이력서와 키보드 탐색",async({page,request})=>{
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  for(const dark of [false,true]) for(const width of [375,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.addInitScript(theme=>localStorage.setItem("theme",theme),dark?"dark":"light");
    await page.emulateMedia({reducedMotion:"reduce"});
    await page.goto("/");
    const featured=page.locator("#projects article h4");
    expect((await featured.allTextContents()).slice(0,3)).toEqual(["별빛 타로","Focus Hub","증강 알까기"]);
    expect(await page.locator("#projects").evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('#skills')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator("html")).toHaveClass(dark?/dark/:/^$/);
    await page.screenshot({path:`artifacts/refresh/home-${width}-${dark?'dark':'light'}.png`,fullPage:true});
  }
  for(const image of await page.locator("#projects img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  }
  const resume=await request.get("/resume.pdf");
  expect(resume.status()).toBe(200);
  expect((await resume.body()).subarray(0,4).toString()).toBe("%PDF");
  expect(await resume.body()).toEqual(await readFile("public/resume.pdf"));
  await expect(page.locator("#contact").getByRole("link",{name:/Email/})).toHaveAttribute("href",`mailto:${contact.email}`);
  await page.goto("/");await page.keyboard.press("Tab");
  await expect(page.getByText("본문으로 건너뛰기",{exact:true})).toBeFocused();
  const style=await page.locator(":focus").evaluate(el=>getComputedStyle(el).outlineStyle);
  expect(style).not.toBe("none");
  await page.locator("#problem-solving h3 a").first().click();
  await expect(page).toHaveURL(/\/projects\/starlight-tarot#problem-solving/);
  await expect(page.locator("#problem-solving")).toContainText("33.2%");
  await expect(page.getByRole("link",{name:"성능 측정 문서 ↗",exact:true})).toBeVisible();
  await expect(page.locator("#verification")).toContainText("6회");
  expect(errors).toEqual([]);
});
