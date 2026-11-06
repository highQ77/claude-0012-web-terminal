/* 左側小工具
 * color json time encode timer regex hash diff password uuid qr units count notes
 * 每個工具：{ title, desc, sub, build(el), show?(), cli?(arg), cliHint? }
 * index.html 以 createTools(ctx) 取得，ctx 提供 esc、store、print、kv
 */
window.createTools = function (ctx) {
  const { esc, store } = ctx;
  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => [...root.querySelectorAll(sel)];
  const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const attr = s => esc(String(s)).replace(/'/g, '&#39;');

  async function copyText(text, btn) {
    let ok = false;
    try {
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, r) => setTimeout(r, 1500))]);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch {}
      ta.remove();
    }
    if (btn) {
      const old = btn.textContent;
      btn.textContent = ok ? '已複製' : '複製失敗';
      setTimeout(() => { btn.textContent = old; }, 1200);
    }
    return ok;
  }
  function download(name, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  // 「名稱 / 值 / 複製」列
  const rows = list => list.map(([k, v]) =>
    `<div class="trow"><span class="tl">${esc(k)}</span><code class="tv">${esc(v)}</code><button class="btn sm" data-copy='${attr(v)}'>複製</button></div>`).join('');

  // 不偏差的密碼學亂數整數 [0, n)
  function randInt(n) {
    const max = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= max);
    return buf[0] % n;
  }
  const bytesToHex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');

  /* ======================= color ======================= */
  const color = {
    title: '顏色工具', desc: '顏色格式轉換、對比度檢查與色階',
    sub: 'HEX / RGB / HSL / OKLCH 轉換、WCAG 對比度與色階',
    build(el) {
      const canEye = 'EyeDropper' in window;
      el.innerHTML = `
        <div class="tgrid cols2">
          <div class="panel">
            <div class="swatch-big" id="cSw"></div>
            <div class="btnrow" style="margin-top:12px">
              <input type="color" id="cPick" class="colorin" aria-label="選擇顏色">
              <input class="in grow mono" id="cText" spellcheck="false" placeholder="任何 CSS 顏色，如 tomato、rgb(0 0 0)">
              ${canEye ? '<button class="btn" id="cDrop" title="從螢幕上任意位置取色">取色</button>' : ''}
            </div>
            <div class="status" id="cErr"></div>
          </div>
          <div class="panel"><h4>格式</h4><div id="cFmt"></div></div>
        </div>
        <div class="panel"><h4>色階</h4><div class="shades" id="cShades"></div><div class="hint">點色塊複製 HEX，按住 Shift 點擊則設為目前顏色</div></div>
        <div class="panel">
          <div class="pal-head">
            <h4>配色系統</h4>
            <label class="chk-inline"><input type="checkbox" id="cPalBase"> 以目前顏色為基底</label>
            <button class="btn sm dice solid" id="cPalAll">🎲 全部隨機</button>
          </div>
          <div id="cPal"></div>
          <div class="hint">點「隨機」重新產生該組配色；點色塊複製 HEX，按住 Shift 點擊則設為目前顏色；點 🔒 鎖定色塊後隨機時保留</div>
        </div>
        <div class="panel">
          <h4>對比度檢查（WCAG 2.1）</h4>
          <div class="tgrid cols2">
            <div>
              <div class="btnrow">
                <label class="field-inline">文字 <input type="color" id="cFg" class="colorin" value="#ffffff"></label>
                <label class="field-inline">背景 <input type="color" id="cBg" class="colorin"></label>
                <button class="btn sm" id="cSwap">⇄ 對調</button>
              </div>
              <div class="contrast-preview" id="cPrev"><span class="big">Aa 大字 24px</span><span>一般文字 16px 的顯示效果 The quick brown fox</span></div>
            </div>
            <div><div class="ratio" id="cRatio"></div><div class="badges" id="cBadges"></div></div>
          </div>
        </div>`;

      const cv = document.createElement('canvas'); cv.width = cv.height = 1;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      function parse(str) {
        str = (str || '').trim();
        if (!str || !CSS.supports('color', str)) return null;
        cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = str; cx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: +(a / 255).toFixed(3) };
      }
      const h2 = n => n.toString(16).padStart(2, '0');
      const hex6 = c => '#' + h2(c.r) + h2(c.g) + h2(c.b);
      const hex = c => hex6(c) + (c.a < 1 ? h2(Math.round(c.a * 255)) : '');
      function hsl({ r, g, b }) {
        r /= 255; g /= 255; b /= 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
        let h = 0, s = 0;
        if (d) {
          s = d / (1 - Math.abs(2 * l - 1));
          h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
          h *= 60; if (h < 0) h += 360;
        }
        return [h, s * 100, l * 100];
      }
      const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
      function oklch({ r, g, b }) {
        const R = lin(r), G = lin(g), B = lin(b);
        const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
        const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
        const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
        const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
        const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
        const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
        let h = Math.atan2(Bb, A) * 180 / Math.PI; if (h < 0) h += 360;
        return [L, Math.hypot(A, Bb), h];
      }
      const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
      const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const mix = (c, t, k) => ({ r: Math.round(c.r + (t.r - c.r) * k), g: Math.round(c.g + (t.g - c.g) * k), b: Math.round(c.b + (t.b - c.b) * k), a: 1 });
      const f1 = n => +n.toFixed(1), f3 = n => +n.toFixed(3);

      let cur;
      function update(c, fromText) {
        cur = c;
        store.set('term.color', hex(c));
        $(el, '#cSw').style.background = `rgba(${c.r},${c.g},${c.b},${c.a})`;
        $(el, '#cPick').value = hex6(c);
        if (!fromText) $(el, '#cText').value = hex(c);
        $(el, '#cErr').textContent = '';
        const [h, s, l] = hsl(c), [L, C, H] = oklch(c);
        const alpha = c.a < 1 ? ` / ${c.a}` : '';
        $(el, '#cFmt').innerHTML = rows([
          ['HEX', hex(c)],
          ['RGB', `rgb(${c.r} ${c.g} ${c.b}${alpha})`],
          ['HSL', `hsl(${f1(h)} ${f1(s)}% ${f1(l)}%${alpha})`],
          ['OKLCH', `oklch(${f1(L * 100)}% ${f3(C)} ${f1(H)}${alpha})`],
          ['CSS 變數', `--color: ${hex(c)};`],
        ]);
        const W = { r: 255, g: 255, b: 255 }, K = { r: 0, g: 0, b: 0 };
        const steps = [...[0.85, 0.7, 0.55, 0.4, 0.25, 0.1].map(k => mix(c, W, k)), { ...c, a: 1 }, ...[0.15, 0.3, 0.45, 0.6, 0.75].map(k => mix(c, K, k))];
        $(el, '#cShades').innerHTML = steps.map((s, i) =>
          `<button class="shade${i === 6 ? ' base' : ''}" data-hex="${hex6(s)}" style="background:${hex6(s)};color:${lum(s) > 0.35 ? '#111' : '#fff'}">${hex6(s)}</button>`).join('');
        $(el, '#cBg').value = hex6(c);
        updateContrast();
      }
      function updateContrast() {
        const fg = parse($(el, '#cFg').value), bg = parse($(el, '#cBg').value);
        const r = contrast(fg, bg);
        const p = $(el, '#cPrev'); p.style.color = hex6(fg); p.style.background = hex6(bg);
        $(el, '#cRatio').innerHTML = `<b>${r.toFixed(2)}</b> : 1`;
        const t = [['AA 一般文字', 4.5], ['AA 大字', 3], ['AAA 一般文字', 7], ['AAA 大字', 4.5]];
        $(el, '#cBadges').innerHTML = t.map(([n, min]) =>
          `<span class="tag ${r >= min ? 'yes' : 'no'}">${r >= min ? '✓' : '✗'} ${n}（≥ ${min}）</span>`).join('');
      }

      $(el, '#cPick').addEventListener('input', e => update(parse(e.target.value)));
      $(el, '#cText').addEventListener('input', e => {
        const c = parse(e.target.value);
        if (c) update(c, true); else $(el, '#cErr').innerHTML = '<span class="bad">無法辨識的顏色</span>';
      });
      $(el, '#cFg').addEventListener('input', updateContrast);
      $(el, '#cBg').addEventListener('input', updateContrast);
      $(el, '#cSwap').onclick = () => { const f = $(el, '#cFg'), b = $(el, '#cBg'); [f.value, b.value] = [b.value, f.value]; updateContrast(); };
      $(el, '#cShades').addEventListener('click', e => {
        const b = e.target.closest('.shade'); if (!b) return;
        if (e.shiftKey) update(parse(b.dataset.hex)); else copyText(b.dataset.hex, b);
      });
      if (canEye) $(el, '#cDrop').onclick = async () => {
        try { const r = await new EyeDropper().open(); update(parse(r.sRGBHex)); } catch {}
      };

      /* ---------- 配色系統：雙色 / 3 色 / 4 色 / 5 色 ---------- */
      const rnd = () => randInt(1e6) / 1e6;
      const between = (a, b) => a + (b - a) * rnd();
      const pick = arr => arr[randInt(arr.length)];
      function fromHsl(h, s, l) {
        h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
        const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
        const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
        return { r: f(0), g: f(8), b: f(4), a: 1 };
      }
      /* 色彩理論依據
       * 1. 色相：在傳統 RYB 美術色環（伊登 Itten 色環）上取角度，互補為 紅↔綠、黃↔紫、藍↔橙，
       *    而非螢幕 RGB 色環的 紅↔青。和諧關係的角度精確套用，不加隨機偏移。
       * 2. 明度：以 OKLab 感知明度 L 控制每個色塊的明暗，同一配色內刻意拉開明度對比
       *    （主色居中、輔色一淺一深），同色相重複出現時以 tint / shade 區分。
       * 3. 彩度：主色彩度最高，輔色與淺色調降，避免多個高彩度色互相搶眼（主從關係）。 */
      const RYB = [[0, 0], [60, 30], [120, 60], [180, 120], [240, 240], [300, 280], [360, 360]]; // [RYB, RGB 色相]
      const remap = (h, from, to) => {
        h = ((h % 360) + 360) % 360;
        for (let i = 1; i < RYB.length; i++) {
          const a = RYB[i - 1], b = RYB[i];
          if (h <= b[from]) return a[to] + (h - a[from]) / (b[from] - a[from]) * (b[to] - a[to]);
        }
        return h;
      };
      const rybToRgb = h => remap(h, 0, 1), rgbToRyb = h => remap(h, 1, 0);
      // 在指定 RGB 色相與 HSL 飽和度下，搜尋符合目標感知明度 L（0–1）的顏色
      function withL(h, s, L) {
        let lo = 0, hi = 100, c;
        for (let i = 0; i < 18; i++) {
          const mid = (lo + hi) / 2; c = fromHsl(h, s, mid);
          if (oklch(c)[0] < L) lo = mid; else hi = mid;
        }
        return c;
      }
      // 每個色塊：[色相偏移（RYB 度）, 目標明度 L, 彩度倍率]；第一個 0° 且倍率 1 的色塊為主色
      const SCHEMES = {
        2: [
          ['互補', '色環上相對 180°，對比最強', [[0, .60, 1], [180, .42, .85]]],
          ['類比', '色環上相鄰 30°，柔和統一', [[0, .55, 1], [30, .78, .8]]],
          ['單色', '同一色相，以明暗區分', [[0, .40, 1], [0, .86, .55]]],
        ],
        3: [
          ['三角', '色環上等距 120°，平衡且鮮明', [[0, .60, 1], [120, .78, .75], [240, .42, .75]]],
          ['分裂互補', '主色加上互補色兩側 ±30°，比互補柔和', [[0, .60, 1], [150, .44, .8], [210, .78, .7]]],
          ['類比', '色環上連續相鄰 30°', [[-30, .45, .9], [0, .62, 1], [30, .80, .8]]],
          ['單色', '同一色相的暗、中、亮三階', [[0, .34, .95], [0, .60, 1], [0, .87, .5]]],
        ],
        4: [
          ['四方', '色環上等距 90°', [[0, .60, 1], [90, .80, .7], [180, .45, .75], [270, .70, .65]]],
          ['矩形', '兩組互補色（60° / 180°），又稱雙互補', [[0, .60, 1], [60, .82, .7], [180, .42, .8], [240, .70, .65]]],
          ['類比', '色環上連續相鄰 30°，涵蓋 90°', [[-30, .42, .9], [0, .60, 1], [30, .74, .85], [60, .86, .7]]],
          ['互補', '主色與互補色，各以明暗延伸', [[0, .36, .9], [0, .62, 1], [180, .55, .8], [180, .86, .45]]],
          ['單色', '同一色相的四個明度', [[0, .30, .9], [0, .50, 1], [0, .70, .8], [0, .89, .45]]],
        ],
        5: [
          ['類比', '色環上連續相鄰 30°，涵蓋 120°', [[-60, .40, .85], [-30, .52, .9], [0, .64, 1], [30, .76, .85], [60, .87, .7]]],
          ['互補', '主色三階明暗配上互補色兩階', [[0, .34, .9], [0, .60, 1], [0, .86, .45], [180, .52, .8], [180, .78, .6]]],
          ['分裂互補', '主色明暗兩階加互補兩側 ±30°，並以近中性淺色收尾', [[0, .38, .9], [0, .62, 1], [150, .50, .8], [210, .76, .7], [0, .94, .2]]],
          ['三角', '等距 120° 三色，主色與第三色各延伸一階', [[0, .60, 1], [0, .86, .45], [120, .74, .75], [240, .40, .8], [240, .70, .55]]],
          ['單色', '同一色相的五個明度', [[0, .28, .9], [0, .44, 1], [0, .60, 1], [0, .76, .75], [0, .91, .4]]],
        ],
      };
      const PAL_KEY = 'term.palettes';
      let pals;
      try { pals = JSON.parse(store.get(PAL_KEY) || 'null'); } catch {}
      if (!pals || typeof pals !== 'object' || pals.v !== 2) pals = { v: 2 };

      function genPalette(n) {
        const old = pals[n];
        const locks = old && Array.isArray(old.locks) ? old.locks.slice(0, n) : Array(n).fill(false);
        const [name, desc, spec] = pick(SCHEMES[n]);
        const baseIdx = spec.findIndex(([o, , k]) => o === 0 && k === 1);
        // 基準色相（RYB）優先順序：已鎖定的色塊 → 目前顏色 → 隨機
        const li = locks.findIndex((v, i) => v && old.colors[i]);
        const useCur = li < 0 && $(el, '#cPalBase').checked && cur;
        let hue, sat;
        if (li >= 0) { const [h, s] = hsl(parse(old.colors[li])); hue = rgbToRyb(h) - spec[li][0]; sat = Math.max(40, s); }
        else if (useCur) { const [h, s] = hsl(cur); hue = rgbToRyb(h); sat = Math.max(40, s); }
        else { hue = between(0, 360); sat = between(55, 85); }
        const shift = between(-0.03, 0.03); // 整體明度微調，不破壞色塊間的明度關係
        const colors = spec.map(([o, L, k], i) => {
          if (locks[i] && old.colors[i]) return old.colors[i];
          if (useCur && i === baseIdx) return hex6(cur);
          return hex6(withL(rybToRgb(hue + o), sat * k, Math.max(.2, Math.min(.95, L + shift))));
        });
        pals[n] = { name, desc, colors, locks };
      }
      function savePals() { store.set(PAL_KEY, JSON.stringify(pals)); }
      // 結構只建立一次；之後隨機或鎖定只就地更新顏色與文字，不重建元素，避免畫面跳動與焦點遺失
      function buildPals() {
        $(el, '#cPal').innerHTML = [2, 3, 4, 5].map(n => `<div class="pal-row" data-n="${n}">
            <div class="pal-meta">
              <div class="pal-wheel">${'<i></i>'.repeat(n)}</div>
              <div><b>${n === 2 ? '雙色' : n + ' 色'}</b><span class="pal-name"></span></div>
            </div>
            <div class="pal-strip">${Array.from({ length: n }, (_, i) => `<div class="pal-sw">
                <button class="pal-copy" title="點擊複製，Shift+點擊設為目前顏色"></button>
                <button class="pal-lock" data-i="${i}"></button>
              </div>`).join('')}</div>
            <div class="pal-acts">
              <button class="btn sm dice" data-act="rand">🎲 隨機</button>
              <button class="btn sm ghost" data-act="copy">複製</button>
            </div>
          </div>`).join('');
      }
      function paintRow(n) {
        const p = pals[n], row = $(el, `.pal-row[data-n="${n}"]`);
        $(row, '.pal-meta').title = p.desc || '';
        $(row, '.pal-name').textContent = p.name;
        $$(row, '.pal-wheel i').forEach((dot, i) => {
          const a = rgbToRyb(hsl(parse(p.colors[i]))[0]) * Math.PI / 180;
          dot.style.left = `${50 + 38 * Math.sin(a)}%`;
          dot.style.top = `${50 - 38 * Math.cos(a)}%`;
          dot.style.background = p.colors[i];
        });
        $$(row, '.pal-sw').forEach((sw, i) => {
          const c = p.colors[i], locked = !!p.locks[i];
          sw.style.background = c;
          sw.style.color = lum(parse(c)) > 0.35 ? '#111' : '#fff';
          const cp = $(sw, '.pal-copy'); cp.dataset.hex = c; cp.textContent = c;
          const lk = $(sw, '.pal-lock');
          lk.classList.toggle('on', locked);
          lk.title = locked ? '解除鎖定' : '鎖定此色';
          lk.setAttribute('aria-pressed', locked);
          lk.textContent = locked ? '🔒' : '🔓';
        });
      }
      // 更新期間鎖住捲動位置，任何版面變動都不會讓畫面跳動
      function keepScroll(fn) {
        const sc = el.closest('main') || document.scrollingElement;
        const top = sc.scrollTop;
        fn();
        if (sc.scrollTop !== top) sc.scrollTop = top;
      }
      function renderPals(ns = [2, 3, 4, 5]) { keepScroll(() => ns.forEach(paintRow)); }
      [2, 3, 4, 5].forEach(n => {
        const p = pals[n];
        if (!p || !Array.isArray(p.colors) || p.colors.length !== n) { delete pals[n]; genPalette(n); }
      });
      savePals(); buildPals(); renderPals();
      // 色環底圖：依 RYB 色環每 30° 取色
      el.style.setProperty('--ryb-wheel', `conic-gradient(${Array.from({ length: 13 }, (_, i) => `hsl(${rybToRgb(i * 30) % 360} 75% 55%)`).join(',')})`);

      $(el, '#cPalAll').onclick = () => { [2, 3, 4, 5].forEach(genPalette); savePals(); renderPals(); };
      $(el, '#cPal').addEventListener('click', e => {
        const row = e.target.closest('.pal-row'); if (!row) return;
        const n = +row.dataset.n, p = pals[n];
        const cp = e.target.closest('.pal-copy');
        if (cp) { if (e.shiftKey) update(parse(cp.dataset.hex)); else copyText(cp.dataset.hex, cp); return; }
        const lk = e.target.closest('.pal-lock');
        if (lk) { const i = +lk.dataset.i; p.locks[i] = !p.locks[i]; savePals(); renderPals([n]); return; }
        const act = e.target.closest('[data-act]');
        if (!act) return;
        if (act.dataset.act === 'rand') { genPalette(n); savePals(); renderPals([n]); }
        else copyText(p.colors.join(', '), act);
      });

      update(parse(store.get('term.color')) || parse('#6e9bff'));
    },
  };

  /* ======================= json ======================= */
  function hlJSON(text) {
    const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(text))) {
      out += esc(text.slice(last, m.index));
      if (m[1]) out += m[2] ? `<span class="t-prop">${esc(m[1])}</span>${esc(m[2])}` : `<span class="t-str">${esc(m[1])}</span>`;
      else if (m[3]) out += `<span class="t-kw">${m[3]}</span>`;
      else out += `<span class="t-num">${m[4]}</span>`;
      last = re.lastIndex;
    }
    return out + esc(text.slice(last));
  }
  const json = {
    title: 'JSON 格式化', desc: '格式化、壓縮、驗證 JSON 與樹狀檢視',
    sub: '貼上 JSON，即時驗證並格式化',
    build(el) {
      el.innerHTML = `
        <div class="panel">
          <div class="btnrow">
            <button class="btn primary" data-a="fmt">格式化</button>
            <button class="btn" data-a="min">壓縮</button>
            <button class="btn" data-a="sort">排序鍵</button>
            <label class="field-inline">縮排
              <select class="in sm" id="jInd"><option value="2">2 格</option><option value="4">4 格</option><option value="tab">Tab</option></select>
            </label>
            <span class="grow"></span>
            <button class="btn ghost" data-a="sample">範例</button>
            <button class="btn ghost" data-a="clear">清除</button>
          </div>
          <textarea class="in mono tall" id="jIn" spellcheck="false" placeholder='{"name": "Web Terminal", "version": 1}'></textarea>
          <div class="status" id="jStat"></div>
        </div>
        <div class="panel">
          <div class="btnrow">
            <div class="seg" id="jTab"><button class="on" data-t="text">文字</button><button data-t="tree">樹狀</button></div>
            <span class="grow"></span><button class="btn sm" id="jCopy">複製結果</button>
          </div>
          <pre class="codeout" id="jOut"></pre>
          <div class="jtree" id="jTree" hidden></div>
        </div>`;
      const ta = $(el, '#jIn');
      let data, ok = false, outText = '';
      const indent = () => { const v = $(el, '#jInd').value; return v === 'tab' ? '\t' : +v; };
      const sortDeep = v => Array.isArray(v) ? v.map(sortDeep)
        : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortDeep(v[k])])) : v;
      const countNodes = v => v && typeof v === 'object' ? 1 + Object.values(v).reduce((a, x) => a + countNodes(x), 0) : 1;
      const typeName = v => v === null ? 'null' : Array.isArray(v) ? `陣列（${v.length} 項）` : typeof v === 'object' ? `物件（${Object.keys(v).length} 個鍵）` : typeof v;

      function validate() {
        const src = ta.value;
        const st = $(el, '#jStat');
        if (!src.trim()) { ok = false; st.innerHTML = '<span class="dim-note">貼上或輸入 JSON</span>'; $(el, '#jOut').textContent = ''; $(el, '#jTree').innerHTML = ''; return; }
        try {
          data = JSON.parse(src); ok = true;
          st.innerHTML = `<span class="ok-note">✓ 有效的 JSON</span> · ${esc(typeName(data))} · ${countNodes(data)} 個節點 · ${new TextEncoder().encode(src).length.toLocaleString()} bytes`;
          render(JSON.stringify(data, null, indent()));
        } catch (e) {
          ok = false;
          let pos = null;
          const mPos = /position (\d+)/.exec(e.message), mLc = /line (\d+) column (\d+)/.exec(e.message);
          let line, col;
          if (mLc) { line = +mLc[1]; col = +mLc[2]; }
          else if (mPos) { pos = +mPos[1]; const before = src.slice(0, pos).split('\n'); line = before.length; col = before.at(-1).length + 1; }
          let snippet = '';
          if (line) {
            const text = src.split('\n')[line - 1] || '';
            snippet = `<pre class="err-snip">${esc(text)}\n${' '.repeat(Math.max(0, col - 1))}^</pre>`;
          }
          st.innerHTML = `<span class="bad-note">✗ ${esc(e.message)}</span>${line ? ` · 第 ${line} 行，第 ${col} 欄` : ''}${snippet}`;
        }
      }
      function render(text) {
        outText = text;
        $(el, '#jOut').innerHTML = hlJSON(text.length > 300000 ? text.slice(0, 300000) + '\n…（僅顯示前 300,000 字元）' : text);
        $(el, '#jTree').innerHTML = tree(data, null, 0, { n: 0 });
      }
      function tree(v, key, depth, cnt) {
        if (++cnt.n > 5000) return cnt.n === 5001 ? '<div class="dim-note">…節點過多，僅顯示前 5000 個</div>' : '';
        const k = key === null ? '' : `<span class="t-prop">${esc(key)}</span>: `;
        if (v && typeof v === 'object') {
          const isArr = Array.isArray(v), entries = Object.entries(v);
          const label = isArr ? `[${entries.length}]` : `{${entries.length}}`;
          return `<details ${depth < 2 ? 'open' : ''}><summary>${k}<span class="dim-note">${label}</span></summary>${entries.map(([ck, cv]) => tree(cv, isArr ? ck : ck, depth + 1, cnt)).join('')}</details>`;
        }
        const val = typeof v === 'string' ? `<span class="t-str">${esc(JSON.stringify(v))}</span>`
          : typeof v === 'number' ? `<span class="t-num">${v}</span>` : `<span class="t-kw">${v}</span>`;
        return `<div class="leaf">${k}${val}</div>`;
      }

      ta.addEventListener('input', debounce(validate, 250));
      $(el, '#jInd').addEventListener('change', validate);
      el.addEventListener('click', e => {
        const a = e.target.closest('[data-a]')?.dataset.a; if (!a) return;
        if (a === 'sample') { ta.value = JSON.stringify({ name: 'Web Terminal', version: 2, tags: ['terminal', 'tools'], author: { lang: 'zh-TW' }, active: true, score: 9.5, extra: null }); }
        else if (a === 'clear') ta.value = '';
        else if (ok) {
          if (a === 'fmt') ta.value = JSON.stringify(data, null, indent());
          if (a === 'min') ta.value = JSON.stringify(data);
          if (a === 'sort') ta.value = JSON.stringify(sortDeep(data), null, indent());
        }
        validate();
      });
      $(el, '#jTab').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        $$(el, '#jTab button').forEach(x => x.classList.toggle('on', x === b));
        $(el, '#jOut').hidden = b.dataset.t !== 'text';
        $(el, '#jTree').hidden = b.dataset.t !== 'tree';
      });
      $(el, '#jCopy').onclick = e => ok && copyText(outText, e.currentTarget);
      validate();
    },
  };

  /* ======================= time ======================= */
  const ZONES = ['UTC', 'Asia/Taipei', 'Asia/Tokyo', 'Asia/Singapore', 'Asia/Kolkata', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];
  function relTime(ms) {
    const rtf = new Intl.RelativeTimeFormat(navigator.language, { numeric: 'auto' });
    const s = (ms - Date.now()) / 1000, a = Math.abs(s);
    const [v, u] = a < 60 ? [s, 'second'] : a < 3600 ? [s / 60, 'minute'] : a < 86400 ? [s / 3600, 'hour']
      : a < 2592000 ? [s / 86400, 'day'] : a < 31536000 ? [s / 2592000, 'month'] : [s / 31536000, 'year'];
    return rtf.format(Math.round(v), u);
  }
  function parseTs(str) {
    str = str.trim(); if (!str) return null;
    if (/^-?\d+(\.\d+)?$/.test(str)) {
      const n = parseFloat(str), digits = str.replace(/^-/, '').split('.')[0].length;
      return { ms: digits >= 13 ? n : n * 1000, unit: digits >= 13 ? '毫秒' : '秒' };
    }
    const t = Date.parse(str);
    return isNaN(t) ? null : { ms: t, unit: '日期字串' };
  }
  function tsRows(ms) {
    const d = new Date(ms);
    if (isNaN(d)) return null;
    return [
      ['本地時間', d.toLocaleString(navigator.language, { dateStyle: 'full', timeStyle: 'medium' })],
      ['UTC', d.toUTCString()],
      ['ISO 8601', d.toISOString()],
      ['Unix 秒', String(Math.floor(ms / 1000))],
      ['Unix 毫秒', String(Math.round(ms))],
      ['相對時間', relTime(ms)],
    ];
  }
  const time = {
    title: '時間戳轉換', desc: 'Unix 時間戳與日期互轉、世界時區',
    sub: '時間戳（秒 / 毫秒）與日期互轉，並比較各地時間',
    cliHint: 'time <時間戳> 直接轉換',
    build(el) {
      el.innerHTML = `
        <div class="panel"><h4>現在時間</h4><div class="now-grid" id="tNow"></div></div>
        <div class="tgrid cols2">
          <div class="panel"><h4>時間戳 → 日期</h4>
            <div class="btnrow"><input class="in grow mono" id="tTs" placeholder="1700000000、1700000000000 或日期字串"><button class="btn sm" id="tTsNow">現在</button></div>
            <div class="status" id="tTsStat"></div><div id="tTsOut"></div></div>
          <div class="panel"><h4>日期 → 時間戳</h4>
            <div class="btnrow"><input type="datetime-local" step="1" class="in grow" id="tDt"><button class="btn sm" id="tDtNow">現在</button></div>
            <div id="tDtOut"></div></div>
        </div>
        <div class="panel"><h4>世界時區 <span class="dim-note" id="tZoneNote"></span></h4><div class="zones" id="tZones"></div></div>`;
      const sec = el.closest('.tool-view');
      let selMs = null;
      const pad = n => String(n).padStart(2, '0');
      const toLocalInput = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      function tickNow() {
        const now = Date.now();
        $(el, '#tNow').innerHTML = [
          ['Unix 秒', Math.floor(now / 1000)], ['Unix 毫秒', now],
          ['本地', new Date(now).toLocaleString(navigator.language)], ['ISO 8601', new Date(now).toISOString()],
        ].map(([k, v]) => `<button class="now-item" data-copy='${attr(v)}'><span>${k}</span><b>${esc(String(v))}</b></button>`).join('');
        if (selMs === null) renderZones(now);
      }
      function renderZones(ms) {
        const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const list = [local, ...ZONES.filter(z => z !== local)];
        const d = new Date(ms);
        $(el, '#tZoneNote').textContent = selMs === null ? '（目前時間）' : '（上方輸入的時間）';
        $(el, '#tZones').innerHTML = list.map(z => {
          let t, off;
          try {
            t = d.toLocaleString(navigator.language, { timeZone: z, month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
            off = new Intl.DateTimeFormat('en-US', { timeZone: z, timeZoneName: 'shortOffset' }).formatToParts(d).find(p => p.type === 'timeZoneName')?.value || '';
          } catch { return ''; }
          return `<div class="zone${z === local ? ' local' : ''}"><span class="zn">${esc(z.replace(/_/g, ' '))}${z === local ? '（本地）' : ''}</span><span class="zo">${esc(off)}</span><b>${esc(t)}</b></div>`;
        }).join('');
      }
      function convTs() {
        const p = parseTs($(el, '#tTs').value);
        const r = p && tsRows(p.ms);
        $(el, '#tTsStat').innerHTML = !$(el, '#tTs').value.trim() ? '' : r ? `<span class="dim-note">判定為：${p.unit}</span>` : '<span class="bad-note">無法辨識的時間戳</span>';
        $(el, '#tTsOut').innerHTML = r ? rows(r) : '';
        selMs = r ? p.ms : null;
        renderZones(selMs ?? Date.now());
      }
      function convDt() {
        const v = $(el, '#tDt').value;
        if (!v) { $(el, '#tDtOut').innerHTML = ''; return; }
        const d = new Date(v);
        $(el, '#tDtOut').innerHTML = rows([['Unix 秒', String(Math.floor(d / 1000))], ['Unix 毫秒', String(+d)], ['ISO 8601', d.toISOString()]]);
      }
      $(el, '#tTs').addEventListener('input', convTs);
      $(el, '#tDt').addEventListener('input', convDt);
      $(el, '#tTsNow').onclick = () => { $(el, '#tTs').value = Math.floor(Date.now() / 1000); convTs(); };
      $(el, '#tDtNow').onclick = () => { $(el, '#tDt').value = toLocalInput(new Date()); convDt(); };
      $(el, '#tDt').value = toLocalInput(new Date()); convDt();
      tickNow();
      setInterval(() => { if (!sec.hidden) tickNow(); }, 1000);
    },
    cli(arg) {
      const p = parseTs(arg), r = p && tsRows(p.ms);
      if (!r) { ctx.print('無法辨識的時間戳：' + esc(arg), 'bad'); return; }
      ctx.print(ctx.kv([['判定為', p.unit], ...r]));
    },
  };

  /* ======================= encode ======================= */
  const b64enc = str => {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  const b64dec = str => {
    let s = str.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
  };
  const CODECS = {
    base64: ['Base64', b64enc, b64dec],
    base64url: ['Base64URL', s => b64enc(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), b64dec],
    url: ['URL 參數', encodeURIComponent, decodeURIComponent],
    uri: ['完整 URL', encodeURI, decodeURI],
    html: ['HTML 實體',
      s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
      s => new DOMParser().parseFromString(`<!doctype html><body>${s}`, 'text/html').body.textContent],
    unicode: ['Unicode 跳脫',
      s => s.replace(/[^\x20-\x7e\n\t]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')),
      s => s.replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi, (_, a, b, c) => String.fromCodePoint(parseInt(a || b || c, 16)))],
    hex: ['Hex (UTF-8)',
      s => bytesToHex(new TextEncoder().encode(s)).replace(/(..)(?=.)/g, '$1 '),
      s => {
        const h = s.replace(/0x|[\s,:]/gi, '');
        if (!/^([0-9a-f]{2})*$/i.test(h)) throw new Error('不是有效的十六進位字串');
        return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16)));
      }],
  };
  const encode = {
    title: '編碼 / 解碼', desc: 'Base64、URL、HTML 實體、Unicode、Hex 互轉',
    sub: '在任一邊輸入，另一邊即時轉換',
    build(el) {
      el.innerHTML = `
        <div class="panel">
          <div class="seg wrap" id="eMode">${Object.entries(CODECS).map(([k, [n]], i) => `<button data-m="${k}" class="${i ? '' : 'on'}">${n}</button>`).join('')}</div>
        </div>
        <div class="tgrid cols2">
          <div class="panel"><div class="btnrow"><h4 style="margin:0">原文</h4><span class="grow"></span><button class="btn sm" data-c="eA">複製</button></div>
            <textarea class="in mono tall" id="eA" spellcheck="false" placeholder="輸入文字，右側即時編碼"></textarea></div>
          <div class="panel"><div class="btnrow"><h4 style="margin:0">編碼結果</h4><span class="grow"></span><button class="btn sm" data-c="eB">複製</button></div>
            <textarea class="in mono tall" id="eB" spellcheck="false" placeholder="或在此貼上編碼內容，左側即時解碼"></textarea></div>
        </div>
        <div class="btnrow"><button class="btn" id="eSwap">⇄ 對調</button><button class="btn ghost" id="eClear">清除</button><span class="status" id="eStat"></span></div>`;
      let mode = 'base64', last = 'A';
      const A = $(el, '#eA'), B = $(el, '#eB'), st = $(el, '#eStat');
      function run() {
        const [, enc, dec] = CODECS[mode];
        st.textContent = '';
        try {
          if (last === 'A') B.value = A.value ? enc(A.value) : '';
          else A.value = B.value ? dec(B.value) : '';
        } catch (e) { st.innerHTML = `<span class="bad-note">${last === 'A' ? '編碼' : '解碼'}失敗：${esc(e.message || '格式不正確')}</span>`; }
      }
      A.addEventListener('input', () => { last = 'A'; run(); });
      B.addEventListener('input', () => { last = 'B'; run(); });
      $(el, '#eMode').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        mode = b.dataset.m; $$(el, '#eMode button').forEach(x => x.classList.toggle('on', x === b)); run();
      });
      $(el, '#eSwap').onclick = () => { A.value = B.value; last = 'A'; run(); };
      $(el, '#eClear').onclick = () => { A.value = B.value = ''; st.textContent = ''; };
      $$(el, '[data-c]').forEach(b => b.onclick = () => copyText($(el, '#' + b.dataset.c).value, b));
    },
  };

  /* ======================= timer ======================= */
  const fmtDur = (ms, cs) => {
    ms = Math.max(0, ms);
    const t = cs ? Math.floor(ms / 10) : Math.ceil(ms / 1000);
    const total = cs ? Math.floor(t / 100) : t;
    const h = Math.floor(total / 3600), m = Math.floor(total % 3600 / 60), s = total % 60;
    const p = n => String(n).padStart(2, '0');
    return (h ? h + ':' + p(m) : p(m)) + ':' + p(s) + (cs ? '.' + p(t % 100) : '');
  };
  function alarm(msg) {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach(t => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = 880; o.connect(g).connect(ac.destination);
        g.gain.setValueAtTime(0.25, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2);
        o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.22);
      });
    } catch {}
    try { if (window.Notification && Notification.permission === 'granted') new Notification('⏰ ' + msg, { body: 'Web Terminal 計時器' }); } catch {}
    ctx.print('⏰ ' + esc(msg), 'k');
  }
  const askNotify = () => { try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch {} };
  const RING = 2 * Math.PI * 54;
  const timer = {
    title: '計時器', desc: '倒數計時、碼錶與番茄鐘',
    sub: '倒數計時、碼錶、番茄鐘；離開此畫面也會繼續計時',
    build(el) {
      const ring = id => `<div class="timer-face"><svg viewBox="0 0 120 120" class="ring"><circle cx="60" cy="60" r="54" class="ring-bg"/><circle cx="60" cy="60" r="54" class="ring-fg" id="${id}R" style="stroke-dasharray:${RING}"/></svg><div class="timer-digits" id="${id}D">00:00</div></div>`;
      el.innerHTML = `
        <div class="seg" id="tmTab"><button class="on" data-t="cd">倒數計時</button><button data-t="sw">碼錶</button><button data-t="pm">番茄鐘</button></div>
        <div class="panel timer-panel" data-p="cd">
          ${ring('cd')}
          <div class="btnrow center">
            <input type="number" class="in num" id="cdH" min="0" max="99" value="0"> 時
            <input type="number" class="in num" id="cdM" min="0" max="59" value="5"> 分
            <input type="number" class="in num" id="cdS" min="0" max="59" value="0"> 秒
          </div>
          <div class="btnrow center">${[1, 3, 5, 10, 15, 25, 30, 60].map(m => `<button class="btn sm" data-min="${m}">${m} 分</button>`).join('')}</div>
          <div class="btnrow center"><button class="btn primary lg" id="cdGo">開始</button><button class="btn lg" id="cdReset">重設</button></div>
        </div>
        <div class="panel timer-panel" data-p="sw" hidden>
          <div class="timer-digits big" id="swD">00:00.00</div>
          <div class="btnrow center"><button class="btn primary lg" id="swGo">開始</button><button class="btn lg" id="swLap" disabled>計次</button><button class="btn lg" id="swReset">重設</button></div>
          <ol class="laps" id="swLaps"></ol>
        </div>
        <div class="panel timer-panel" data-p="pm" hidden>
          <div class="pomo-phase" id="pmPhase">專注</div>
          ${ring('pm')}
          <div class="pomo-count" id="pmCount"></div>
          <div class="btnrow center"><button class="btn primary lg" id="pmGo">開始</button><button class="btn lg" id="pmSkip">跳過</button><button class="btn lg" id="pmReset">重設</button></div>
          <div class="btnrow center small">
            專注 <input type="number" class="in num" id="pmW" min="1" value="25"> 分 ·
            短休息 <input type="number" class="in num" id="pmS" min="1" value="5"> 分 ·
            長休息 <input type="number" class="in num" id="pmL" min="1" value="15"> 分 ·
            每 <input type="number" class="in num" id="pmN" min="1" value="4"> 輪長休息
          </div>
        </div>
        <div class="hint center">時間到會發出提示音、顯示系統通知，並在終端機印出提醒</div>`;
      const v = id => Math.max(0, parseInt($(el, '#' + id).value, 10) || 0);
      const baseTitle = document.title;

      // 倒數計時
      const cd = { total: 300000, left: 300000, end: 0, run: false };
      const cdFromInputs = () => { cd.total = cd.left = (v('cdH') * 3600 + v('cdM') * 60 + v('cdS')) * 1000; };
      $$(el, '#cdH, #cdM, #cdS').forEach(i => i.addEventListener('input', () => { if (!cd.run) cdFromInputs(); draw(); }));
      $$(el, '[data-min]').forEach(b => b.onclick = () => {
        if (cd.run) return;
        const m = +b.dataset.min;
        $(el, '#cdH').value = Math.floor(m / 60); $(el, '#cdM').value = m % 60; $(el, '#cdS').value = 0; cdFromInputs(); draw();
      });
      $(el, '#cdGo').onclick = () => {
        if (cd.run) { cd.left = cd.end - Date.now(); cd.run = false; }
        else { if (cd.left <= 0) cdFromInputs(); if (cd.left <= 0) return; askNotify(); cd.end = Date.now() + cd.left; cd.run = true; }
        draw();
      };
      $(el, '#cdReset').onclick = () => { cd.run = false; cdFromInputs(); draw(); };

      // 碼錶
      const sw = { acc: 0, start: 0, run: false, laps: [] };
      const swNow = () => sw.acc + (sw.run ? Date.now() - sw.start : 0);
      $(el, '#swGo').onclick = () => {
        if (sw.run) { sw.acc += Date.now() - sw.start; sw.run = false; } else { sw.start = Date.now(); sw.run = true; }
        draw();
      };
      $(el, '#swLap').onclick = () => { const t = swNow(); sw.laps.push(t); drawLaps(); };
      $(el, '#swReset').onclick = () => { sw.acc = 0; sw.run = false; sw.laps = []; drawLaps(); draw(); };
      function drawLaps() {
        const splits = sw.laps.map((t, i) => t - (sw.laps[i - 1] || 0));
        const mn = Math.min(...splits), mx = Math.max(...splits);
        $(el, '#swLaps').innerHTML = splits.map((s, i) => [i, s]).reverse().map(([i, s]) =>
          `<li class="${splits.length > 2 && s === mn ? 'fast' : splits.length > 2 && s === mx ? 'slow' : ''}"><span>計次 ${i + 1}</span><b>${fmtDur(s, true)}</b><span class="dim-note">${fmtDur(sw.laps[i], true)}</span></li>`).join('');
      }

      // 番茄鐘
      const pm = { phase: 'work', done: 0, left: 0, end: 0, run: false };
      const PH = { work: ['專注', 'pmW'], short: ['短休息', 'pmS'], long: ['長休息', 'pmL'] };
      const pmDur = p => v(PH[p][1]) * 60000;
      pm.left = pmDur('work');
      function pmNext() {
        if (pm.phase === 'work') { pm.done++; pm.phase = pm.done % Math.max(1, v('pmN')) === 0 ? 'long' : 'short'; }
        else pm.phase = 'work';
        pm.left = pmDur(pm.phase); pm.run = false;
      }
      $(el, '#pmGo').onclick = () => {
        if (pm.run) { pm.left = pm.end - Date.now(); pm.run = false; }
        else { askNotify(); pm.end = Date.now() + pm.left; pm.run = true; }
        draw();
      };
      $(el, '#pmSkip').onclick = () => { pmNext(); draw(); };
      $(el, '#pmReset').onclick = () => { Object.assign(pm, { phase: 'work', done: 0, run: false }); pm.left = pmDur('work'); draw(); };
      $$(el, '#pmW, #pmS, #pmL').forEach(i => i.addEventListener('input', () => { if (!pm.run) pm.left = pmDur(pm.phase); draw(); }));

      $(el, '#tmTab').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        $$(el, '#tmTab button').forEach(x => x.classList.toggle('on', x === b));
        $$(el, '.timer-panel').forEach(p => { p.hidden = p.dataset.p !== b.dataset.t; });
      });

      function draw() {
        $(el, '#cdD').textContent = fmtDur(cd.left);
        $(el, '#cdR').style.strokeDashoffset = cd.total ? RING * (1 - cd.left / cd.total) : RING;
        $(el, '#cdGo').textContent = cd.run ? '暫停' : cd.left < cd.total && cd.left > 0 ? '繼續' : '開始';
        $$(el, '#cdH, #cdM, #cdS').forEach(i => { i.disabled = cd.run; });

        $(el, '#swD').textContent = fmtDur(swNow(), true);
        $(el, '#swGo').textContent = sw.run ? '暫停' : sw.acc ? '繼續' : '開始';
        $(el, '#swLap').disabled = !sw.run;

        const tot = pmDur(pm.phase);
        $(el, '#pmD').textContent = fmtDur(pm.left);
        $(el, '#pmR').style.strokeDashoffset = tot ? RING * (1 - pm.left / tot) : RING;
        $(el, '#pmPhase').textContent = PH[pm.phase][0];
        $(el, '#pmPhase').className = 'pomo-phase ' + pm.phase;
        $(el, '#pmGo').textContent = pm.run ? '暫停' : pm.left < tot ? '繼續' : '開始';
        const n = Math.max(1, v('pmN'));
        $(el, '#pmCount').innerHTML = `${Array.from({ length: n }, (_, i) => `<i class="${i < pm.done % n || (pm.done && pm.done % n === 0 && pm.phase === 'long') ? 'on' : ''}"></i>`).join('')} <span>已完成 ${pm.done} 個番茄</span>`;

        const active = cd.run ? fmtDur(cd.left) : pm.run ? fmtDur(pm.left) + ' ' + PH[pm.phase][0] : null;
        document.title = active ? `⏱ ${active} · ${baseTitle}` : baseTitle;
      }
      setInterval(() => {
        const now = Date.now();
        if (cd.run) { cd.left = cd.end - now; if (cd.left <= 0) { cd.left = 0; cd.run = false; alarm('倒數計時結束'); } }
        if (pm.run) {
          pm.left = pm.end - now;
          if (pm.left <= 0) { const was = PH[pm.phase][0]; pmNext(); alarm(`${was}時間結束，接下來：${PH[pm.phase][0]}`); }
        }
        if (cd.run || sw.run || pm.run || !el.closest('.tool-view').hidden) draw();
      }, 100);
      draw();
    },
  };

  /* ======================= regex ======================= */
  const RX_PRESETS = [
    ['Email', '[\\w.+-]+@[\\w-]+\\.[\\w.-]+'],
    ['URL', 'https?:\\/\\/[^\\s"\'<>]+'],
    ['台灣手機', '09\\d{2}-?\\d{3}-?\\d{3}'],
    ['IPv4', '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b'],
    ['日期', '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])'],
    ['中文字', '[\\u4e00-\\u9fff]+'],
    ['HEX 色碼', '#(?:[0-9a-fA-F]{3}){1,2}\\b'],
    ['身分證字號', '[A-Z][12]\\d{8}'],
  ];
  const RX_SAMPLE = `聯絡信箱：hello@example.com、support@test.org
官網 https://example.com/docs?id=42
手機 0912-345-678，備用 0987654321
伺服器 IP 192.168.1.10 與 10.0.0.255
日期 2026-11-05、2025-01-31
主題色 #6e9bff 與 #fff
身分證 A123456789`;
  const regex = {
    title: '正規表示式測試', desc: '即時比對、擷取群組與取代',
    sub: '輸入正規表示式與測試文字，即時顯示比對結果',
    build(el) {
      el.innerHTML = `
        <div class="panel">
          <div class="regex-line"><span class="slash">/</span><input class="in mono grow" id="rxP" spellcheck="false" placeholder="正規表示式，例如 \\d+"><span class="slash">/</span><input class="in mono flags" id="rxF" value="g" spellcheck="false" title="旗標：g i m s u y"></div>
          <div class="btnrow" style="margin-top:10px"><span class="dim-note">常用：</span>${RX_PRESETS.map(([n], i) => `<button class="btn sm ghost" data-p="${i}">${n}</button>`).join('')}</div>
          <div class="status" id="rxStat"></div>
        </div>
        <div class="tgrid cols2">
          <div class="panel"><h4>測試文字</h4><textarea class="in mono tall" id="rxT" spellcheck="false"></textarea></div>
          <div class="panel"><h4>比對結果</h4><div class="rx-view" id="rxView"></div></div>
        </div>
        <div class="panel"><h4>符合項目</h4><div class="rx-list" id="rxList"></div></div>
        <div class="panel"><h4>取代</h4><input class="in mono" id="rxR" spellcheck="false" placeholder="取代為，可用 $1、$<name>、$&"><pre class="codeout" id="rxOut"></pre></div>`;
      const P = $(el, '#rxP'), F = $(el, '#rxF'), T = $(el, '#rxT'), R = $(el, '#rxR');
      T.value = RX_SAMPLE;
      P.value = RX_PRESETS[0][1];
      function run() {
        const st = $(el, '#rxStat'), text = T.value;
        $(el, '#rxView').textContent = text; $(el, '#rxList').innerHTML = ''; $(el, '#rxOut').textContent = '';
        if (!P.value) { st.innerHTML = '<span class="dim-note">輸入正規表示式開始比對</span>'; return; }
        let re;
        try { re = new RegExp(P.value, F.value.replace(/[^dgimsuyv]/g, '')); }
        catch (e) { st.innerHTML = `<span class="bad-note">✗ ${esc(e.message)}</span>`; return; }
        const all = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
        const matches = [];
        let m;
        while ((m = all.exec(text)) && matches.length < 1000) {
          matches.push(m);
          if (m[0] === '') all.lastIndex++;
          if (!re.flags.includes('g')) break;
        }
        st.innerHTML = matches.length ? `<span class="ok-note">✓ ${matches.length}${matches.length >= 1000 ? '+' : ''} 個符合</span>${re.flags.includes('g') ? '' : ' <span class="dim-note">（未加 g 旗標，只找第一個）</span>'}`
          : '<span class="dim-note">沒有符合的內容</span>';
        let html = '', last = 0;
        matches.forEach((mm, i) => {
          html += esc(text.slice(last, mm.index)) + `<mark class="m${i % 2}">${esc(mm[0]) || '<span class="zero">∅</span>'}</mark>`;
          last = mm.index + mm[0].length;
        });
        $(el, '#rxView').innerHTML = html + esc(text.slice(last));
        $(el, '#rxList').innerHTML = matches.slice(0, 200).map((mm, i) => {
          const groups = mm.slice(1).map((g, gi) => `<span class="grp">$${gi + 1}: ${g === undefined ? '<i>undefined</i>' : esc(g)}</span>`);
          if (mm.groups) Object.entries(mm.groups).forEach(([k, g]) => groups.push(`<span class="grp named">${esc(k)}: ${esc(g ?? '')}</span>`));
          return `<div class="rx-item"><span class="dim-note">#${i + 1} · 位置 ${mm.index}</span><code>${esc(mm[0])}</code>${groups.join('')}</div>`;
        }).join('') + (matches.length > 200 ? '<div class="dim-note">…僅列出前 200 個</div>' : '');
        try { $(el, '#rxOut').textContent = text.replace(re, R.value); } catch {}
      }
      [P, F, T, R].forEach(i => i.addEventListener('input', debounce(run, 120)));
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-p]'); if (!b) return;
        P.value = RX_PRESETS[+b.dataset.p][1]; if (!F.value.includes('g')) F.value += 'g'; run();
      });
      run();
    },
  };

  /* ======================= hash ======================= */
  function md5(bytes) {
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    const K = new Uint32Array(64);
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
    const len = bytes.length, nBlocks = ((len + 8) >> 6) + 1;
    const W = new Uint32Array(nBlocks * 16);
    for (let i = 0; i < len; i++) W[i >> 2] |= bytes[i] << ((i % 4) * 8);
    W[len >> 2] |= 0x80 << ((len % 4) * 8);
    W[nBlocks * 16 - 2] = (len * 8) >>> 0;
    W[nBlocks * 16 - 1] = Math.floor(len / 0x20000000);
    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (let blk = 0; blk < nBlocks; blk++) {
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + W[blk * 16 + g]) >>> 0;
        const sh = S[(i >> 4) * 4 + (i % 4)];
        A = D; D = C; C = B;
        B = (B + ((F << sh) | (F >>> (32 - sh)))) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    return [a0, b0, c0, d0].map(x => [0, 8, 16, 24].map(s => ((x >>> s) & 255).toString(16).padStart(2, '0')).join('')).join('');
  }
  async function hashAll(bytes) {
    const out = [['MD5', md5(bytes)]];
    for (const alg of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
      try { out.push([alg, bytesToHex(new Uint8Array(await crypto.subtle.digest(alg, bytes)))]); }
      catch { out.push([alg, '（需要安全環境 HTTPS / localhost）']); }
    }
    return out;
  }
  const hash = {
    title: '雜湊計算', desc: 'MD5、SHA-1、SHA-256/384/512（文字或檔案）',
    sub: '計算文字或檔案的雜湊值，全部在瀏覽器內完成',
    cliHint: 'hash <文字> 直接計算',
    build(el) {
      el.innerHTML = `
        <div class="tgrid cols2">
          <div class="panel"><h4>文字</h4><textarea class="in mono" id="hT" spellcheck="false" placeholder="輸入要計算雜湊的文字"></textarea></div>
          <div class="panel"><h4>檔案</h4><label class="drop" id="hDrop"><input type="file" id="hF" hidden><span>點此選擇檔案，或把檔案拖曳到這裡</span></label><div class="status" id="hFInfo"></div></div>
        </div>
        <div class="panel">
          <div class="btnrow"><h4 style="margin:0">結果 <span class="dim-note" id="hSrc"></span></h4><span class="grow"></span><label class="chk"><input type="checkbox" id="hUp"> 大寫</label></div>
          <div id="hOut"></div>
          <label class="field" style="margin-top:14px"><span>比對：貼上預期的雜湊值</span><input class="in mono" id="hCmp" spellcheck="false"></label>
          <div class="status" id="hCmpStat"></div>
        </div>`;
      let results = [];
      const draw = () => {
        const up = $(el, '#hUp').checked;
        const cmp = $(el, '#hCmp').value.trim().toLowerCase();
        $(el, '#hOut').innerHTML = rows(results.map(([k, v]) => [k, up && !v.startsWith('（') ? v.toUpperCase() : v]));
        $$(el, '#hOut .trow').forEach((r, i) => r.classList.toggle('match', !!cmp && results[i][1] === cmp));
        const hit = cmp && results.find(r => r[1] === cmp);
        $(el, '#hCmpStat').innerHTML = !cmp ? '' : hit ? `<span class="ok-note">✓ 與 ${hit[0]} 相符</span>` : '<span class="bad-note">✗ 沒有相符的雜湊值</span>';
      };
      async function fromBytes(bytes, label) {
        $(el, '#hSrc').textContent = `（${label}）`;
        results = await hashAll(bytes);
        draw();
      }
      const fromText = () => fromBytes(new TextEncoder().encode($(el, '#hT').value), '文字');
      async function fromFile(f) {
        if (!f) return;
        $(el, '#hFInfo').innerHTML = `<span class="dim-note">讀取中：${esc(f.name)}…</span>`;
        const buf = new Uint8Array(await f.arrayBuffer());
        $(el, '#hFInfo').innerHTML = `<span class="dim-note">${esc(f.name)} · ${buf.length.toLocaleString()} bytes</span>`;
        fromBytes(buf, '檔案：' + f.name);
      }
      $(el, '#hT').addEventListener('input', debounce(fromText, 150));
      $(el, '#hF').addEventListener('change', e => fromFile(e.target.files[0]));
      const drop = $(el, '#hDrop');
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); fromFile(e.dataTransfer.files[0]); });
      $(el, '#hUp').addEventListener('change', draw);
      $(el, '#hCmp').addEventListener('input', draw);
      fromText();
    },
    async cli(arg) {
      const r = await hashAll(new TextEncoder().encode(arg));
      ctx.print(ctx.kv(r));
    },
  };

  /* ======================= diff ======================= */
  function lineDiff(a, b, norm) {
    const n = a.length, m = b.length;
    if (n * m > 4e6) return null;
    const A = a.map(norm), B = b.map(norm);
    const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { ops.push(['=', i++, j++]); }
      else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push(['-', i++, null]);
      else ops.push(['+', null, j++]);
    }
    while (i < n) ops.push(['-', i++, null]);
    while (j < m) ops.push(['+', null, j++]);
    return ops;
  }
  function charMark(x, y) {
    let p = 0; while (p < x.length && p < y.length && x[p] === y[p]) p++;
    let s = 0; while (s < x.length - p && s < y.length - p && x[x.length - 1 - s] === y[y.length - 1 - s]) s++;
    const wrap = t => `${esc(t.slice(0, p))}<em>${esc(t.slice(p, t.length - s))}</em>${esc(t.slice(t.length - s))}`;
    return [wrap(x), wrap(y)];
  }
  const diff = {
    title: '文字比對', desc: '比較兩段文字，逐行標示差異',
    sub: '貼上原始與修改後的文字，標示新增、刪除與修改',
    build(el) {
      el.innerHTML = `
        <div class="tgrid cols2">
          <div class="panel"><h4>原始</h4><textarea class="in mono tall" id="dA" spellcheck="false"></textarea></div>
          <div class="panel"><h4>修改後</h4><textarea class="in mono tall" id="dB" spellcheck="false"></textarea></div>
        </div>
        <div class="panel">
          <div class="btnrow">
            <label class="chk"><input type="checkbox" id="dWs"> 忽略空白差異</label>
            <label class="chk"><input type="checkbox" id="dCase"> 忽略大小寫</label>
            <label class="chk"><input type="checkbox" id="dOnly" checked> 只顯示差異附近</label>
            <span class="grow"></span><span class="status" id="dStat"></span>
          </div>
          <div class="diff" id="dOut"></div>
        </div>`;
      $(el, '#dA').value = '第一行\n第二行內容\n第三行\n第四行';
      $(el, '#dB').value = '第一行\n第二行的新內容\n第三行\n新增的一行\n第四行';
      function run() {
        const a = $(el, '#dA').value.split('\n'), b = $(el, '#dB').value.split('\n');
        const ws = $(el, '#dWs').checked, ic = $(el, '#dCase').checked;
        const norm = s => { if (ws) s = s.trim().replace(/\s+/g, ' '); if (ic) s = s.toLowerCase(); return s; };
        const ops = lineDiff(a, b, norm);
        if (!ops) { $(el, '#dStat').innerHTML = '<span class="bad-note">內容過大（超過約 2000 × 2000 行），無法比對</span>'; $(el, '#dOut').innerHTML = ''; return; }
        const add = ops.filter(o => o[0] === '+').length, del = ops.filter(o => o[0] === '-').length;
        $(el, '#dStat').innerHTML = add || del ? `<span class="ok-note">+${add}</span> <span class="bad-note">−${del}</span>` : '<span class="ok-note">✓ 內容相同</span>';
        // 相鄰的刪除 + 新增視為修改，標出字元差異
        const html = [];
        const keep = new Set();
        if ($(el, '#dOnly').checked) ops.forEach((o, k) => { if (o[0] !== '=') for (let d = -3; d <= 3; d++) keep.add(k + d); });
        let skipped = 0;
        for (let k = 0; k < ops.length; k++) {
          const o = ops[k];
          if ($(el, '#dOnly').checked && o[0] === '=' && !keep.has(k)) { skipped++; continue; }
          if (skipped) { html.push(`<div class="dl skip">⋯ ${skipped} 行相同</div>`); skipped = 0; }
          if (o[0] === '-' && ops[k + 1] && ops[k + 1][0] === '+') {
            const [x, y] = charMark(a[o[1]], b[ops[k + 1][2]]);
            html.push(`<div class="dl del"><span class="ln">${o[1] + 1}</span><span class="ln"></span><span class="sg">−</span><span class="tx">${x}</span></div>`);
            html.push(`<div class="dl add"><span class="ln"></span><span class="ln">${ops[k + 1][2] + 1}</span><span class="sg">+</span><span class="tx">${y}</span></div>`);
            k++; continue;
          }
          const cls = o[0] === '+' ? 'add' : o[0] === '-' ? 'del' : '';
          const txt = o[0] === '+' ? b[o[2]] : a[o[1]];
          html.push(`<div class="dl ${cls}"><span class="ln">${o[1] !== null ? o[1] + 1 : ''}</span><span class="ln">${o[2] !== null ? o[2] + 1 : ''}</span><span class="sg">${o[0] === '=' ? ' ' : o[0] === '-' ? '−' : '+'}</span><span class="tx">${esc(txt)}</span></div>`);
        }
        if (skipped) html.push(`<div class="dl skip">⋯ ${skipped} 行相同</div>`);
        $(el, '#dOut').innerHTML = html.join('');
      }
      $$(el, 'textarea').forEach(t => t.addEventListener('input', debounce(run, 250)));
      $$(el, 'input[type=checkbox]').forEach(c => c.addEventListener('change', run));
      run();
    },
  };

  /* ======================= password ======================= */
  const SETS = { upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', digit: '0123456789', symbol: '!@#$%^&*()-_=+[]{};:,.<>?/~' };
  function genPassword(len, opts) {
    const amb = /[Il1O0o]/g;
    const sets = Object.keys(SETS).filter(k => opts[k]).map(k => opts.noAmb ? SETS[k].replace(amb, '') : SETS[k]);
    if (!sets.length) return '';
    const pool = sets.join('');
    const chars = sets.slice(0, len).map(s => s[randInt(s.length)]); // 每種字元至少一個
    while (chars.length < len) chars.push(pool[randInt(pool.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = randInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return chars.join('');
  }
  const password = {
    title: '密碼產生器', desc: '以密碼學亂數產生安全密碼',
    sub: '使用 crypto.getRandomValues 產生，不會傳送到任何地方',
    cliHint: 'password <長度> 直接產生',
    build(el) {
      el.innerHTML = `
        <div class="panel">
          <div class="pw-list" id="pwList"></div>
          <div class="pw-strength"><div class="meter-bar"><i id="pwBar"></i></div><span id="pwStr"></span></div>
        </div>
        <div class="panel">
          <div class="field"><span>長度：<b id="pwLenV">16</b></span><input type="range" id="pwLen" min="4" max="128" value="16"></div>
          <div class="btnrow" style="margin-top:12px">
            <label class="chk"><input type="checkbox" data-o="upper" checked> 大寫 A-Z</label>
            <label class="chk"><input type="checkbox" data-o="lower" checked> 小寫 a-z</label>
            <label class="chk"><input type="checkbox" data-o="digit" checked> 數字 0-9</label>
            <label class="chk"><input type="checkbox" data-o="symbol" checked> 符號 !@#</label>
            <label class="chk"><input type="checkbox" data-o="noAmb"> 排除易混淆字元（I l 1 O 0 o）</label>
          </div>
          <div class="btnrow" style="margin-top:12px">
            <label class="field-inline">數量 <input type="number" class="in num" id="pwN" min="1" max="20" value="5"></label>
            <span class="grow"></span>
            <button class="btn primary" id="pwGen">重新產生</button>
          </div>
        </div>`;
      const opts = () => Object.fromEntries($$(el, '[data-o]').map(c => [c.dataset.o, c.checked]));
      function gen() {
        const len = +$(el, '#pwLen').value, o = opts();
        $(el, '#pwLenV').textContent = len;
        const n = Math.min(20, Math.max(1, +$(el, '#pwN').value || 1));
        const list = Array.from({ length: n }, () => genPassword(len, o));
        $(el, '#pwList').innerHTML = list[0] ? list.map(p => `<div class="pw"><code>${esc(p)}</code><button class="btn sm" data-copy='${attr(p)}'>複製</button></div>`).join('')
          : '<div class="bad-note">請至少選擇一種字元</div>';
        let pool = Object.keys(SETS).filter(k => o[k]).map(k => o.noAmb ? SETS[k].replace(/[Il1O0o]/g, '') : SETS[k]).join('').length;
        const bits = pool ? len * Math.log2(pool) : 0;
        const [label, cls] = bits < 40 ? ['弱', 'w1'] : bits < 60 ? ['普通', 'w2'] : bits < 80 ? ['強', 'w3'] : ['非常強', 'w4'];
        $(el, '#pwBar').style.width = Math.min(100, bits / 128 * 100) + '%';
        $(el, '#pwBar').className = cls;
        $(el, '#pwStr').innerHTML = `強度：<b>${label}</b> · 約 ${Math.round(bits)} bits 熵`;
      }
      $(el, '#pwLen').addEventListener('input', gen);
      $(el, '#pwN').addEventListener('input', gen);
      $$(el, '[data-o]').forEach(c => c.addEventListener('change', gen));
      $(el, '#pwGen').onclick = gen;
      gen();
    },
    cli(arg) {
      const len = Math.min(128, Math.max(4, parseInt(arg, 10) || 16));
      ctx.print(`<span class="k">${esc(genPassword(len, { upper: 1, lower: 1, digit: 1, symbol: 1 }))}</span>`);
    },
  };

  /* ======================= uuid ======================= */
  function uuid(ver) {
    const b = crypto.getRandomValues(new Uint8Array(16));
    if (ver === 7) {
      const ts = Date.now();
      for (let i = 0; i < 6; i++) b[i] = Math.floor(ts / 2 ** (8 * (5 - i))) & 255;
    }
    b[6] = (b[6] & 0x0f) | (ver << 4);
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = bytesToHex(b);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  const uuidTool = {
    title: 'UUID 產生器', desc: '批次產生 UUID v4 / v7 與解析',
    sub: 'v4 為完全隨機；v7 以時間排序，適合當資料庫主鍵',
    cliHint: 'uuid <數量> 直接產生',
    build(el) {
      el.innerHTML = `
        <div class="panel">
          <div class="btnrow">
            <div class="seg" id="uV"><button class="on" data-v="4">v4 隨機</button><button data-v="7">v7 時間排序</button></div>
            <label class="field-inline">數量 <input type="number" class="in num" id="uN" min="1" max="500" value="10"></label>
            <label class="chk"><input type="checkbox" id="uUp"> 大寫</label>
            <label class="chk"><input type="checkbox" id="uNoDash"> 無連字號</label>
            <label class="chk"><input type="checkbox" id="uBrace"> 大括號 {}</label>
          </div>
          <textarea class="in mono tall" id="uOut" readonly></textarea>
          <div class="btnrow"><button class="btn primary" id="uGen">重新產生</button><button class="btn" id="uCopy">全部複製</button></div>
        </div>
        <div class="panel"><h4>解析 UUID</h4><input class="in mono" id="uIn" spellcheck="false" placeholder="貼上任一 UUID"><div id="uInfo"></div></div>`;
      let ver = 4;
      function gen() {
        const n = Math.min(500, Math.max(1, +$(el, '#uN').value || 1));
        const up = $(el, '#uUp').checked, nd = $(el, '#uNoDash').checked, br = $(el, '#uBrace').checked;
        $(el, '#uOut').value = Array.from({ length: n }, () => {
          let u = uuid(ver); if (nd) u = u.replace(/-/g, ''); if (up) u = u.toUpperCase(); return br ? `{${u}}` : u;
        }).join('\n');
      }
      function parse() {
        const v = $(el, '#uIn').value.trim();
        if (!v) { $(el, '#uInfo').innerHTML = ''; return; }
        const h = v.replace(/[{}-]/g, '').toLowerCase();
        if (!/^[0-9a-f]{32}$/.test(h)) { $(el, '#uInfo').innerHTML = '<div class="status"><span class="bad-note">不是有效的 UUID</span></div>'; return; }
        const version = parseInt(h[12], 16), vn = parseInt(h[16], 16);
        const variant = vn < 8 ? 'NCS（保留）' : vn < 12 ? 'RFC 4122 / 9562' : vn < 14 ? 'Microsoft（保留）' : '未來保留';
        const info = [['版本', `v${version}`], ['變體', variant], ['標準格式', `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`]];
        if (version === 7) { const ms = parseInt(h.slice(0, 12), 16); info.push(['時間戳', String(ms)], ['產生時間', new Date(ms).toLocaleString()]); }
        if (h === '0'.repeat(32)) info.unshift(['特殊值', 'Nil UUID']);
        $(el, '#uInfo').innerHTML = rows(info);
      }
      $(el, '#uV').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        ver = +b.dataset.v; $$(el, '#uV button').forEach(x => x.classList.toggle('on', x === b)); gen();
      });
      $$(el, '#uN, #uUp, #uNoDash, #uBrace').forEach(i => i.addEventListener('input', gen));
      $(el, '#uGen').onclick = gen;
      $(el, '#uCopy').onclick = e => copyText($(el, '#uOut').value, e.currentTarget);
      $(el, '#uIn').addEventListener('input', parse);
      gen();
    },
    cli(arg) {
      const n = Math.min(100, Math.max(1, parseInt(arg, 10) || 1));
      ctx.print(Array.from({ length: n }, () => `<span class="k">${uuid(4)}</span>`).join('\n'));
    },
  };

  /* ======================= qr ======================= */
  let qrLoading = null;
  function loadQR() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (qrLoading) return qrLoading;
    qrLoading = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
      s.onload = () => res(window.qrcode);
      s.onerror = () => { qrLoading = null; s.remove(); rej(new Error('無法載入 QR Code 函式庫（需要網路連線）')); };
      document.head.appendChild(s);
    });
    return qrLoading;
  }
  const qr = {
    title: 'QR Code 產生器', desc: '文字或網址轉成 QR Code，可下載 PNG / SVG',
    sub: '輸入文字或網址，即時產生 QR Code',
    build(el) {
      el.innerHTML = `
        <div class="tgrid cols2">
          <div class="panel">
            <h4>內容</h4>
            <textarea class="in" id="qT" placeholder="https://example.com">https://example.com</textarea>
            <div class="btnrow" style="margin-top:12px">
              <label class="field-inline">尺寸 <select class="in sm" id="qSize">${[128, 256, 384, 512, 768, 1024].map(s => `<option ${s === 384 ? 'selected' : ''}>${s}</option>`).join('')}</select> px</label>
              <label class="field-inline">容錯 <select class="in sm" id="qEcl"><option value="L">L 7%</option><option value="M" selected>M 15%</option><option value="Q">Q 25%</option><option value="H">H 30%</option></select></label>
              <label class="field-inline">邊界 <input type="number" class="in num" id="qM" min="0" max="10" value="2"></label>
            </div>
            <div class="btnrow" style="margin-top:12px">
              <label class="field-inline">前景 <input type="color" class="colorin" id="qFg" value="#000000"></label>
              <label class="field-inline">背景 <input type="color" class="colorin" id="qBg" value="#ffffff"></label>
            </div>
            <div class="status" id="qStat"></div>
          </div>
          <div class="panel qr-out">
            <canvas id="qC"></canvas>
            <div class="btnrow center"><button class="btn primary" id="qPng">下載 PNG</button><button class="btn" id="qSvg">下載 SVG</button><button class="btn" id="qCopy">複製圖片</button></div>
          </div>
        </div>`;
      let model = null;
      async function draw() {
        const st = $(el, '#qStat');
        const text = $(el, '#qT').value;
        if (!text) { st.innerHTML = '<span class="dim-note">請輸入內容</span>'; return; }
        let lib;
        try { lib = await loadQR(); } catch (e) { st.innerHTML = `<span class="bad-note">${esc(e.message)}</span>`; return; }
        try {
          lib.stringToBytes = lib.stringToBytesFuncs['UTF-8'];
          const q = lib(0, $(el, '#qEcl').value);
          q.addData(text); q.make();
          model = q;
        } catch { st.innerHTML = '<span class="bad-note">內容太長，無法產生 QR Code（可降低容錯等級）</span>'; return; }
        const n = model.getModuleCount(), margin = +$(el, '#qM').value || 0, size = +$(el, '#qSize').value;
        const cell = Math.max(1, Math.floor(size / (n + margin * 2)));
        const px = cell * (n + margin * 2);
        const c = $(el, '#qC'); c.width = c.height = px;
        const g = c.getContext('2d');
        g.fillStyle = $(el, '#qBg').value; g.fillRect(0, 0, px, px);
        g.fillStyle = $(el, '#qFg').value;
        for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (model.isDark(r, k)) g.fillRect((k + margin) * cell, (r + margin) * cell, cell, cell);
        st.innerHTML = `<span class="ok-note">✓</span> 版本 ${(n - 17) / 4} · ${n}×${n} 模組 · ${px}×${px} px · ${new TextEncoder().encode(text).length} bytes`;
      }
      function svg() {
        const n = model.getModuleCount(), m = +$(el, '#qM').value || 0, s = n + m * 2;
        let d = '';
        for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (model.isDark(r, k)) d += `M${k + m} ${r + m}h1v1h-1z`;
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${$(el, '#qBg').value}"/><path d="${d}" fill="${$(el, '#qFg').value}"/></svg>`;
      }
      $$(el, 'textarea, select, input').forEach(i => i.addEventListener('input', debounce(draw, 150)));
      $(el, '#qPng').onclick = () => model && $(el, '#qC').toBlob(b => download('qrcode.png', b));
      $(el, '#qSvg').onclick = () => model && download('qrcode.svg', new Blob([svg()], { type: 'image/svg+xml' }));
      $(el, '#qCopy').onclick = e => {
        const btn = e.currentTarget;
        if (!model) return;
        $(el, '#qC').toBlob(async b => {
          try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); btn.textContent = '已複製'; }
          catch { btn.textContent = '此瀏覽器不支援'; }
          setTimeout(() => { btn.textContent = '複製圖片'; }, 1500);
        });
      };
      draw();
    },
  };

  /* ======================= units ======================= */
  const UNITS = {
    length: ['長度', { 'mm 毫米': 0.001, 'cm 公分': 0.01, 'm 公尺': 1, 'km 公里': 1000, 'in 英吋': 0.0254, 'ft 英尺': 0.3048, 'yd 碼': 0.9144, 'mi 英里': 1609.344, 'nmi 海里': 1852, '台尺': 10 / 33, '台寸': 1 / 33 }, 'm 公尺'],
    weight: ['重量', { 'mg 毫克': 1e-6, 'g 公克': 0.001, 'kg 公斤': 1, 't 公噸': 1000, 'oz 盎司': 0.028349523125, 'lb 磅': 0.45359237, '台斤': 0.6, '台兩': 0.0375, 'ct 克拉': 0.0002 }, 'kg 公斤'],
    temp: ['溫度', null, '°C 攝氏'],
    area: ['面積', { 'cm² 平方公分': 1e-4, 'm² 平方公尺': 1, 'km² 平方公里': 1e6, 'ha 公頃': 1e4, 'ft² 平方英尺': 0.09290304, 'acre 英畝': 4046.8564224, '坪': 400 / 121, '甲': 9699.17 }, 'm² 平方公尺'],
    speed: ['速度', { 'm/s': 1, 'km/h': 1 / 3.6, 'mph 英里/時': 0.44704, 'kn 節': 1852 / 3600, 'ft/s': 0.3048 }, 'km/h'],
    time: ['時間', { 'ms 毫秒': 0.001, 's 秒': 1, 'min 分': 60, 'h 小時': 3600, 'day 天': 86400, 'week 週': 604800, 'year 年': 31557600 }, 'h 小時'],
    data: ['資料大小', { 'bit': 0.125, 'B': 1, 'KB': 1e3, 'MB': 1e6, 'GB': 1e9, 'TB': 1e12, 'PB': 1e15, 'KiB': 1024, 'MiB': 1024 ** 2, 'GiB': 1024 ** 3, 'TiB': 1024 ** 4, 'PiB': 1024 ** 5 }, 'MB'],
    css: ['CSS 單位', null, 'px'],
  };
  const TEMP = {
    '°C 攝氏': [c => c, c => c], '°F 華氏': [f => (f - 32) * 5 / 9, c => c * 9 / 5 + 32], 'K 克氏': [k => k - 273.15, c => c + 273.15],
  };
  const fmtU = n => {
    if (!isFinite(n)) return '—';
    const a = Math.abs(n);
    if (a !== 0 && (a >= 1e15 || a < 1e-6)) return n.toExponential(6).replace(/\.?0+e/, 'e');
    return n.toLocaleString('en-US', { maximumSignificantDigits: 10 });
  };
  const units = {
    title: '單位換算', desc: '長度、重量、溫度、面積、資料大小、CSS 單位',
    sub: '輸入數值，即時換算成同類所有單位（點結果可複製）',
    build(el) {
      el.innerHTML = `
        <div class="panel">
          <div class="seg wrap" id="unCat">${Object.entries(UNITS).map(([k, [n]], i) => `<button data-c="${k}" class="${i ? '' : 'on'}">${n}</button>`).join('')}</div>
          <div class="btnrow" style="margin-top:14px">
            <input type="number" class="in grow big-in" id="unV" value="1" step="any">
            <select class="in" id="unFrom"></select>
          </div>
          <div class="btnrow css-only" id="unCss" hidden style="margin-top:10px">
            <label class="field-inline">根字級 <input type="number" class="in num" id="unBase" value="16"> px</label>
            <span class="dim-note">vw / vh 依目前視窗：${innerWidth} × ${innerHeight}</span>
          </div>
        </div>
        <div class="unit-grid" id="unOut"></div>`;
      let cat = 'length';
      const cssUnits = () => {
        const base = +$(el, '#unBase').value || 16;
        return { 'px': 1, 'rem': base, 'em': base, 'pt': 4 / 3, 'pc': 16, 'in': 96, 'cm': 96 / 2.54, 'mm': 96 / 25.4, 'vw': innerWidth / 100, 'vh': innerHeight / 100 };
      };
      const table = () => cat === 'css' ? cssUnits() : UNITS[cat][1];
      function fillSelect() {
        const names = cat === 'temp' ? Object.keys(TEMP) : Object.keys(table());
        $(el, '#unFrom').innerHTML = names.map(n => `<option ${n === UNITS[cat][2] ? 'selected' : ''}>${esc(n)}</option>`).join('');
        $(el, '#unCss').hidden = cat !== 'css';
      }
      function run() {
        const v = parseFloat($(el, '#unV').value), from = $(el, '#unFrom').value;
        let res;
        if (cat === 'temp') { const c = TEMP[from][0](v); res = Object.entries(TEMP).map(([n, [, to]]) => [n, to(c)]); }
        else { const t = table(), base = v * t[from]; res = Object.entries(t).map(([n, f]) => [n, base / f]); }
        $(el, '#unOut').innerHTML = res.map(([n, val]) => {
          const s = isNaN(v) ? '—' : fmtU(val);
          return `<button class="unit${n === from ? ' src' : ''}" data-copy='${attr(s.replace(/,/g, ''))}'><b>${esc(s)}</b><span>${esc(n)}</span></button>`;
        }).join('');
      }
      $(el, '#unCat').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        cat = b.dataset.c; $$(el, '#unCat button').forEach(x => x.classList.toggle('on', x === b)); fillSelect(); run();
      });
      $$(el, '#unV, #unFrom, #unBase').forEach(i => i.addEventListener('input', run));
      fillSelect(); run();
    },
  };

  /* ======================= count ======================= */
  const count = {
    title: '字數統計', desc: '字元、中文字、英文單字、行數、位元組',
    sub: '貼上文字，即時統計',
    build(el) {
      el.innerHTML = `
        <div class="panel"><textarea class="in tall" id="wT" placeholder="在這裡輸入或貼上文字"></textarea>
          <div class="btnrow"><button class="btn ghost" id="wClear">清除</button></div></div>
        <div class="stat-grid" id="wOut"></div>`;
      const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('zh', { granularity: 'grapheme' }) : null;
      function run() {
        const t = $(el, '#wT').value;
        const chars = seg ? [...seg.segment(t)].map(s => s.segment) : [...t];
        const cjk = (t.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u{20000}-\u{2ffff}]/gu) || []).length;
        const words = (t.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
        const nums = (t.match(/\d+(?:\.\d+)?/g) || []).length;
        const punct = (t.match(/\p{P}/gu) || []).length;
        const lines = t ? t.split(/\r\n|\r|\n/).length : 0;
        const paras = t.split(/\n\s*\n/).filter(p => p.trim()).length;
        const bytes = new TextEncoder().encode(t).length;
        const mins = cjk / 400 + words / 200;
        const read = mins < 1 / 60 ? '—' : mins < 1 ? `約 ${Math.ceil(mins * 60)} 秒` : `約 ${Math.floor(mins)} 分 ${Math.round(mins % 1 * 60)} 秒`;
        const stats = [
          ['字元（含空白）', chars.length], ['字元（不含空白）', chars.filter(c => !/\s/.test(c)).length],
          ['中文字', cjk], ['英文單字', words], ['數字', nums], ['標點符號', punct],
          ['行數', lines], ['段落', paras], ['UTF-8 位元組', bytes], ['閱讀時間', read],
        ];
        $(el, '#wOut').innerHTML = stats.map(([k, v]) => `<div class="stat"><b>${typeof v === 'number' ? v.toLocaleString() : esc(v)}</b><span>${k}</span></div>`).join('');
      }
      $(el, '#wT').addEventListener('input', run);
      $(el, '#wClear').onclick = () => { $(el, '#wT').value = ''; run(); };
      run();
    },
  };

  /* ======================= notes ======================= */
  const NKEY = 'term.notes';
  const notes = {
    title: '便條紙', desc: '自動儲存到 localStorage 的筆記',
    sub: '輸入即自動儲存；第一行會當作標題',
    build(el) {
      el.innerHTML = `
        <div class="notes-layout">
          <div class="panel notes-side">
            <div class="btnrow"><input type="search" class="in grow" id="nQ" placeholder="搜尋"><button class="btn primary" id="nNew">＋ 新增</button></div>
            <ul class="note-list" id="nList"></ul>
          </div>
          <div class="panel notes-main">
            <textarea class="in note-ed" id="nEd" placeholder="開始輸入…"></textarea>
            <div class="btnrow"><span class="dim-note" id="nMeta"></span><span class="grow"></span>
              <button class="btn sm" id="nDl">下載 .txt</button><button class="btn sm danger" id="nDel">刪除</button></div>
          </div>
        </div>`;
      let list = [];
      try { list = JSON.parse(store.get(NKEY) || '[]'); if (!Array.isArray(list)) list = []; } catch { list = []; }
      let curId = null;
      const save = () => store.set(NKEY, JSON.stringify(list));
      const titleOf = n => (n.text.split('\n').find(l => l.trim()) || '（未命名）').trim().slice(0, 40);
      const cur = () => list.find(n => n.id === curId);
      function newNote() {
        const n = { id: Date.now().toString(36) + randInt(1e6).toString(36), text: '', updated: Date.now() };
        list.unshift(n); curId = n.id; save(); renderList(); openNote();
        $(el, '#nEd').focus();
      }
      function renderList() {
        const q = $(el, '#nQ').value.trim().toLowerCase();
        const shown = list.slice().sort((a, b) => b.updated - a.updated).filter(n => !q || n.text.toLowerCase().includes(q));
        $(el, '#nList').innerHTML = shown.length ? shown.map(n =>
          `<li><button class="${n.id === curId ? 'on' : ''}" data-id="${n.id}"><b>${esc(titleOf(n))}</b><span>${new Date(n.updated).toLocaleString()}</span></button></li>`).join('')
          : '<li class="empty">沒有筆記</li>';
      }
      function openNote() {
        const n = cur();
        $(el, '#nEd').value = n ? n.text : '';
        $(el, '#nEd').disabled = !n;
        meta();
      }
      const meta = () => { const n = cur(); $(el, '#nMeta').textContent = n ? `${[...n.text].length} 字 · 已儲存 ${new Date(n.updated).toLocaleTimeString()}` : ''; };
      const persist = debounce(() => { save(); renderList(); meta(); }, 400);
      $(el, '#nEd').addEventListener('input', e => { const n = cur(); if (!n) return; n.text = e.target.value; n.updated = Date.now(); persist(); });
      $(el, '#nNew').onclick = newNote;
      $(el, '#nQ').addEventListener('input', renderList);
      $(el, '#nList').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (!b) return; curId = b.dataset.id; renderList(); openNote(); });
      $(el, '#nDel').onclick = () => {
        const n = cur(); if (!n) return;
        if (n.text.trim() && !confirm(`確定要刪除「${titleOf(n)}」？`)) return;
        list = list.filter(x => x.id !== n.id); save();
        curId = list.slice().sort((a, b) => b.updated - a.updated)[0]?.id || null;
        if (!curId) return newNote();
        renderList(); openNote();
      };
      $(el, '#nDl').onclick = () => { const n = cur(); if (n) download(titleOf(n).replace(/[\\/:*?"<>|]/g, '_') + '.txt', new Blob([n.text], { type: 'text/plain;charset=utf-8' })); };
      if (!list.length) newNote(); else { curId = list.slice().sort((a, b) => b.updated - a.updated)[0].id; renderList(); openNote(); }
    },
  };

  const tools = { color, json, time, encode, timer, regex, hash, diff, password, uuid: uuidTool, qr, units, count, notes };
  // 每個工具掛載時加上「點擊 data-copy 即複製」的共用行為
  for (const t of Object.values(tools)) {
    t.mount = el => {
      el.addEventListener('click', e => { const b = e.target.closest('[data-copy]'); if (b) copyText(b.dataset.copy, b); });
      t.build(el);
    };
  }
  return tools;
};
