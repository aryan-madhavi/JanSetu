
const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const screenshotDir = "../screenshots";
  if (!fs.existsSync(screenshotDir)){
      fs.mkdirSync(screenshotDir);
  }
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const routes = [
    { path: "", name: "landing" },
    { path: "overview", name: "overview" },
    { path: "feed", name: "feed" },
    { path: "clusters", name: "clusters" },
    { path: "map", name: "map" },
    { path: "mismatch", name: "mismatch" },
    { path: "ask", name: "ask" },
    { path: "channels", name: "channels" }
  ];
  
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of routes) {
    await page.goto(`http://localhost:5173/${route.path}`);
    await page.waitForTimeout(500); 
    await page.screenshot({ path: `${screenshotDir}/desktop_${route.name}.png` });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of routes) {
    await page.goto(`http://localhost:5173/${route.path}`);
    await page.waitForTimeout(500); 
    await page.screenshot({ path: `${screenshotDir}/mobile_${route.name}.png` });
  }

  await browser.close();
  console.log("Screenshots captured successfully.");
})();
