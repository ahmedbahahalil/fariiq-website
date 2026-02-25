import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';

const imgPath = '/Users/ahmedhalil/Desktop/li-post-db.png';

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; }
  body { display: inline-block; position: relative; line-height: 0; }
  img { display: block; }
  .watermark {
    position: absolute;
    bottom: 60px;
    right: 64px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 48px;
    font-weight: 700;
    color: rgba(184, 153, 111, 0.85);
    letter-spacing: 2px;
    text-transform: lowercase;
    background: rgba(255, 255, 255, 0.92);
    padding: 16px 36px;
    border-radius: 16px;
    border: 2px solid rgba(184, 153, 111, 0.35);
    box-shadow: 0 4px 20px rgba(184, 153, 111, 0.2);
  }
</style>
</head>
<body>
  <img src="file://${imgPath}" />
  <div class="watermark">fariiq.com</div>
</body>
</html>`;

const tmpHtml = '/tmp/fariiq-watermark.html';
writeFileSync(tmpHtml, html);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--allow-file-access-from-files']
});
const page = await browser.newPage();

await page.goto(`file://${tmpHtml}`, { waitUntil: 'load', timeout: 15000 });
await page.waitForSelector('img', { timeout: 10000 });
await page.evaluate(() => {
  return new Promise((resolve) => {
    const img = document.querySelector('img');
    if (img.complete) return resolve();
    img.onload = resolve;
    img.onerror = resolve;
  });
});

const img = await page.$('img');
const box = await img.boundingBox();
const w = Math.ceil(box.width);
const h = Math.ceil(box.height);

console.log(`Image dimensions: ${w}x${h}`);

await page.screenshot({
  path: '/Users/ahmedhalil/Desktop/li-post-db-watermarked.png',
  clip: { x: 0, y: 0, width: w, height: h }
});

console.log('Saved: li-post-db-watermarked.png');
await browser.close();
