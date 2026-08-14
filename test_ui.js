import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/ongki/Projects/dotads/admin_dashboard.png', fullPage: true });
  await browser.close();
  console.log("Screenshot saved!");
})();
