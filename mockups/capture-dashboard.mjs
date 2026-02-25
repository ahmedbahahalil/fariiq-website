import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

const filePath = path.join(__dirname, 'dashboard-mockup-linkedin.html');
await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

await page.screenshot({
  path: path.join(__dirname, 'fariiq-dashboard-mockup.png'),
  clip: { x: 0, y: 0, width: 1280, height: 800 }
});

console.log('Screenshot saved: fariiq-dashboard-mockup.png');
await browser.close();
