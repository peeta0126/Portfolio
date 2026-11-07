import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"tests/e2e",fullyParallel:false,workers:1,timeout:45000,
  use:{baseURL:"http://127.0.0.1:3107",viewport:{width:1440,height:1000},trace:"retain-on-failure"},
  webServer:{command:"node --import tsx scripts/test-server.ts",url:"http://127.0.0.1:3107",reuseExistingServer:false,timeout:90000},
});
