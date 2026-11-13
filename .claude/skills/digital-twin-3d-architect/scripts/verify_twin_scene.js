#!/usr/bin/env node
// Valida um gémeo digital HTML: UTF-8 sem U+FFFD, tamanho <= 16 MiB, importmap coerente e
// zero erros de consola/WebGL no Chromium via Playwright (se disponível).
// Uso: node verify_twin_scene.js <ficheiro.html>
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('Uso: node verify_twin_scene.js <ficheiro.html>'); process.exit(2); }
const abs = path.resolve(file);
const buf = fs.readFileSync(abs);
const problems = [];

const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
if (text.includes('�')) problems.push('Contém U+FFFD (UTF-8 inválido ou carácter de substituição).');
if (buf.length > 16 * 1024 * 1024) problems.push(`Tamanho ${buf.length} bytes excede 16 MiB.`);
else if (buf.length > 10 * 1024 * 1024) console.warn(`Aviso: ${buf.length} bytes (> meta de 10 MiB).`);

const versions = new Set([...text.matchAll(/three@([0-9.]+)/g)].map(m => m[1]));
if (versions.size > 1) problems.push(`Versões de three misturadas: ${[...versions].join(', ')}`);
if (/esm\.sh/.test(text) && /jsdelivr|unpkg/.test(text)) problems.push('Mistura esm.sh com outra CDN.');
if (/THREE\.Clock\b/.test(text)) problems.push('Usa THREE.Clock obsoleto (use THREE.Timer).');
if (/three@0\.1[0-4][0-9]\./.test(text)) problems.push('Versão legada de three (< r150).');

(async () => {
  let pw;
  try { pw = require('playwright'); } catch { console.warn('Playwright indisponível: só verificação estática.'); }
  if (pw) {
    const browser = await pw.chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport: vp });
      page.on('console', m => {
        if (m.type() === 'error' || /WebGL|THREE\.WARNING|Multiple instances/.test(m.text()))
          problems.push(`[${vp.width}px] consola ${m.type()}: ${m.text()}`);
      });
      page.on('pageerror', e => problems.push(`[${vp.width}px] pageerror: ${e.message}`));
      await page.goto('file://' + abs, { waitUntil: 'load' });
      await page.waitForTimeout(2500);
      const hasCanvas = await page.$('canvas');
      if (!hasCanvas) problems.push(`[${vp.width}px] nenhum <canvas> renderizado.`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) problems.push(`[${vp.width}px] scroll horizontal na página.`);
      await page.close();
    }
    await browser.close();
  }
  if (problems.length) { console.error('FALHOU:\n- ' + problems.join('\n- ')); process.exit(1); }
  console.log('OK: cena validada sem erros.');
})();
