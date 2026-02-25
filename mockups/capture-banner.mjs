import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'linkedin-banner.html');
const outputPath = path.join(__dirname, 'linkedin-banner.png');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1800, height: 600, deviceScaleFactor: 2 });
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

const banner = await page.$('.banner');
await banner.screenshot({ path: outputPath });

await browser.close();
console.log(`Banner saved to: ${outputPath}`);
