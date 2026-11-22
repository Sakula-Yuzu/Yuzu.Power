(() => {
  const canvas = document.querySelector('[data-overlay-canvas]');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const unit = 0.8;
  const color = {
    background: '#0c1929', charging: '#40d2b4', discharge: '#50aef5',
    label: '#76b4da', text: '#ffffff', warm: '#ffc167', hot: '#ff4856', batteryOrange: '#ff9148',
    thermal: ['#40d2b4', '#98d25a', '#ffd04a', '#ff9741', '#ff4856']
  };
  const clusterColors = ['#4adcff', '#ffd04a', '#e270ff'];
  // MAX 悬浮窗预设（OverlayPresetStore "max"，展开 12×8 / 收起 8×6）。
  const full = { columns: 12, rows: 8, cell: 32, cellH: 32, padding: 12, corner: 24, items: [
    ['power', 0, 0, 2, 1], ['batteryTemp', 2, 0, 2, 1], ['current', 4, 0, 2, 1], ['memory', 6, 0, 4, 1], ['close', 10, 0, 2, 1],
    ['skinTemp', 0, 1, 2, 1], ['voltage', 2, 1, 2, 1], ['cpuTemp', 4, 1, 2, 1], ['capacity', 6, 1, 4, 1], ['touch', 10, 1, 2, 1],
    ['powerHistory', 0, 2, 4, 1], ['gpuTemp', 4, 2, 2, 1], ['storage', 6, 2, 6, 1],
    ['thermalGraph', 0, 3, 4, 1], ['thermalStatus', 4, 3, 4, 1], ['fps', 8, 3, 2, 1], ['charge', 10, 3, 2, 2],
    ['cpuHistory', 0, 4, 4, 4], ['cpuUsage', 4, 4, 2, 1], ['npuTemp', 6, 4, 2, 1], ['brightness', 8, 4, 2, 1],
    ['freqLimit', 4, 5, 2, 1], ['refresh', 6, 5, 2, 1], ['bootTime', 8, 5, 4, 1],
    ['cpuFrequency', 4, 6, 8, 2]
  ] };
  const compact = { columns: 8, rows: 6, cell: 20, cellH: 12, padding: 8, corner: 20, items: [
    ['power', 0, 0, 2, 1], ['refresh', 2, 0, 2, 1], ['cpuUsage', 4, 0, 2, 1], ['touch', 6, 0, 2, 1],
    ['batteryTemp', 0, 1, 2, 1], ['skinTemp', 2, 1, 2, 1], ['cpuTemp', 4, 1, 2, 1], ['gpuTemp', 6, 1, 2, 1],
    ['cpuHistory', 0, 2, 4, 4], ['memory', 4, 2, 4, 1],
    ['fps', 4, 3, 2, 1], ['charge', 6, 3, 2, 1],
    ['thermalGraph', 4, 4, 4, 1],
    ['powerHistory', 4, 5, 4, 1]
  ] };
  const cellWOf = layout => layout.cell;
  const cellHOf = layout => layout.cellH || layout.cell;
  // 演示场景：充电中（plugged）——功率曲线/边框用 charging 色，拔出时端侧切 discharge 色
  const plugged = true;
  const chinese = document.documentElement.lang.toLowerCase().startsWith('zh');
  // bootTime 数值跟 OverlayLanguage 走（OverlayBootTime.kt）：zh「X天X时X分」/ en「Xd Xh Xm」
  const bootTimeReading = chinese ? '2天7时36分' : '2d 7h 36m';
  const readings = {
    power: '35.8 W', batteryTemp: '34.9℃', voltage: '4.28 V', current: '2.14 A',
    cpuTemp: '42.6℃', gpuTemp: '39.8℃', thermalStatus: 'NONE', capacity: '4120/5000mAh',
    memory: '5.8/12.0 GiB 48%', storage: '58% · 203.7GiB free', refresh: '120Hz',
    cpuUsage: '37%', fps: '119.9 FPS', npuTemp: '46.3℃', skinTemp: '35.1℃',
    brightness: '64%', freqLimit: '100%', bootTime: bootTimeReading
  };
  // 1 分钟窗口（60 个每秒采样）共用的确定性伪随机源
  const seededRandom = (() => {
    let seed = 20261023;
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  })();
  // 功率曲线：1 分钟快充片段——慢涌动主波 + 副波 + 轻抖动，两次圆滑跌落（余弦包络，无针状毛刺）。
  const powerSamples = (() => {
    const random = seededRandom;
    const phase = random() * Math.PI * 2;
    // 余弦包络事件：中心/半宽(采样数)/深度
    const bump = (i, center, width, depth) => {
      const x = (i - center) / width;
      return Math.abs(x) <= 1 ? depth * 0.5 * (1 + Math.cos(Math.PI * x)) : 0;
    };
    const samples = [];
    for (let i = 0; i < 60; i++) {
      const t = i / 59;
      const swell = Math.sin(t * Math.PI * 2 * 2.7 + phase) * 3.2 +
        Math.sin(t * Math.PI * 2 * 7.3 + phase * 2) * 1.6;
      const value = 32.5 + swell + (random() - 0.5) * 1.2 -
        bump(i, 14, 3.5, 8.5) - bump(i, 41, 2.5, 6);
      samples.push(Math.max(20, value));
    }
    return samples;
  })();
  const thermalThresholds = [
    { status: 1, value: 0.24 }, { status: 2, value: 0.42 }, { status: 3, value: 0.62 },
    { status: 4, value: 0.82 }, { status: 5, value: 1.05 }, { status: 6, value: 1.3 }
  ];
  const thermalHeadroom = 0.18;
  const cpuRows = [
    ['C0', '1800', '2800', 0], ['C1', '1650', '2800', 0],
    ['C2', '1400', '2800', 0], ['C3', '1200', '2800', 0],
    ['C4', '1000', '2400', 1], ['C5', '900', '2400', 1],
    ['C6', '700', '1800', 2], ['C7', '600', '1800', 2]
  ];
  // CPU 占用图：8 核双簇（policy0×6 + policy6×2），八格默认打包 → 每簇列数 3/2。
  const cpuCores = [
    { id: 'C0', cluster: 0 }, { id: 'C1', cluster: 0 }, { id: 'C2', cluster: 0 },
    { id: 'C3', cluster: 0 }, { id: 'C4', cluster: 0 }, { id: 'C5', cluster: 0 },
    { id: 'C6', cluster: 1 }, { id: 'C7', cluster: 1 }
  ];
  // CPU 占用：原始逐秒采样观感——有界随机游走 + 均值回归：锯齿噪声保留，但单步变化有界、无陡峭预设尖峰。
  const cpuHistorySamples = (() => {
    const random = seededRandom;
    const samples = {};
    cpuCores.forEach((core, index) => {
      // 每核活动带：小核低、大核高，游走被夹在带内（落差拉大一点）
      const low = core.cluster === 0 ? 2 + (index * 7) % 8 : 6 + (index - 6) * 8;
      const high = core.cluster === 0 ? 30 + (index % 3) * 12 : 58 + (index - 6) * 18;
      const anchor = (low + high) / 2;
      const points = [];
      let value = anchor;
      for (let i = 0; i < 60; i++) {
        value += (anchor - value) * 0.12 + (random() - 0.5) * 11;
        value = Math.max(low, Math.min(high, value));
        points.push(value);
      }
      samples[core.id] = points;
    });
    return samples;
  })();
  const minimumSize = {
    power: [2, 1], current: [2, 1], voltage: [2, 1], batteryTemp: [2, 1], cpuTemp: [2, 1],
    gpuTemp: [2, 1], skinTemp: [2, 1], npuTemp: [2, 1], charge: [2, 1], refresh: [2, 1],
    cpuUsage: [2, 1], fps: [2, 1], brightness: [2, 1], freqLimit: [2, 1],
    capacity: [4, 1], memory: [4, 1], bootTime: [4, 1], powerHistory: [2, 1],
    thermalGraph: [4, 1], thermalStatus: [4, 1], storage: [6, 1], cpuHistory: [4, 4],
    cpuFrequency: [8, 2], close: [1, 1], touch: [1, 1]
  };
  const titles = {
    power: 'POWER', batteryTemp: 'BATTERY TEMP', voltage: 'VOLTAGE', current: 'CURRENT',
    thermalGraph: 'HEADROOM', cpuTemp: 'CPU TEMP', thermalStatus: 'THERMAL STATE',
    gpuTemp: 'GPU TEMP', capacity: 'CHARGE', memory: 'MEMORY USAGE', cpuFrequency: 'CPU FREQUENCY',
    storage: 'STORAGE USAGE', refresh: 'REFRESH', cpuUsage: 'CPU USAGE',
    cpuHistory: 'CPU USAGE PLOT', fps: 'APP FPS', npuTemp: 'NPU TEMP', skinTemp: 'SURFACE TEMP',
    brightness: 'BRIGHTNESS', freqLimit: 'CPU LIMIT', bootTime: 'BOOT TIME'
  };
  // 端侧 OverlayMorph：durationMs=440 + PathInterpolator(0.62, 0, 0.38, 1)，fadeSpan=160ms。
  // 注意 OverlayAppearanceMotion 的 420ms/(.22,0,.18,1) 只用于主题/透明度动画，morph 勿混用。
  const durationMs = 440;
  const fadeSpan = 160 / durationMs;
  const stageWidth = (full.columns * full.cell + full.padding * 2) * unit;
  const stageHeight = (full.rows * cellHOf(full) + full.padding * 2) * unit;
  let density = 'full';
  let transition = null;
  let animationFrame = 0;
  let lastDisplay = null;
  const textMetricCache = new Map();
  const reservedWidthCache = new Map();
  const layoutItemCache = new WeakMap();
  const layoutTransitionCache = new WeakMap();
  const stillFrameCache = new WeakMap();
  const stillStyleCache = new WeakMap();
  const digitWidthCache = new Map();
  const cpuHistoryPathCache = new Map();

  function measureText(value) {
    const key = `${ctx.font}\u0000${value}`;
    let metrics = textMetricCache.get(key);
    if (!metrics) {
      metrics = ctx.measureText(value);
      if (textMetricCache.size >= 4096) textMetricCache.delete(textMetricCache.keys().next().value);
      textMetricCache.set(key, metrics);
    }
    return metrics;
  }

  function font(size, weight = 400) { return `${weight} ${size}px "Overlay Inter", Inter, sans-serif`; }
  function textMetrics(value) {
    const m = measureText(value);
    return { width: m.width, ascent: m.actualBoundingBoxAscent || m.fontBoundingBoxAscent || ctx.fontSize,
      descent: m.actualBoundingBoxDescent || m.fontBoundingBoxDescent || ctx.fontSize * 0.22 };
  }
  function baselineAt(center, metrics) { return center + (metrics.ascent - metrics.descent) / 2; }
  function g2Path(x, y, width, height, radius) {
    const r = Math.min(radius * 1.22, width / 2, height / 2);
    const exponent = 2 / 2.8;
    const component = value => Math.max(0, value) ** exponent;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    for (let i = 0; i <= 16; i++) {
      const t = Math.PI / 2 - Math.PI / 2 * i / 16;
      ctx.lineTo(x + width - r + r * component(Math.cos(t)), y + r - r * component(Math.sin(t)));
    }
    ctx.lineTo(x + width, y + height - r);
    for (let i = 0; i <= 16; i++) {
      const t = Math.PI / 2 * i / 16;
      ctx.lineTo(x + width - r + r * component(Math.cos(t)), y + height - r + r * component(Math.sin(t)));
    }
    ctx.lineTo(x + r, y + height);
    for (let i = 0; i <= 16; i++) {
      const t = Math.PI / 2 - Math.PI / 2 * i / 16;
      ctx.lineTo(x + r - r * component(Math.cos(t)), y + height - r + r * component(Math.sin(t)));
    }
    ctx.lineTo(x, y + r);
    for (let i = 0; i <= 16; i++) {
      const t = Math.PI / 2 * i / 16;
      ctx.lineTo(x + r - r * component(Math.cos(t)), y + r - r * component(Math.sin(t)));
    }
    ctx.closePath();
  }
  function drawText(value, x, centerY, size, weight, fill) {
    ctx.font = font(size, weight);
    ctx.textAlign = 'left';
    const metrics = textMetrics(value);
    ctx.fillStyle = fill;
    ctx.fillText(value, x, baselineAt(centerY, metrics));
  }
  function drawBaselineText(value, x, baseline, size, weight, fill) {
    ctx.font = font(size, weight);
    ctx.textAlign = 'left';
    ctx.fillStyle = fill;
    ctx.fillText(value, x, baseline);
  }
  function drawFontCenteredText(value, x, centerY, size, weight, fill) {
    ctx.font = font(size, weight);
    ctx.textAlign = 'left';
    const metrics = measureText(value);
    const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || size * 0.72;
    const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || size * 0.18;
    ctx.fillStyle = fill;
    ctx.fillText(value, x, centerY + (ascent - descent) / 2);
  }
  // 端侧 OverlayMorph：durationMs=440 + PathInterpolator(0.62, 0, 0.38, 1)——morph 专用曲线；
  // OverlayAppearanceMotion 的 420ms/(.22,0,.18,1) 只用于主题与透明度动画，勿混用。
  function easing(progress) {
    const x = Math.max(0, Math.min(1, progress));
    const cubic = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 18; i++) {
      const middle = (low + high) / 2;
      if (cubic(middle, 0.62, 0.38) < x) low = middle; else high = middle;
    }
    return cubic((low + high) / 2, 0, 1);
  }
  function smooth(progress) { return progress * progress * (3 - 2 * progress); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function itemMap(layout) {
    if (layoutItemCache.has(layout)) return layoutItemCache.get(layout);
    const cw = cellWOf(layout);
    const ch = cellHOf(layout);
    const items = new Map(layout.items.map(item => {
      const [name, column, row, columns, rows] = item;
      return [name, {
        name,
        rect: {
          left: (layout.padding + column * cw) * unit,
          top: (layout.padding + row * ch) * unit,
          right: (layout.padding + (column + columns) * cw) * unit,
          bottom: (layout.padding + (row + rows) * ch) * unit,
          width: columns * cw * unit,
          height: rows * ch * unit
        },
        cellDp: cw,
        cellHdp: ch,
        titleAlpha: layout === full && !['close', 'touch', 'charge', 'powerHistory'].includes(name) ? 1 : 0,
        alpha: 1
      }];
    }));
    layoutItemCache.set(layout, items);
    return items;
  }
  function layoutSpan(layout, axis) {
    const cell = axis === 'width' ? cellWOf(layout) : cellHOf(layout);
    return layout[axis === 'width' ? 'columns' : 'rows'] * cell + 2 * layout.padding;
  }
  function fadeWindows(fromLayout, toLayout) {
    let targets = layoutTransitionCache.get(fromLayout);
    if (!targets) {
      targets = new WeakMap();
      layoutTransitionCache.set(fromLayout, targets);
    }
    if (targets.has(toLayout)) return targets.get(toLayout);
    const fromItems = itemMap(fromLayout);
    const toItems = itemMap(toLayout);
    const outgoing = [...fromItems.keys()].filter(name => !toItems.has(name));
    const incoming = [...toItems.keys()].filter(name => !fromItems.has(name));
    const interpolator = easing;
    const straightDeadlines = new Map(outgoing.map(name => {
      const item = fromItems.get(name);
      const destination = toItems.get(name);
      let deadline = null;
      for (let sample = 1; sample <= 128; sample++) {
        const t = sample / 128;
        const eased = interpolator(t);
        const width = lerp(layoutSpan(fromLayout, 'width'), layoutSpan(toLayout, 'width'), eased) * unit;
        const height = lerp(layoutSpan(fromLayout, 'height'), layoutSpan(toLayout, 'height'), eased) * unit;
        const rect = destination ? interpolateRect(item.rect, destination.rect, eased) : item.rect;
        const inset = 2 * unit;
        const clearance = Math.min(rect.left + inset, rect.top + inset,
          width - rect.right + inset, height - rect.bottom + inset);
        if (clearance <= unit * 0.5 + 1) { deadline = t; break; }
      }
      return [name, deadline];
    }));
    const noContact = outgoing.filter(name => straightDeadlines.get(name) == null)
      .sort((a, b) => {
        const edge = name => {
          const r = fromItems.get(name).rect;
          return Math.min(r.left, r.top,
            layoutSpan(fromLayout, 'width') * unit - r.right,
            layoutSpan(fromLayout, 'height') * unit - r.bottom);
        };
        return edge(a) - edge(b);
      });
    const windows = new Map();
    outgoing.forEach(name => {
      const contact = straightDeadlines.get(name);
      const ordered = contact == null ? 0.54 + 0.36 * (noContact.indexOf(name) + 1) / Math.max(1, noContact.length) : contact;
      const end = Math.max(ordered, fadeSpan);
      windows.set(name, [Math.max(0, end - fadeSpan), Math.min(1, end)]);
    });
    incoming.forEach((name, index) => {
      const start = 0.48 + 0.18 * index / Math.max(1, incoming.length);
      windows.set(name, [start, Math.min(1, start + fadeSpan)]);
    });
    const result = { fromItems, toItems, outgoing, incoming, windows,
      names: [...new Set([...fromItems.keys(), ...toItems.keys()])] };
    targets.set(toLayout, result);
    return result;
  }
  function interpolateRect(a, b, t) {
    const left = lerp(a.left, b.left, t);
    const top = lerp(a.top, b.top, t);
    const right = lerp(a.right, b.right, t);
    const bottom = lerp(a.bottom, b.bottom, t);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }
  function frameAt(state, progress) {
    const linear = Math.max(0, Math.min(1, progress));
    const t = easing(linear);
    const { fromLayout, toLayout, fromItems, toItems, outgoing, incoming, windows } = state;
    const width = lerp(layoutSpan(fromLayout, 'width'), layoutSpan(toLayout, 'width'), t) * unit;
    const height = lerp(layoutSpan(fromLayout, 'height'), layoutSpan(toLayout, 'height'), t) * unit;
    const names = state.names;
    // 端侧 OverlayMorph.frame：双端组件按几何插值；单端组件钉端点 rect，
    // alpha 走 fadeWindows 排程（outgoing 1-smooth / incoming smooth）
    const items = [...names].map(name => {
      const from = fromItems.get(name);
      const to = toItems.get(name);
      const start = from || to;
      const end = to || from;
      const rect = from && to ? interpolateRect(from.rect, to.rect, t) : start.rect;
      const cellDp = from && to ? lerp(from.cellDp, to.cellDp, t) : start.cellDp;
      const cellHdp = from && to ? lerp(from.cellHdp, to.cellHdp, t) : start.cellHdp;
      const titleAlpha = lerp(from?.titleAlpha || 0, to?.titleAlpha || 0, t);
      let alpha = from && to ? 1 : 0;
      if (outgoing.includes(name)) {
        const [begin, finish] = windows.get(name);
        alpha = 1 - smooth(Math.max(0, Math.min(1, (linear - begin) / Math.max(0.001, finish - begin))));
      } else if (incoming.includes(name)) {
        const [begin, finish] = windows.get(name);
        alpha = smooth(Math.max(0, Math.min(1, (linear - begin) / Math.max(0.001, finish - begin))));
      }
      return { name, rect, cellDp, cellHdp, titleAlpha, alpha };
    });
    return { width, height, corner: lerp(fromLayout.corner, toLayout.corner, t) * unit,
      compactFraction: lerp(fromLayout === compact ? 1 : 0, toLayout === compact ? 1 : 0, t), items };
  }
  function drawPowerHistory(rect) {
    const values = powerSamples.filter(Number.isFinite);
    if (values.length < 2) {
      drawText('--', (rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2, rect.height * 0.42, 400, color.label);
      return;
    }
    const visible = values.slice(-60);
    // 自适应纵向缩放：以数据区间居中铺满绘图区，波动清晰可见（而非从零线压成平线）
    const low = Math.min(...visible);
    const high = Math.max(...visible);
    const mid = (low + high) / 2;
    const half = Math.max(1, (high - low) / 2 * 1.18);
    ctx.beginPath();
    visible.forEach((sample, index) => {
      const age = visible.length - 1 - index;
      const x = rect.right - rect.width * age / 59;
      const y = (rect.top + rect.bottom) / 2 - rect.height * 0.45 * (sample - mid) / half;
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = plugged ? color.charging : color.discharge;
    ctx.lineWidth = 2 * unit;
    ctx.stroke();
  }
  function textWidth(value, weight = 400, size = 100) {
    ctx.font = font(size, weight);
    return measureText(value).width;
  }
  function glyphBox(value, weight = 400, size = 100) {
    ctx.font = font(size, weight);
    const metrics = measureText(value);
    return {
      left: -(metrics.actualBoundingBoxLeft || 0),
      top: -(metrics.actualBoundingBoxAscent || size * 0.72),
      right: metrics.actualBoundingBoxRight || metrics.width,
      bottom: metrics.actualBoundingBoxDescent || size * 0.18
    };
  }
  function reservedWidth(value, weight = 700) {
    const key = `${weight}:${value}`;
    if (reservedWidthCache.has(key)) return reservedWidthCache.get(key);
    if (!digitWidthCache.has(weight)) {
      digitWidthCache.set(weight, Math.max(...Array.from('0123456789', n => textWidth(n, weight))));
    }
    const digit = digitWidthCache.get(weight);
    let width = 0;
    let cursor = 0;
    for (const match of value.matchAll(/[0-9]+/g)) {
      width += textWidth(value.slice(cursor, match.index), weight);
      width += match[0] === '100' ? textWidth(match[0], weight) : Math.max(textWidth(match[0], weight), digit * match[0].length);
      cursor = match.index + match[0].length;
    }
    width += textWidth(value.slice(cursor), weight);
    const result = Math.max(width, textWidth(value, weight));
    reservedWidthCache.set(key, result);
    return result;
  }
  function fixedSize(value, width, height, maximum, weight) {
    const text = textWidth(value, weight);
    const box = glyphBox(value, weight);
    return Math.min(maximum, width / Math.max(text / 100, 0.1), height / Math.max((box.bottom - box.top) / 100, 0.1));
  }
  // 端侧 fittedTextSize：实际读数在绘制时按真实宽度再收缩一次（模板只决定上限），只缩不放
  function fittedTextSize(texts, width, height, maximum, extraWidth = 0) {
    if (!texts.length) return maximum;
    const textWidth = Math.max(...texts.map(value => reservedWidth(value, 700))) / 100;
    const textHeight = Math.max(...texts.map(value => {
      const box = glyphBox(value, 700);
      return box.bottom - box.top;
    })) / 100;
    const scale = Math.min(1,
      Math.max(0.1, width - extraWidth) * 100 / Math.max(0.1, textWidth),
      Math.max(0.1, height) * 100 / Math.max(0.1, textHeight));
    return maximum * scale;
  }
  function valueTemplate(name) {
    return ({ power: '999.9 W', batteryTemp: '-99.9℃', voltage: '99.99 V', current: '-99.99 A',
      cpuTemp: '-99.9℃', gpuTemp: '-99.9℃', capacity: '99999/99999mAh', memory: '99.9/99.9 GiB 99%',
      thermalStatus: 'EMERGENCY', charge: '100%', storage: '100% · 999.9GiB free',
      refresh: '999Hz', brightness: '100%', freqLimit: '100%',
      // 端侧 template() 的 BOOT_TIME 分支：formatOverlayBootTime(9999天23时59分, language) 跟语言走
      bootTime: chinese ? '9999天23时59分' : '9999d 23h 59m',
      cpuUsage: '100%', fps: '999.9 FPS', npuTemp: '-99.9℃', skinTemp: '-99.9℃' })[name]
      || readings[name] || '--';
  }
  function compactFractionOf(item) {
    return Math.max(0, Math.min(1, (32 - item.cellHdp) / 20));
  }
  function resolveStyle(item) {
    const [minColumns, minRows] = minimumSize[item.name];
    const cellDp = item.cellDp;
    const cellHdp = item.cellHdp;
    const itemUnit = unit;
    const width = Math.max(1, item.rect.width - insetFor(item) * 2);
    const height = Math.max(1, item.rect.height - insetFor(item) * 2);
    const factor = Math.max(0.1, Math.min(item.rect.width / (minColumns * cellDp * itemUnit),
      item.rect.height / (minRows * cellHdp * itemUnit)));
    // 端侧 referenceMax：以最小电池温度槽位（2×1 格）实测 '-99.9℃' 的上限，统一约束标题与数值
    const referenceMax = fixedSize('-99.9℃',
      Math.max(0.1, cellDp * 2 * itemUnit - insetFor(item) * 2),
      Math.max(0.1, cellHdp * itemUnit - insetFor(item) * 2), 13 * itemUnit, 700);
    const titleHeight = Math.min(height * 0.3, (item.name === 'cpuFrequency' ? 10 : 11) * itemUnit * factor);
    const titleSize = fixedSize(titles[item.name] || '', width, titleHeight,
      Math.min(9 * itemUnit * factor, referenceMax), 400);
    const titleGap = item.name === 'cpuFrequency' ? 4 * itemUnit : 2 * itemUnit;
    const bodyHeight = Math.max(1, height - (titleHeight + titleGap) * item.titleAlpha);
    const fieldGap = item.name === 'capacity' ? 5 * itemUnit : item.name === 'memory' ? 8 * itemUnit : 0;
    const template = valueTemplate(item.name);
    const geometryOnly = ['powerHistory', 'thermalGraph', 'cpuHistory', 'close', 'touch'].includes(item.name);
    const specializedValue = item.name === 'cpuFrequency' || item.name === 'charge';
    let valueSize = geometryOnly || specializedValue ? 0 : Math.min(fixedSize(template, width, bodyHeight,
      (item.name === 'power' ? 18 * itemUnit : 13 * itemUnit * factor), 700),
    Math.max(0.1, width - fieldGap) / Math.max(reservedWidth(template, 700) / 100, 0.1),
    referenceMax);
    const glyph = geometryOnly || specializedValue ? { top: 0, bottom: 0 } : glyphBox(['power', 'current', 'voltage', 'batteryTemp', 'cpuTemp', 'gpuTemp', 'capacity', 'memory'].includes(item.name)
      ? '0123456789' : template, 700, valueSize);
    const style = { titleHeight, titleSize, titleGap, valueSize, glyphTop: glyph.top, glyphBottom: glyph.bottom,
      fields: [], cpuSlots: [], iconSize: 0, iconGap: 0, percentWidth: 0 };
    if (geometryOnly) return style;
    if (item.name === 'charge') {
      // 展开/收起两套尺寸按 compactFraction 连续混合；若按分支二值切换，过渡末帧会突跳。
      const blend = smooth(compactFractionOf(item));
      const reserved = textWidth('100%', 700, 10 * itemUnit * factor);
      const fit = Math.min(1, height / (24 * itemUnit * factor), width / (27 * itemUnit * factor + reserved));
      const effective = itemUnit * factor * fit;
      const iconSize = Math.min(12 * itemUnit * factor, item.rect.height);
      const limit = Math.max(1, width - iconSize - itemUnit);
      const compactSize = fixedSize('100%', limit, height, Math.min(9 * itemUnit * factor, referenceMax), 700);
      style.valueSize = lerp(Math.min(10 * effective, referenceMax), compactSize, blend);
      style.iconSize = lerp(24 * effective, iconSize, blend);
      style.iconGap = lerp(3 * effective, itemUnit, blend);
      style.percentWidth = textWidth('100%', 700, style.valueSize);
    }
    if (item.name === 'cpuFrequency') {
      const longestId = 'C7';
      const cpuTemplate = `${longestId}9999/9999MHz`;
      const numberWidth = Math.max(reservedWidth('9999', 400), textWidth('----', 400)) / 100;
      const textWidth100 = (textWidth(longestId, 400) + textWidth('/', 400) + textWidth('MHz', 400)) / 100 + numberWidth * 2;
      const textHeight = (glyphBox(cpuTemplate, 400).bottom - glyphBox(cpuTemplate, 400).top) / 100;
      const rows = Math.ceil(cpuRows.length / 2);
      const gap = 12 * itemUnit;
      const rowGap = 2.5 * itemUnit;
      valueSize = Math.max(0.1, Math.min(13 * itemUnit * factor, ((width - gap) / 2 - 9 * itemUnit) / textWidth100,
        (bodyHeight - rowGap * (rows - 1)) / rows / textHeight, referenceMax));
      const cpuGlyph = glyphBox(cpuTemplate, 400, valueSize);
      style.valueSize = valueSize;
      style.glyphTop = cpuGlyph.top;
      style.glyphBottom = cpuGlyph.bottom;
      const line = cpuGlyph.bottom - cpuGlyph.top;
      style.cpuLineHeight = line;
      const top = item.titleAlpha > 0 ? 0 : (bodyHeight - rows * line - (rows - 1) * rowGap) / 2;
      const columnWidth = (width - gap) / 2;
      style.cpuSlots = cpuRows.map((_, index) => {
        const x = (index % 2) * (columnWidth + gap);
        const y = top + Math.floor(index / 2) * (line + rowGap);
        return { left: x, top: y, right: x + columnWidth, bottom: y + line };
      });
      const coreWidth = textWidth(longestId, 400, valueSize) + 4 * itemUnit;
      const number = numberWidth * valueSize;
      const slash = textWidth('/', 400, valueSize);
      style.fields = [0, coreWidth, coreWidth + number + 1.5 * itemUnit,
        coreWidth + number + slash + 3 * itemUnit, coreWidth + number * 2 + slash + 5 * itemUnit];
    }
    if (item.name === 'memory') style.fields = [1, 1, 3, 3].map(value => value * itemUnit);
    if (item.name === 'capacity') style.fields = [1, 1, 3].map(value => value * itemUnit);
    return style;
  }
  function insetFor(item) { return lerp(2, 1, Math.max(0, Math.min(1, (32 - item.cellDp) / 12))) * unit; }
  function thermalColor(status) {
    return color.thermal[Math.max(0, Math.min(4, status))];
  }
  function thermalPositions(thresholds, scaleMax, width, minimumSpacing) {
    const sorted = [...new Set(thresholds.filter(value => Number.isFinite(value) && value >= 0 && value <= scaleMax))].sort((a, b) => a - b);
    const knots = [0, ...sorted.filter(value => value > 0)];
    if (scaleMax > knots.at(-1)) knots.push(scaleMax);
    const minimum = knots.slice(0, -1).map((value, index) => sorted.includes(value) && sorted.includes(knots[index + 1]) ? minimumSpacing : 0);
    const requested = minimum.reduce((sum, value) => sum + value, 0);
    if (requested > width && requested > 0) minimum.forEach((_, index) => { minimum[index] *= width / requested; });
    const remaining = Math.max(0, width - minimum.reduce((sum, value) => sum + value, 0));
    const raw = knots.slice(0, -1).map((value, index) => knots[index + 1] - value);
    const total = raw.reduce((sum, value) => sum + value, 0) || 1;
    const positions = [0];
    raw.forEach((span, index) => positions.push(positions.at(-1) + minimum[index] + remaining * span / total));
    positions[positions.length - 1] = width;
    return value => {
      const clamped = Math.max(knots[0], Math.min(knots.at(-1), value));
      const upper = knots.findIndex(knot => knot >= clamped);
      if (upper <= 0) return positions[0];
      const lower = upper - 1;
      const span = knots[upper] - knots[lower];
      return span <= 0 ? positions[upper] : positions[lower] + (positions[upper] - positions[lower]) * (clamped - knots[lower]) / span;
    };
  }
  function drawThermal(rect, titleFraction, compactFraction) {
    const thresholds = thermalThresholds.filter(item => item.status >= 1 && item.status <= 6).sort((a, b) => a.value - b.value);
    const max = Math.max(1, ...thresholds.map(item => item.value)) * 1.1;
    const trackHeight = (4.5 + 1.5 * (1 - titleFraction)) * unit * (1 - 0.12 * compactFraction);
    const markers = ['L', 'M', 'S', 'C', 'E', 'X'];
    const markerHeight = Math.max(...markers.map(marker => glyphBox(marker, 400).bottom - glyphBox(marker, 400).top)) / 100;
    const targetLabelHeight = (6.5 + 2.5 * (1 - titleFraction)) * unit;
    const markerSize = Math.min(targetLabelHeight / Math.max(0.01, markerHeight),
      rect.width / 12 / Math.max(0.01, ...markers.map(marker => textWidth(marker, 400) / 100)),
      rect.height * 0.5 / Math.max(0.01, markerHeight));
    ctx.font = font(markerSize, 400);
    const labelWidth = Math.max(...markers.map(marker => measureText(marker).width));
    const positionOf = thermalPositions(thresholds.map(item => item.value), max, rect.width, labelWidth + 2 * unit);
    const markerBoxes = markers.map(marker => glyphBox(marker, 400, markerSize));
    const labelBottom = Math.max(...markerBoxes.map(box => box.bottom));
    const labelBaseline = rect.bottom - unit * 0.5 - labelBottom;
    const labelTop = labelBaseline + Math.min(...markerBoxes.map(box => box.top));
    const labeledTop = labelTop - 3 * unit - trackHeight;
    const centeredTop = rect.top + rect.height / 2 - trackHeight / 2;
    const top = lerp(labeledTop, centeredTop, compactFraction);
    ctx.fillStyle = '#283c4e';
    ctx.beginPath(); ctx.roundRect(rect.left, top, rect.width, trackHeight, trackHeight / 2); ctx.fill();
    const status = thermalThresholds.filter(item => thermalHeadroom >= item.value).sort((a, b) => a.value - b.value).at(-1)?.status || 0;
    ctx.fillStyle = thermalColor(status);
    ctx.beginPath(); ctx.roundRect(rect.left, top, rect.width * Math.max(0, Math.min(1, thermalHeadroom / max)), trackHeight, trackHeight / 2); ctx.fill();
    thresholds.forEach(({ status: markerStatus, value }) => {
      const x = rect.left + positionOf(value);
      ctx.fillStyle = thermalColor(markerStatus);
      ctx.fillRect(x - unit / 2, top - unit, unit, trackHeight + 2 * unit);
      if (compactFraction < 1 && labelTop >= top + trackHeight + unit * 0.5) {
        ctx.save(); ctx.globalAlpha *= 1 - compactFraction;
        ctx.font = font(markerSize, 400); ctx.textAlign = 'center'; ctx.fillStyle = thermalColor(markerStatus);
        ctx.fillText(markers[markerStatus - 1], x, labelBaseline); ctx.restore();
      }
    });
  }
  function drawCharge(rect, style) {
    const level = 78;
    const percent = `${level}%`;
    const size = style.iconSize;
    const visibleLeft = size * 2.4 / 24;
    const visibleWidth = size * 19.2 / 24;
    const visibleTop = size * 5.6 / 24;
    const visibleBottom = size * 19.2 / 24;
    const groupWidth = visibleWidth + style.iconGap + style.percentWidth;
    const left = rect.left + rect.width / 2 - groupWidth / 2;
    const top = rect.top + rect.height / 2 - (visibleTop + visibleBottom) / 2;
    // 端侧 batteryLevelColor：0-14 critical / 15-29 batteryOrange / 30-59 warm / 其余 charging
    const levelColor = level <= 14 ? color.hot : level <= 29 ? color.batteryOrange :
      level <= 59 ? color.warm : color.charging;
    ctx.save();
    ctx.translate(left - visibleLeft, top);
    ctx.scale(size / 24, size / 24);
    ctx.beginPath(); ctx.moveTo(18.4, 16.8); ctx.bezierCurveTo(19.28, 16.8, 20, 16.08, 20, 15.2);
    ctx.lineTo(20, 7.2); ctx.bezierCurveTo(20, 6.32, 19.28, 5.6, 18.4, 5.6);
    ctx.lineTo(5.6, 5.6); ctx.bezierCurveTo(4.72, 5.6, 4, 6.32, 4, 7.2);
    ctx.lineTo(4, 15.2); ctx.bezierCurveTo(4, 16.08, 4.72, 16.8, 5.6, 16.8);
    ctx.lineTo(2.4, 16.8); ctx.lineTo(2.4, 18.4); ctx.lineTo(21.6, 18.4);
    ctx.lineTo(21.6, 16.8); ctx.lineTo(18.4, 16.8); ctx.closePath();
    ctx.moveTo(5.6, 7.2); ctx.lineTo(18.4, 7.2); ctx.lineTo(18.4, 15.2);
    ctx.lineTo(5.6, 15.2); ctx.closePath();
    ctx.moveTo(2.4, 18.4); ctx.lineTo(21.6, 18.4); ctx.lineTo(21.6, 20);
    ctx.lineTo(2.4, 20); ctx.closePath();
    ctx.fillStyle = levelColor; ctx.fill('evenodd');
    ctx.restore();
    ctx.font = font(style.valueSize, 700); ctx.textAlign = 'left'; ctx.fillStyle = levelColor;
    drawText(percent, left + visibleWidth + style.iconGap,
      rect.top + rect.height / 2, style.valueSize, 700, levelColor);
  }
  function drawAction(rect, kind) {
    const size = Math.min(rect.right - rect.left, rect.bottom - rect.top) * 0.5;
    const x = (rect.left + rect.right) / 2;
    const y = (rect.top + rect.bottom) / 2;
    ctx.strokeStyle = color.text;
    ctx.lineWidth = Math.max(1, 1.7 * unit);
    ctx.lineCap = 'round';
    if (kind === 'close') {
      const d = size * 0.275;
      ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
      ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x, y, size * 0.39, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function drawCpu(rect, style) {
    // 端侧 textScale：任一行超宽或行高超高，则整体等比缩小
    let textScale = 1;
    cpuRows.forEach((row, index) => {
      const slot = style.cpuSlots[index];
      if (!slot) return;
      const lineEnd = Math.max(...row.map((part, j) => (style.fields[j] || 0) + textWidth(part, 400, style.valueSize)));
      textScale = Math.min(textScale,
        (slot.right - slot.left) / Math.max(0.1, lineEnd),
        rect.height / Math.max(0.1, style.cpuLineHeight || 1));
    });
    textScale = Math.max(0.1, Math.min(1, textScale));
    const drawSize = style.valueSize * textScale;
    cpuRows.forEach(([id, current, maximum, cluster], index) => {
      const slot = style.cpuSlots[index];
      if (!slot) return;
      const parts = [id, current, '/', maximum, 'MHz'];
      const baseline = rect.top + (slot.top + slot.bottom) / 2 -
        (style.glyphTop + style.glyphBottom) / 2 * textScale;
      parts.forEach((part, partIndex) => {
        const fill = clusterColors[cluster % 3];
        drawBaselineText(part, rect.left + slot.left + (style.fields[partIndex] || 0) * textScale,
          baseline, drawSize, 400, fill);
      });
    });
  }
  function cpuHistorySlots(rect) {
    // 与端侧一致：八格默认打包（buildCoreRows，可用宽 256dp → 每行至多 3 列）。
    const columnLimit = Math.max(1, Math.floor(256 / 76));
    const gridColumns = count => count === 1 ? 1 : count === 2 ? 2 : count === 4 ? 2 : count === 6 ? 3 : 4;
    const groups = [cpuCores.slice(0, 6), cpuCores.slice(6)];
    const rows = [];
    groups.forEach(group => {
      const columns = Math.min(gridColumns(group.length), columnLimit);
      for (let index = 0; index < group.length; index += columns) {
        rows.push({ cores: group.slice(index, index + columns), columns });
      }
    });
    const gap = Math.min(4 * unit, rect.height / (rows.length * 3));
    const height = (rect.height - gap * (rows.length - 1)) / rows.length;
    const slots = [];
    rows.forEach((row, rowIndex) => {
      const width = (rect.width - gap * (row.columns - 1)) / row.columns;
      row.cores.forEach((core, columnIndex) => {
        const left = rect.left + columnIndex * (width + gap);
        const top = rect.top + rowIndex * (height + gap);
        slots.push({ core, rect: { left, top, right: left + width, bottom: top + height } });
      });
    });
    return slots;
  }
  function drawCpuHistory(rect, compactFraction) {
    const slots = cpuHistorySlots(rect);
    if (!slots.length) return;
    const labelAlpha = 1 - compactFraction;
    const inset = Math.min(2 * unit, Math.min(...slots.map(slot => slot.rect.bottom - slot.rect.top)) / 8);
    let labelSize = 8 * unit;
    if (labelAlpha > 0) {
      labelSize = Math.min(...slots.map(({ rect: slot }) =>
        fixedSize('CPU0 100%', slot.right - slot.left - inset * 2, (slot.bottom - slot.top) * 0.4, 8 * unit, 400)));
    }
    slots.forEach(({ core, rect: slot }) => {
      const accent = clusterColors[core.cluster % 3];
      const width = slot.right - slot.left;
      const height = slot.bottom - slot.top;
      const baseAlpha = ctx.globalAlpha;
      ctx.save();
      ctx.beginPath(); ctx.rect(slot.left, slot.top, width, height); ctx.clip();
      // 背景填充
      ctx.fillStyle = accent; ctx.globalAlpha = baseAlpha * 9 / 255;
      ctx.fillRect(slot.left, slot.top, width, height);
      // 网格线
      ctx.strokeStyle = accent; ctx.lineWidth = 0.5 * unit; ctx.globalAlpha = baseAlpha * 45 / 255;
      ctx.beginPath();
      for (let i = 1; i <= 3; i++) {
        const y = slot.top + height * i / 4;
        ctx.moveTo(slot.left, y); ctx.lineTo(slot.right, y);
      }
      for (let i = 1; i <= 5; i++) {
        const x = slot.left + width * i / 6;
        ctx.moveTo(x, slot.top); ctx.lineTo(x, slot.bottom);
      }
      ctx.stroke();
      // 占用曲线：面积 + 描线（线、面分别构建，描线必须显式传路径）
      const samples = cpuHistorySamples[core.id] || [];
      if (samples.length >= 2) {
        let paths = cpuHistoryPathCache.get(core.id);
        if (!paths) {
          const line = new Path2D();
          const area = new Path2D();
          samples.forEach((sample, index) => {
            const x = index / (samples.length - 1);
            const y = 1 - sample / 100;
            if (index === 0) { line.moveTo(x, y); area.moveTo(x, y); }
            else { line.lineTo(x, y); area.lineTo(x, y); }
          });
          area.lineTo(1, 1);
          area.lineTo(0, 1);
          area.closePath();
          paths = { line, area };
          cpuHistoryPathCache.set(core.id, paths);
        }
        const transform = new DOMMatrix([width, 0, 0, height, slot.left, slot.top]);
        const line = new Path2D();
        const area = new Path2D();
        line.addPath(paths.line, transform);
        area.addPath(paths.area, transform);
        ctx.lineCap = 'butt';
        ctx.fillStyle = accent; ctx.globalAlpha = baseAlpha * 34 / 255;
        ctx.fill(area);
        ctx.strokeStyle = accent; ctx.globalAlpha = baseAlpha; ctx.lineWidth = unit;
        ctx.stroke(line);
      }
      // 边框
      ctx.globalAlpha = baseAlpha * 100 / 255; ctx.lineWidth = 0.5 * unit;
      ctx.strokeRect(slot.left + 0.25 * unit, slot.top + 0.25 * unit, width - 0.5 * unit, height - 0.5 * unit);
      // 标签：透明度跟随展开/收起过渡连续淡入淡出
      if (labelAlpha > 0) {
        const usage = Math.round(samples.at(-1) || 0);
        ctx.globalAlpha = baseAlpha * labelAlpha;
        ctx.font = font(labelSize, 400);
        ctx.textAlign = 'left';
        ctx.fillStyle = accent;
        const metrics = measureText(`CPU${core.id.slice(1)} `);
        const ascent = metrics.fontBoundingBoxAscent || labelSize * 0.72;
        const baseline = slot.top + inset + ascent;
        ctx.fillText(`CPU${core.id.slice(1)} `, slot.left + inset, baseline);
        ctx.fillText(`${usage}%`, slot.left + inset + metrics.width, baseline);
      }
      ctx.restore();
    });
  }
  const alignedItemNames = new Set(['power', 'current', 'voltage', 'batteryTemp', 'cpuTemp', 'gpuTemp']);
  const alignmentKey = item => [item.rect.top, item.rect.bottom, item.titleAlpha, item.cellDp].map(value => Number(value).toFixed(3)).join(':');
  function itemStyles(items) {
    const styles = new Map(items.map(item => [item.name, resolveStyle(item)]));
    const rows = new Map();
    items.filter(item => alignedItemNames.has(item.name)).forEach(item => {
      const key = alignmentKey(item);
      rows.set(key, [...(rows.get(key) || []), item]);
    });
    rows.forEach(row => {
      const size = Math.min(...row.map(item => styles.get(item.name).valueSize));
      const digits = glyphBox('0123456789', 700, size);
      row.forEach(item => Object.assign(styles.get(item.name), { valueSize: size, glyphTop: digits.top, glyphBottom: digits.bottom }));
    });
    return styles;
  }
  function drawItem(item, frame, style) {
    const { name, rect, alpha, titleAlpha } = item;
    const inset = insetFor(item);
    // 端侧：充电组件收起时无纵向内缩（verticalInset = inset × (1 − compactCharge)）
    const verticalInset = inset * (1 - (name === 'charge' ? compactFractionOf(item) : 0));
    const bounds = { left: rect.left + inset, top: rect.top + verticalInset,
      right: rect.right - inset, bottom: rect.bottom - verticalInset };
    const body = { ...bounds, top: bounds.top + (style.titleHeight + style.titleGap) * titleAlpha };
    body.width = body.right - body.left;
    body.height = body.bottom - body.top;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.rect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top); ctx.clip();
    const title = titles[name] || '';
    if (title && titleAlpha > 0) {
      ctx.save(); ctx.globalAlpha *= titleAlpha;
      drawFontCenteredText(title, bounds.left, bounds.top + style.titleHeight / 2, style.titleSize, 400, color.label);
      ctx.restore();
    }
    const compactFraction = compactFractionOf(item);
    if (name === 'close' || name === 'touch') drawAction(bounds, name);
    else if (name === 'powerHistory') drawPowerHistory(body);
    else if (name === 'thermalGraph') drawThermal(body, titleAlpha, compactFraction);
    else if (name === 'charge') drawCharge(body, style);
    else if (name === 'cpuFrequency') drawCpu(body, style);
    else if (name === 'cpuHistory') drawCpuHistory(body, compactFraction);
    else if (name === 'thermalStatus') {
      // 端侧：按全部状态名（含 SHUTDOWN）拟合尺寸，颜色跟随实际 resolvedStatus（非固定 NONE 色）
      const labels = ['NONE', 'LIGHT', 'MODERATE', 'SEVERE', 'CRITICAL', 'EMERGENCY', 'SHUTDOWN', '--'];
      const drawSize = fittedTextSize(labels, body.width, body.height, style.valueSize);
      const glyph = glyphBox(readings.thermalStatus, 700, drawSize);
      const statusColor = thermalColor(Math.max(0, labels.indexOf(readings.thermalStatus)));
      drawBaselineText(readings.thermalStatus, body.left,
        body.top + body.height / 2 - (glyph.top + glyph.bottom) / 2,
        drawSize, 700, statusColor);
    } else {
      const fill = name === 'batteryTemp' ? (Number.parseFloat(readings.batteryTemp) >= 40 ? color.hot : color.warm) : color.text;
      const parts = name === 'memory' ? ['5.8', '/', '12.0', ' GiB', '48%']
        : name === 'capacity' ? ['4120', '/', '5000', 'mAh'] : [readings[name]];
      // 端侧 fittedTextSize：按实际读数（拼接全文）二次收缩；memory/capacity 预留分隔符间隙
      const extra = (name === 'memory' || name === 'capacity') ? style.fields.reduce((sum, value) => sum + value, 0) : 0;
      const joined = parts.join('');
      const drawSize = fittedTextSize([joined], body.width, body.height, style.valueSize, extra);
      const glyph = glyphBox(joined, 700, drawSize);
      const baseline = body.top + body.height / 2 - (glyph.top + glyph.bottom) / 2;
      let x = body.left;
      parts.forEach((part, index) => {
        drawBaselineText(part, x, baseline, drawSize, 700, fill);
        x += textWidth(part, 700, drawSize) + (style.fields[index] || 0);
      });
    }
    ctx.restore();
  }
  function stillFrame(layout) {
    if (!stillFrameCache.has(layout)) {
      stillFrameCache.set(layout, frameAt({ fromLayout: layout, toLayout: layout, ...fadeWindows(layout, layout) }, 1));
    }
    return stillFrameCache.get(layout);
  }

  function resizeCanvas() {
    const cssWidth = canvas.clientWidth || 336;
    const cssHeight = cssWidth * stageHeight / stageWidth;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);
    if (canvas.width === width && canvas.height === height) return false;
    canvas.style.height = `${cssHeight}px`;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    return true;
  }

  function render(frame = null) {
    const layout = density === 'full' ? full : compact;
    const display = frame || stillFrame(layout);
    lastDisplay = display;
    const { width, height } = display;
    ctx.setTransform(canvas.width / stageWidth, 0, 0, canvas.height / stageHeight, 0, 0);
    ctx.clearRect(0, 0, stageWidth, stageHeight);
    const offsetX = (stageWidth - width) / 2;
    const offsetY = (stageHeight - height) / 2;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    const inset = unit / 2 + 0.5;
    // 端侧 draw()：背景 + 边框同属背景层，默认透明度档（OverlayOpacityScale level 2）= 0.70，且边框画在内容层之下
    g2Path(inset, inset, width - inset * 2, height - inset * 2, display.corner);
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = color.background;
    ctx.fill();
    ctx.lineWidth = unit;
    ctx.strokeStyle = plugged ? color.charging : color.discharge;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.clip();
    const visibleItems = [];
    const visibleNames = new Set();
    const visibleRows = new Set();
    display.items.forEach(item => {
      const r = item.rect;
      const inset = lerp(2, 1, Math.max(0, Math.min(1, (32 - item.cellDp) / 12))) * unit;
      const clearance = Math.min(r.left + inset, r.top + inset, width - r.right + inset, height - r.bottom + inset);
      const borderClearance = unit * 0.5 + 0.5;
      const alpha = Math.min(item.alpha,
        Math.max(0, Math.min(1, (clearance - borderClearance) / Math.max(3 * unit, 3))));
      if (alpha <= 0) return;
      visibleItems.push({ ...item, alpha });
      visibleNames.add(item.name);
      if (alignedItemNames.has(item.name)) visibleRows.add(alignmentKey(item));
    });
    let styles = stillStyleCache.get(display);
    if (!styles) {
      // Invisible row peers still participate in the shared font-size minimum.
      styles = itemStyles(display.items.filter(item => visibleNames.has(item.name) ||
        (alignedItemNames.has(item.name) && visibleRows.has(alignmentKey(item)))));
      if (!frame) stillStyleCache.set(display, styles);
    }
    visibleItems.forEach(item => {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
      drawItem(item, display, styles.get(item.name));
      ctx.restore();
    });
    ctx.restore();
    ctx.restore();
  }

  function toggle(targetDensity) {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    const targetProgress = targetDensity === 'compact' ? 1 : 0;
    if (transition) {
      transition.target = targetProgress;
      transition.startedAt = performance.now();
      transition.startProgress = transition.progress;
    } else {
      transition = { fromLayout: full, toLayout: compact, ...fadeWindows(full, compact),
        progress: density === 'full' ? 0 : 1, startProgress: density === 'full' ? 0 : 1,
        target: targetProgress, startedAt: performance.now() };
    }
    density = targetDensity;
    canvas.dataset.density = density;
    canvas.setAttribute('aria-label', density === 'full'
      ? (chinese ? '收起实时悬浮窗' : 'Collapse live overlay')
      : (chinese ? '展开实时悬浮窗' : 'Expand live overlay'));
    canvas.setAttribute('aria-pressed', String(density === 'full'));
    const tick = now => {
      if (!transition) return;
      const elapsed = now - transition.startedAt;
      const distance = Math.abs(transition.target - transition.startProgress);
      const amount = Math.min(1, elapsed / Math.max(1, durationMs * distance));
      transition.progress = lerp(transition.startProgress, transition.target, amount);
      render(frameAt(transition, transition.progress));
      if (amount < 1) animationFrame = requestAnimationFrame(tick);
      else {
        transition = null;
        animationFrame = 0;
        render();
      }
    };
    animationFrame = requestAnimationFrame(tick);
  }
  function visibleFrame() {
    return lastDisplay || stillFrame(density === 'full' ? full : compact);
  }
  function hitsOverlay(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return false;
    const pointX = (event.clientX - bounds.left) * stageWidth / bounds.width;
    const pointY = (event.clientY - bounds.top) * stageHeight / bounds.height;
    const frame = visibleFrame();
    const left = (stageWidth - frame.width) / 2;
    const top = (stageHeight - frame.height) / 2;
    return pointX >= left && pointX <= left + frame.width && pointY >= top && pointY <= top + frame.height;
  }
  function toggleFromOverlay(event) {
    if (!hitsOverlay(event)) return;
    toggle(density === 'full' ? 'compact' : 'full');
  }
  canvas.addEventListener('click', toggleFromOverlay);
  canvas.addEventListener('pointermove', event => {
    const cursor = hitsOverlay(event) ? 'pointer' : 'default';
    if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => { canvas.style.cursor = 'default'; });
  canvas.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle(density === 'full' ? 'compact' : 'full');
    }
  });
  let resizeFrame = 0;
  const scheduleResize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      if (resizeCanvas()) render(transition ? frameAt(transition, transition.progress) : null);
    });
  };
  new ResizeObserver(scheduleResize).observe(canvas.parentElement);
  window.addEventListener('resize', scheduleResize, { passive: true });
  document.fonts.load('700 14px "Overlay Inter"').then(() => {
    textMetricCache.clear();
    reservedWidthCache.clear();
    digitWidthCache.clear();
    stillStyleCache.delete(stillFrame(full));
    stillStyleCache.delete(stillFrame(compact));
    render(transition ? frameAt(transition, transition.progress) : null);
  });
  resizeCanvas();
  render();
})();
