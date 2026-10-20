// 逐帧渲染：无头 Chromium 打开模板网页，用固定步长推进模拟并截图，同时离线混出配乐 WAV。
// 用法：node render_frames.js <index.html 绝对路径> [输出目录=frames] [--nocap] [--fps=30] [--shim=p5-shim.js]
// 依赖：npm i playwright（并安装 Chromium）。若网络打不开 p5 的 CDN，可用 --shim 指定本地 p5.min.js 或测试替身。
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('请先 npm i playwright'); process.exit(1); }
const args = process.argv.slice(2), file = args[0], out = args[1] && !args[1].startsWith('--') ? args[1] : 'frames';
const opt = k => (args.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const fps = +(opt('fps') || 30), shim = opt('shim'), nocap = args.includes('--nocap');
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 720, height: 960 }, deviceScaleFactor: 1.5 });   // 输出 1080×1440
  p.on('pageerror', e => console.log('ERR', e.message));
  if (shim) await p.route('**/p5.min.js', r => r.fulfill({ body: fs.readFileSync(shim), contentType: 'text/javascript' }));
  await p.goto('file://' + path.resolve(file) + (nocap ? '?nocap' : ''));
  await p.waitForTimeout(800);
  await p.evaluate(() => { noLoop(); const u = document.getElementById('ui'); if (u) u.style.display = 'none'; window.__beginRender(); });
  fs.mkdirSync(out, { recursive: true });
  const N = Math.round(await p.evaluate(() => DUR) * fps);
  for (let i = 0; i < N; i++) {
    await p.evaluate(f => window.__frame(f), fps);
    await p.screenshot({ path: `${out}/${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
    if (i % 300 === 0) console.log('frame', i, '/', N);
  }
  const a = await p.evaluate(() => window.__renderAudio());
  const pcm = Buffer.from(a.b64, 'base64'), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(a.sr, 24); h.writeUInt32LE(a.sr * 4, 28);
  h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync('score.wav', Buffer.concat([h, pcm]));
  console.log('done: frames ->', out, ', audio -> score.wav');
  await b.close();
})();
