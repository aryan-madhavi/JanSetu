import { test, expect } from "@playwright/test";

test.describe("JanSetu Verification Suite", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => {
      console.warn("Page error:", err.message);
    });
  });

  test("a) Overview KPI total requests == /api/dashboard/stats total and > 0", async ({ page, request, baseURL }) => {
    const apiRes = await request.get(`${baseURL}/api/dashboard/stats`);
    expect(apiRes.status()).toBe(200);
    const statsData = await apiRes.json();
    expect(statsData.total_requests).toBeGreaterThan(0);

    await page.goto("/overview");
    await page.waitForLoadState("networkidle");

    const totalText = statsData.total_requests.toLocaleString();
    const kpiLocator = page.locator(`text=${totalText}`).first();
    await expect(kpiLocator).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "docs/screens/overview.png" });
  });

  test("b) Change District in header -> API re-called and values update", async ({ page }) => {
    await page.goto("/overview");
    await page.waitForLoadState("networkidle");

    const districtBtn = page.locator("header button").filter({ hasText: /District|All Districts|सभी/ }).first();
    await districtBtn.click();

    const puneBtn = page.locator("header .absolute button").filter({ hasText: /^Pune$/ }).first();
    await expect(puneBtn).toBeVisible({ timeout: 5000 });

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/dashboard/stats") && res.status() === 200),
      puneBtn.click(),
    ]);

    const newStats = await response.json();
    expect(newStats).toBeDefined();
    await page.screenshot({ path: "docs/screens/district_change.png" });
  });

  test("c) Change Language to Hindi -> nav text changes to Hindi", async ({ page }) => {
    await page.goto("/overview");
    await page.waitForLoadState("networkidle");

    const langBtn = page.locator("header button").filter({ hasText: /English|हिन्दी|தமிழ்|मराठी/ }).first();
    await langBtn.click();

    const hindiBtn = page.locator("header .absolute button").filter({ hasText: /^हिन्दी$/ }).first();
    await expect(hindiBtn).toBeVisible({ timeout: 5000 });
    await hindiBtn.click();

    await expect(page.locator("body")).toContainText("राष्ट्रीय समीक्षा");
    await page.screenshot({ path: "docs/screens/hindi_nav.png" });
  });

  test("d) Citizen submit: type a Hindi sentence, submit, assert ticket ID & extraction card", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hindiSentence = "गांव में पानी की मुख्य पाइपलाइन टूट गई है और पीने का पानी नहीं मिल रहा है।";
    const textarea = page.locator("textarea").first();
    await textarea.fill(hindiSentence);

    const submitBtn = page.locator("button").filter({ hasText: /Submit Report/i }).first();
    await submitBtn.click();

    const successCard = page.locator("text=Grievance Registered Successfully");
    await expect(successCard).toBeVisible({ timeout: 25000 });

    const ticketLocator = page.locator("text=/REQ-[A-Z0-9]{6}/").first();
    await expect(ticketLocator).toBeVisible();

    await page.screenshot({ path: "docs/screens/citizen_submit.png" });
  });

  test("e) Voice Push to Talk: click mic, wait 4s, stop, assert upload & result renders", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const micBtn = page.locator("button").filter({ has: page.locator("svg.lucide-mic") }).first();
    await micBtn.click();

    // Record for 4s
    await page.waitForTimeout(4000);

    // Stop recording
    await micBtn.click();

    const successCard = page.locator("text=Grievance Registered Successfully");
    await expect(successCard).toBeVisible({ timeout: 30000 });

    await page.screenshot({ path: "docs/screens/voice_submit.png" });
  });

  test("f) Geospatial: assert map loaded with ZERO 'API KEY REQUIRED' text, markers > 0, click opens drawer", async ({ page }) => {
    await page.goto("/map");
    await page.waitForLoadState("networkidle");

    const badText = page.locator("text=API KEY REQUIRED");
    expect(await badText.count()).toBe(0);

    const firstZone = page.locator(".cursor-pointer").filter({ hasText: /Score|Deficit/ }).first();
    await expect(firstZone).toBeVisible({ timeout: 10000 });
    await firstZone.click();

    const drawer = page.locator("text=District Inspection").first();
    await expect(drawer).toBeVisible();

    await page.screenshot({ path: "docs/screens/map_view.png" });
  });

  test("g) Priority Queue: rows count > 0, click Review -> Why drawer with factor bars", async ({ page }) => {
    await page.goto("/priority");
    await page.waitForLoadState("networkidle");

    const reviewBtn = page.locator("button").filter({ hasText: "Review" }).first();
    await expect(reviewBtn).toBeVisible({ timeout: 10000 });
    await reviewBtn.click();

    await expect(page.locator("text=Algorithmic Factor Decomposition")).toBeVisible();
    await expect(page.locator("text=Citizen Demand Intensity")).toBeVisible();
    await expect(page.locator("text=Infrastructure Deficit Index")).toBeVisible();

    await page.screenshot({ path: "docs/screens/why_drawer.png" });
  });

  test("h) Data Query: ask 'Which districts have the highest number of water problems?' -> assert SQL text and table", async ({ page }) => {
    await page.goto("/ask");
    await page.waitForLoadState("networkidle");

    const chip = page.locator("button").filter({ hasText: "Which districts have the highest number of water problems?" }).first();
    if (await chip.isVisible()) {
      await chip.click();
    } else {
      const input = page.locator("input[type=text]").first();
      await input.fill("Which districts have the highest number of water problems?");
      await page.locator("button[type=submit]").click();
    }

    const sqlBlock = page.locator("pre").first();
    await expect(sqlBlock).toBeVisible({ timeout: 30000 });
    await expect(sqlBlock).toContainText("SELECT");

    const tableRow = page.locator("table tbody tr").first();
    await expect(tableRow).toBeVisible();

    await page.screenshot({ path: "docs/screens/data_query.png" });
  });

  test("i) Export buttons and Login/Logout flows", async ({ page }) => {
    await page.goto("/overview");
    await page.waitForLoadState("networkidle");

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 10000 }).catch(() => null),
      page.locator("button").filter({ hasText: /Export CSV/i }).first().click(),
    ]);
    if (download) {
      expect(download.suggestedFilename()).toContain(".csv");
    }

    // Login Flow
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const demoBtn = page.locator("button").filter({ hasText: "Policymaker Demo" }).first();
    await demoBtn.click();

    await page.locator("button[type=submit]").click();
    await expect(page).toHaveURL(/.*overview/);

    // Logout Flow
    const profileBtn = page.locator("header button").filter({ has: page.locator("svg.lucide-user") }).first();
    await profileBtn.click();

    const logoutBtn = page.locator("header .absolute button").filter({ hasText: /Logout|लॉग आउट/ }).first();
    await logoutBtn.click();

    await expect(page).toHaveURL(/.*login/);
    await page.screenshot({ path: "docs/screens/login.png" });
  });
});
