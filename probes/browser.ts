import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { canvasUrl, runtime, save } from './api.ts';
import { startDiagnosticServer } from './server.ts';

await mkdir(runtime, { recursive: true, mode: 0o700 });
const service = await startDiagnosticServer({ port: 0, record: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${canvasUrl}/extensions/valtteri-connection/check`, { waitUntil: 'domcontentloaded' });
  const skip = page.getByRole('button', { name: 'Skip for now', exact: true });
  try { await skip.waitFor({ timeout: 5000 }); await skip.click(); } catch { /* Onboarding is absent in an already initialized browser. */ }
  const panel = page.getByRole('region', { name: 'vAltteri connection check' });
  try { await panel.waitFor({ timeout: 20000 }); }
  catch {
    console.log('Extension not mounted. Visible headings:', await page.getByRole('heading').allTextContents());
    console.log('Visible buttons:', await page.getByRole('button').allTextContents());
    throw new Error('Canvas extension did not mount.');
  }
  await panel.getByRole('button', { name: 'Check Canvas backend', exact: true }).click();
  await panel.getByText('Canvas backend: authenticated request succeeded', { exact: true }).waitFor();
  await panel.getByLabel('Service address').fill(service.url);
  await panel.getByLabel('Connection token').fill('incorrect-token');
  await panel.getByRole('button', { name: 'Check service connection', exact: true }).click();
  await panel.getByText('Service: failed · HTTP 401', { exact: true }).waitFor();
  await panel.getByLabel('Connection token').fill(service.token);
  await panel.getByRole('button', { name: 'Check service connection', exact: true }).click();
  await panel.getByText(/^Service: connected/).waitFor();
  const connectionText = await panel.locator('[data-service-status]').innerText();
  await panel.getByLabel('Connection token').fill('');
  await page.screenshot({ path: resolve(runtime, 'canvas-connection.png'), fullPage: true });
  await save('browser-result.json', { recordedAt: new Date().toISOString(), canvasUrl,
    browser: browser.version(), authenticatedCanvasHelper: true, wrongTokenRejected: true,
    serviceConnection: connectionText, screenshot: 'canvas-connection.png' });
  console.log(JSON.stringify({ authenticatedCanvasHelper: true, wrongTokenRejected: true, serviceConnection: connectionText }));
} finally {
  await browser.close(); service.server.closeAllConnections();
  await new Promise<void>(r => service.server.close(() => r()));
}
