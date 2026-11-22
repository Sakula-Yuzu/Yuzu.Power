const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const compactNavigation = window.matchMedia('(max-width: 900px)');
const navigationLabel = (open) => {
  const english = document.documentElement.lang === 'en';
  return open
    ? (english ? 'Close navigation' : '关闭导航')
    : (english ? 'Open navigation' : '打开导航');
};
const closeNavigation = () => {
  if (!menuButton || !nav) return;
  window.clearTimeout(closeNavigation.timer);
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', navigationLabel(false));
  nav.classList.remove('open');
  nav.classList.add('is-closing');
  document.body.classList.remove('menu-open');
  document.documentElement.classList.remove('menu-open');
  document.body.style.overflow = '';
  closeNavigation.timer = window.setTimeout(() => nav.classList.remove('is-closing'), 560);
};

let headerScrolled;
const updateHeader = () => {
  const scrolled = window.scrollY > 16;
  if (scrolled === headerScrolled) return;
  headerScrolled = scrolled;
  header?.classList.toggle('scrolled', scrolled);
};
updateHeader();
if (header) window.addEventListener('scroll', updateHeader, { passive: true });

menuButton?.addEventListener('click', () => {
  if (!nav || !compactNavigation.matches) return;
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  if (isOpen) {
    closeNavigation();
    return;
  }
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', navigationLabel(!isOpen));
  window.clearTimeout(closeNavigation.timer);
  nav?.classList.remove('is-closing');
  nav?.classList.toggle('open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
  document.documentElement.classList.add('menu-open');
});

compactNavigation.addEventListener('change', (event) => {
  if (!event.matches && menuButton?.getAttribute('aria-expanded') === 'true') closeNavigation();
});
window.addEventListener('pageshow', (event) => {
  if (event.persisted || document.documentElement.classList.contains('menu-open')) closeNavigation();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeNavigation();
    menuButton.focus({ preventScroll: true });
  }
});

nav?.addEventListener('click', (event) => {
  if (event.target === nav) closeNavigation();
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeNavigation);
});

const downloadTrigger = document.querySelector('[data-download-open]');
const downloadDialog = document.querySelector('[data-download-dialog]');
if (downloadTrigger && downloadDialog) {
  const copyButton = downloadDialog.querySelector('[data-download-copy]');
  const copyLabel = downloadDialog.querySelector('[data-download-copy-label]');
  const copyStatus = downloadDialog.querySelector('[data-download-status]');
  const manualLink = downloadDialog.querySelector('[data-download-link]');
  const downloadUrls = JSON.parse(downloadDialog.dataset.downloadUrls);
  const english = document.documentElement.lang === 'en';
  const copyText = english ? 'Copy  link' : '复制下载链接';
  manualLink.value = downloadUrls[0];
  let downloadCountedThisVisit = false;
  const reportDownloadCopy = () => {
    if (downloadCountedThisVisit) return;
    downloadCountedThisVisit = true;
    // Never retry: an interrupted response may already have been counted.
    try {
      fetch('/__events/download-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'download_copy' }),
        credentials: 'omit',
        cache: 'no-store',
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Statistics must not interrupt copying.
    }
  };

  downloadTrigger.addEventListener('click', () => {
    if (downloadDialog.open) return;
    copyStatus.textContent = '';
    copyLabel.textContent = copyText;
    manualLink.hidden = true;
    document.documentElement.classList.add('download-dialog-open');
    downloadDialog.showModal();
    applyExactG2Shapes();
  });
  downloadDialog.querySelector('[data-download-close]').addEventListener('click', () => downloadDialog.close());
  downloadDialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...downloadDialog.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden && element.getClientRects().length);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (!downloadDialog.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  downloadDialog.addEventListener('close', () => {
    document.documentElement.classList.remove('download-dialog-open');
    downloadTrigger.focus({ preventScroll: true });
  });
  copyButton.addEventListener('click', async () => {
    reportDownloadCopy();
    copyButton.disabled = true;
    const downloadUrl = downloadUrls[Math.floor(Math.random() * downloadUrls.length)];
    // Keep the same selection for clipboard and manual-copy fallbacks.
    manualLink.value = downloadUrl;
    manualLink.hidden = true;
    let copied = false;
    try {
      await navigator.clipboard.writeText(downloadUrl);
      copied = true;
    } catch {
      // Keep the fallback inside the modal so the field can receive focus.
      if (downloadDialog.open) {
        manualLink.hidden = false;
        manualLink.focus({ preventScroll: true });
        manualLink.select();
        try { copied = document.execCommand('copy'); } catch { /* Leave the selected link available for manual copying. */ }
        if (copied) {
          manualLink.hidden = true;
        }
      }
    } finally {
      copyButton.disabled = false;
    }
    if (!downloadDialog.open) return;
    if (copied) copyButton.focus({ preventScroll: true });
    copyLabel.textContent = copied ? (english ? 'Link copied' : '链接已复制') : copyText;
    copyStatus.textContent = copied
      ? ''
      : (english ? 'Automatic copying failed. Select and copy the link below manually.' : '自动复制失败，请长按或选中下方链接手动复制。');
  });
}

const revealElements = document.querySelectorAll('.reveal');
const observedRevealElements = [...revealElements].filter((element) => !element.closest('.hero'));
observedRevealElements.forEach((element) => element.classList.add('reveal-pending'));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  observedRevealElements.forEach((element) => observer.observe(element));
} else {
  observedRevealElements.forEach((element) => element.classList.add('visible'));
}

const animatedDetails = document.querySelectorAll('.download-checksum, .faq-list details');
const detailsContentCache = new WeakMap();
const detailsSummaryCache = new WeakMap();
const detailsAnimations = new WeakMap();
const detailsHeights = new WeakMap();
const resetDetailsAnimation = (details) => {
  const previous = detailsAnimations.get(details);
  if (previous) {
    cancelAnimationFrame(previous.frame);
    clearTimeout(previous.timer);
    previous.controller.abort();
  }
  const state = { controller: new AbortController(), frame: 0, timer: 0 };
  detailsAnimations.set(details, state);
  return state;
};
const finishDetailsAnimation = (details, content, state, finish) => {
  const complete = () => {
    if (detailsAnimations.get(details) !== state) return;
    clearTimeout(state.timer);
    state.controller.abort();
    detailsAnimations.delete(details);
    finish();
  };
  content.addEventListener('transitionend', (event) => {
    if (event.target === content && event.propertyName === 'max-height') complete();
  }, { signal: state.controller.signal });
  // Also settle when reduced motion or an interrupted transition emits no event.
  state.timer = setTimeout(complete, 600);
};
const detailsContent = (details) => {
  let content = detailsContentCache.get(details);
  if (!content) {
    content = details.querySelector('.download-checksum-body, p');
    if (content) detailsContentCache.set(details, content);
  }
  return content;
};

const closeDetails = (details) => {
  if (!details.open) return;
  const content = detailsContent(details);
  if (!content) return;
  const state = resetDetailsAnimation(details);
  const start = `${content.offsetHeight}px`;
  details.classList.add('is-closing');
  // 过渡期间 max-height 的计算值不可靠（0px↔none 离散切换），起点钳制要在禁用过渡下提交。
  // 类切换（opacity/transform/padding）与 max-height 归零放在同一帧 rAF 里启动，
  // 保证收起与展开的所有属性同帧、同曲线、同时长，互为镜像、无任何突变。
  const prevTransition = content.style.transition;
  content.style.transition = 'none';
  content.style.maxHeight = start;
  content.offsetHeight;
  content.style.transition = prevTransition;
  state.frame = requestAnimationFrame(() => {
    content.classList.remove('is-expanded');
    content.style.maxHeight = '0px';
  });
  finishDetailsAnimation(details, content, state, () => {
    details.open = false;
    details.classList.remove('is-closing');
    content.style.maxHeight = '';
  });
};

const openDetails = (details) => {
  const content = detailsContent(details);
  if (!content) return;
  const interrupted = details.open;
  const start = interrupted ? `${content.offsetHeight}px` : '0px';
  const state = resetDetailsAnimation(details);
  details.classList.remove('is-closing');
  details.open = true;
  // 测量须在禁用过渡 + 放开钳制 + is-expanded 全量状态下做（量 offsetHeight 含 padding/边框）；
  // max-height 挂着 .46s 过渡时 0px↔none 离散切换，测量期过渡必须禁用。
  const prevTransition = content.style.transition;
  content.style.transition = 'none';
  const width = content.clientWidth;
  let cached = detailsHeights.get(content);
  if (!cached || cached.width !== width || cached.text !== content.textContent) {
    content.style.maxHeight = 'none';
    content.classList.add('is-expanded');
    cached = { width, text: content.textContent, height: content.offsetHeight };
    detailsHeights.set(content, cached);
  }
  const target = `${cached.height}px`;
  // 回到未展开起点（过渡禁用，无动画），提交后同帧启动全部过渡
  content.classList.remove('is-expanded');
  content.style.maxHeight = start;
  content.offsetHeight;
  content.style.transition = prevTransition;
  state.frame = requestAnimationFrame(() => {
    content.classList.add('is-expanded');
    content.style.maxHeight = target;
  });
  finishDetailsAnimation(details, content, state, () => {
    content.style.maxHeight = 'none';
  });
};

animatedDetails.forEach((details) => {
  detailsSummaryCache.set(details, details.querySelector('summary'));
  details.addEventListener('click', (event) => {
    if (event.target.closest('summary') !== detailsSummaryCache.get(details)) return;
    event.preventDefault();
    if (details.open && !details.classList.contains('is-closing')) {
      closeDetails(details);
      return;
    }
    if (details.matches('.faq-list details')) {
      document.querySelectorAll('.faq-list details[open]').forEach(closeDetails);
    }
    openDetails(details);
  });
});

const liveReadings = {
  power: ['35.80', '36.40', '35.20', '37.10', '36.00', '35.50'],
  temperature: ['34.9', '35.0', '35.0', '35.1', '35.0', '34.9'],
  voltage: ['7.72', '7.74', '7.71', '7.76', '7.73', '7.72']
};
liveReadings.current = liveReadings.power.map((power, index) => (
  Number(power) / Number(liveReadings.voltage[index])
).toFixed(2));
let liveReadingFrame = 0;
const liveValueElements = [...document.querySelectorAll('[data-live-value]')];
const liveValueCopyElements = [...document.querySelectorAll('[data-live-value-copy="power"]')];

const updateLiveReadings = () => {
  liveReadingFrame += 1;
  liveValueElements.forEach((element) => {
    const values = liveReadings[element.dataset.liveValue];
    if (!values) return;
    element.textContent = values[liveReadingFrame % values.length];
  });
  liveValueCopyElements.forEach((element) => {
    element.textContent = Number(liveReadings.power[liveReadingFrame % liveReadings.power.length]).toFixed(1);
  });
};

const liveReadingRegion = document.querySelector('[data-live-value]')?.closest('.app-status-preview');
let liveReadingTimer = 0;
let liveReadingVisible = false;
const scheduleLiveReadings = () => {
  window.clearTimeout(liveReadingTimer);
  if (!liveReadingVisible || document.hidden) return;
  liveReadingTimer = window.setTimeout(() => {
    updateLiveReadings();
    scheduleLiveReadings();
  }, 1000);
};
if (liveReadingRegion) {
  new IntersectionObserver(([entry]) => {
    liveReadingVisible = entry.isIntersecting;
    scheduleLiveReadings();
  }).observe(liveReadingRegion);
}

const G2_RADIUS_DP = 24;
const G2_RADIUS_SCALE = 1.22;
const G2_EXPONENT = 2.8;
const G2_STEPS = 32;
// Use one contour on every engine: native corner-shape can render differently.
const hasNativeG2Corners = false;
const hasPolygonClipping = CSS.supports('clip-path', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)');
const hasValidShapeSize = (width, height) => Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
const fallbackCornerMetrics = new WeakMap();
const ACTIVE_RING_OUTSET = 8;
const ACTIVE_RING_OUTER_STROKE = 1.9;
const ACTIVE_RING_OUTER_ALPHA = 0.42;
const ACTIVE_RING_CYCLE_MS = 2000;
/* 无损降本：30fps 绘制 + 2 层 halo（原 60fps / 4 层 blur 描边，低端机为 CPU 软件栅格，开销最大） */
const ACTIVE_RING_FRAME_MS = 33;
let activeRingLastDrawTime = -ACTIVE_RING_FRAME_MS;
let activeRingColors = ['#e5dbff', '#cdb7ff', '#a07dff', '#7582ff', '#e5dbff'];
let activeRingTransition = null;
const ACTIVE_RING_HALOS = [
  { stroke: 1.5, blur: 3.2, alpha: 0.16 },
  { stroke: 1.06, blur: 0.8, alpha: 0.5 }
];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const landscapeMedia = window.matchMedia('(orientation: landscape)');

const buildG2Points = (width, height, offset = 0, radiusDp = G2_RADIUS_DP) => {
  const radius = Math.min(radiusDp * G2_RADIUS_SCALE, width / 2, height / 2);
  const points = [];
  const p = (value) => Math.max(0, value) ** (2 / G2_EXPONENT);
  const add = (x, y) => points.push([x + offset, y + offset]);

  add(radius, 0);
  add(width - radius, 0);
  for (let index = 0; index <= G2_STEPS; index += 1) {
    const angle = Math.PI / 2 - (index / G2_STEPS) * Math.PI / 2;
    add(width - radius + radius * p(Math.cos(angle)), radius - radius * p(Math.sin(angle)));
  }
  add(width, height - radius);
  for (let index = 0; index <= G2_STEPS; index += 1) {
    const angle = (index / G2_STEPS) * Math.PI / 2;
    add(width - radius + radius * p(Math.cos(angle)), height - radius + radius * p(Math.sin(angle)));
  }
  add(radius, height);
  for (let index = 0; index <= G2_STEPS; index += 1) {
    const angle = Math.PI / 2 - (index / G2_STEPS) * Math.PI / 2;
    add(radius - radius * p(Math.cos(angle)), height - radius + radius * p(Math.sin(angle)));
  }
  add(0, radius);
  for (let index = 0; index <= G2_STEPS; index += 1) {
    const angle = (index / G2_STEPS) * Math.PI / 2;
    add(radius - radius * p(Math.cos(angle)), radius - radius * p(Math.sin(angle)));
  }
  return points;
};

const pointsToPath = (points) => {
  const path = new Path2D();
  points.forEach(([x, y], index) => index === 0 ? path.moveTo(x, y) : path.lineTo(x, y));
  path.closePath();
  return path;
};

const themeColorWithAlpha = (color, alpha) => {
  const value = color.trim();
  const match = value.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!match) return `rgba(66, 133, 244, ${alpha})`;
  return `rgba(${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}, ${alpha})`;
};

const g2ShapeElements = [...document.querySelectorAll('.status-card, .dashboard-wide-card')];
const phoneElements = [...document.querySelectorAll('.phone-device')];
const fallbackShapeElements = [...document.querySelectorAll('.skip-link, .nav-download, .button, .theme-track button, .version-tag, .wallpaper-track button i, .download-checksum-body, .download-dialog, .download-dialog-close')];
const cardBorderContexts = new WeakMap();
const cardBorderMetrics = new WeakMap();
const cardBorderDrawState = new WeakMap();

const drawCardBorder = (card, width, height, radiusDp) => {
  if (width <= 0 || height <= 0) return;
  cardBorderMetrics.set(card, { width, height, radiusDp });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  const cardStyle = getComputedStyle(card);
  const themeColor = cardStyle.getPropertyValue('--preview-primary') || cardStyle.getPropertyValue('--theme-1') || '#4285f4';
  const drawKey = `${width}:${height}:${radiusDp}:${pixelRatio}:${themeColor}`;
  if (cardBorderDrawState.get(card) === drawKey) return;
  let canvas = card.querySelector('.card-border-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'card-border-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    card.append(canvas);
  }
  const pixelWidth = Math.max(1, Math.round(width * pixelRatio));
  const pixelHeight = Math.max(1, Math.round(height * pixelRatio));
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  let context = cardBorderContexts.get(canvas);
  if (!context) {
    context = canvas.getContext('2d');
    if (context) cardBorderContexts.set(canvas, context);
  }
  if (!context) return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  const previewUnit = width / (card.classList.contains('status-card') ? 645 : 1340);
  const strokeWidth = Math.max(1, previewUnit * 3.15);
  const inset = strokeWidth / 2;
  const path = pointsToPath(buildG2Points(
    width - strokeWidth,
    height - strokeWidth,
    inset,
    Math.max(0, radiusDp - inset / G2_RADIUS_SCALE)
  ));
  context.strokeStyle = themeColorWithAlpha(themeColor, 0.16);
  context.lineWidth = strokeWidth;
  context.stroke(path);
  cardBorderDrawState.set(card, drawKey);
};

let cardBorderRefreshFrame = 0;
const scheduleCardBorderRefresh = () => {
  if (cardBorderRefreshFrame) return;
  cardBorderRefreshFrame = requestAnimationFrame(() => {
    cardBorderRefreshFrame = 0;
    g2ShapeElements.forEach((card) => {
      const size = cardBorderMetrics.get(card);
      if (size) drawCardBorder(card, size.width, size.height, size.radiusDp);
    });
  });
};

const applyExactG2Shapes = () => {
  const statusShell = document.querySelector('.app-status-preview');
  if (statusShell) {
    const width = statusShell.offsetWidth;
    if (width > 0) statusShell.style.setProperty('--preview-u', `${width / 1440}px`);
  }
  if (!hasPolygonClipping) return;

  g2ShapeElements.forEach((card) => {
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    // Hidden components keep their last valid contour until they have a size again.
    if (!hasValidShapeSize(width, height)) return;
    const radiusDp = card.classList.contains('status-card')
      ? width * (75.6 / 645)
      : width * (75.6 / 1340);
    const polygon = buildG2Points(width, height, 0, radiusDp)
      .map(([x, y]) => `${(x / width * 100).toFixed(3)}% ${(y / height * 100).toFixed(3)}%`)
      .join(',');
    card.style.setProperty('--g2-path', polygon);
    card.classList.add('g2-card-ready');
    drawCardBorder(card, width, height, radiusDp);
  });

  if (statusShell) {
    const width = statusShell.offsetWidth;
    const height = statusShell.offsetHeight;
    if (width > 2 && height > 2) {
      const shellRadiusDp = width * (100.8 / 1440);
      const outer = buildG2Points(width, height, 0, shellRadiusDp)
        .map(([x, y]) => `${(x / width * 100).toFixed(3)}% ${(y / height * 100).toFixed(3)}%`)
        .join(',');
      const innerWidth = width - 2;
      const innerHeight = height - 2;
      const inner = buildG2Points(innerWidth, innerHeight, 0, 31)
        .map(([x, y]) => `${(x / innerWidth * 100).toFixed(3)}% ${(y / innerHeight * 100).toFixed(3)}%`)
        .join(',');
      statusShell.style.setProperty('--g2-shell-path', outer);
      statusShell.style.setProperty('--g2-shell-inner-path', inner);
    }
  }

  phoneElements.forEach((phone) => {
    const width = phone.offsetWidth;
    const height = phone.offsetHeight;
    if (!hasValidShapeSize(width, height)) return;
    const logicalWidthDp = 360;
    const radiusDp = 24 * 1.6 * (width / logicalWidthDp);
    const outerRadius = radiusDp * G2_RADIUS_SCALE;
    const polygon = buildG2Points(width, height, 0, radiusDp)
      .map(([x, y]) => `${(x / width * 100).toFixed(3)}% ${(y / height * 100).toFixed(3)}%`)
      .join(',');
    const phoneContent = phone.querySelector('.phone-shot, .app-status-preview');
    const border = phoneContent ? (Number.parseFloat(getComputedStyle(phoneContent).inset) || 0) : 0;
    const innerWidth = width - border * 2;
    const innerHeight = height - border * 2;
    if (!hasValidShapeSize(innerWidth, innerHeight) || width <= 2 || height <= 2) return;
    const innerRadiusDp = Math.max(0, (outerRadius - border) / G2_RADIUS_SCALE);
    const innerPolygon = buildG2Points(innerWidth, innerHeight, 0, innerRadiusDp)
      .map(([x, y]) => `${(x / innerWidth * 100).toFixed(3)}% ${(y / innerHeight * 100).toFixed(3)}%`)
      .join(',');
    const ringInset = 1;
    const ringWidth = width - ringInset * 2;
    const ringHeight = height - ringInset * 2;
    const ringRadiusDp = Math.max(0, (outerRadius - ringInset) / G2_RADIUS_SCALE);
    const ringPolygon = buildG2Points(ringWidth, ringHeight, 0, ringRadiusDp)
      .map(([x, y]) => `${(x / ringWidth * 100).toFixed(3)}% ${(y / ringHeight * 100).toFixed(3)}%`)
      .join(',');
    phone.style.setProperty('--g2-phone-path', polygon);
    phone.style.setProperty('--g2-phone-inner-path', innerPolygon);
    phone.style.setProperty('--g2-phone-ring-path', ringPolygon);
    phone.classList.add('g2-phone-ready');
    if (phone.classList.contains('dashboard-preview-phone')) {
      const discharge = phone.querySelector('.dashboard-discharge-card');
      const stage = phone.closest('.dashboard-preview-stage');
      if (discharge && stage) {
        stage.style.setProperty('--dashboard-visual-shift', '0px');
        const stageRect = stage.getBoundingClientRect();
        const dischargeRect = discharge.getBoundingClientRect();
        const fadeEnd = Math.min(stageRect.height, dischargeRect.bottom - stageRect.top + 20);
        const fadeStart = Math.max(0, fadeEnd - stageRect.height * 0.2);
        stage.style.setProperty('--dashboard-fade-start', `${fadeStart}px`);
        stage.style.setProperty('--dashboard-fade-end', `${fadeEnd}px`);
        const solidWeight = fadeStart;
        const fadeLength = Math.max(0, fadeEnd - fadeStart);
        const fadeWeight = fadeLength / 2;
        const fadeCentroid = fadeStart + fadeLength / 3;
        const visibleCentroid = (solidWeight * fadeStart / 2 + fadeWeight * fadeCentroid)
          / Math.max(1, solidWeight + fadeWeight);
        const section = stage.closest('.features-section');
        const sectionRect = section?.getBoundingClientRect();
        if (sectionRect && landscapeMedia.matches) {
          const targetCenter = sectionRect.top + sectionRect.height / 2;
          const demoLayout = stage.closest('.demo-layout');
          const revealTransform = demoLayout ? getComputedStyle(demoLayout).transform : 'none';
          const revealOffset = revealTransform === 'none' ? 0 : new DOMMatrixReadOnly(revealTransform).m42;
          const currentCenter = stageRect.top + visibleCentroid - revealOffset;
          const shift = Math.max(-stageRect.height * 0.12, Math.min(stageRect.height * 0.12, targetCenter - currentCenter));
          stage.style.setProperty('--dashboard-visual-shift', `${shift.toFixed(2)}px`);
        }
      }
    }
  });

  if (!hasNativeG2Corners) {
    fallbackShapeElements.forEach((element) => {
      // Layout dimensions exclude hover, press and menu animation transforms.
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      if (!hasValidShapeSize(width, height)) return;
      let metrics = fallbackCornerMetrics.get(element);
      if (!metrics) {
        const style = getComputedStyle(element);
        const cssRadius = style.borderTopLeftRadius;
        const radius = cssRadius.endsWith('%')
          ? Math.min(width, height) * parseFloat(cssRadius) / 100
          : parseFloat(cssRadius);
        if (!Number.isFinite(radius) || radius <= 0) return;
        metrics = { radius: radius / G2_RADIUS_SCALE,
          border: parseFloat(style.borderTopWidth) || 0, width: 0, height: 0 };
        if (metrics.border) {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const path = document.createElementNS(svg.namespaceURI, 'path');
          svg.classList.add('g2-fallback-border');
          svg.setAttribute('aria-hidden', 'true');
          svg.setAttribute('focusable', 'false');
          svg.setAttribute('stroke', style.borderTopColor);
          svg.setAttribute('stroke-width', metrics.border);
          svg.style.left = svg.style.top = `${-metrics.border}px`;
          svg.append(path);
          element.append(svg);
          metrics.svg = svg;
          metrics.path = path;
        }
        if (style.position === 'static') element.style.position = 'relative';
        fallbackCornerMetrics.set(element, metrics);
      }
      if (metrics.width === width && metrics.height === height && element.style.clipPath) return;
      const polygon = buildG2Points(width, height, 0, metrics.radius)
        .map(([x, y]) => `${(x / width * 100).toFixed(3)}% ${(y / height * 100).toFixed(3)}%`)
        .join(',');
      element.style.clipPath = `polygon(${polygon})`;
      // Keep CSS rounding until a valid contour has actually been installed.
      if (!element.style.clipPath) return;
      metrics.width = width;
      metrics.height = height;
      element.classList.add('g2-fallback');
      if (metrics.svg) {
        metrics.svg.setAttribute('width', width);
        metrics.svg.setAttribute('height', height);
        const inset = metrics.border / 2;
        const points = buildG2Points(width - metrics.border, height - metrics.border,
          inset, Math.max(0, metrics.radius - inset / G2_RADIUS_SCALE));
        metrics.path.setAttribute('d', points.map(([x, y], index) =>
          `${index ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`).join(' ') + 'Z');
      }
    });
  }
};

const activeRingCard = document.querySelector('.status-card-active');
const activeRingCanvas = activeRingCard?.querySelector('.active-ring-canvas');
let activeRingSize = null;
let activeRingFrame = 0;
let activeRingVisible = false;
let activeRingPath = null;
let activeRingContext = null;
const ringRgbCache = new Map();

const resizeActiveRingCanvas = () => {
  if (!activeRingCard || !activeRingCanvas) return;
  const width = activeRingCard.offsetWidth;
  const height = activeRingCard.offsetHeight;
  if (!hasValidShapeSize(width, height)) return;
  const ratio = window.devicePixelRatio || 1;
  if (activeRingSize?.width === width && activeRingSize.height === height && activeRingSize.ratio === ratio) return;
  activeRingCanvas.width = Math.round((width + ACTIVE_RING_OUTSET * 2) * ratio);
  activeRingCanvas.height = Math.round((height + ACTIVE_RING_OUTSET * 2) * ratio);
  activeRingSize = { width, height, ratio };
  activeRingPath = pointsToPath(buildG2Points(width, height, ACTIVE_RING_OUTSET, width * (75.6 / 645)));
  activeRingContext = activeRingCanvas.getContext('2d');
};

const colorToRgb = (color) => {
  if (ringRgbCache.has(color)) return ringRgbCache.get(color);
  if (color.startsWith('rgb')) {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number);
    ringRgbCache.set(color, rgb);
    return rgb;
  }
  const value = Number.parseInt(color.slice(1), 16);
  const rgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  ringRgbCache.set(color, rgb);
  return rgb;
};

const interpolateColor = (from, to, progress) => {
  const start = colorToRgb(from);
  const end = colorToRgb(to);
  const channels = start.map((value, index) => Math.round(value + (end[index] - value) * progress));
  return `rgb(${channels.join(',')})`;
};

const resolveRingColors = (time) => {
  if (!activeRingTransition) return activeRingColors;
  const progress = Math.min(1, Math.max(0, (time - activeRingTransition.startedAt) / activeRingTransition.duration));
  const colors = activeRingTransition.from.map((color, index) => (
    interpolateColor(color, activeRingTransition.to[index], progress)
  ));
  if (progress >= 1) {
    activeRingColors = activeRingTransition.to;
    activeRingTransition = null;
  }
  return colors;
};

const drawActiveRing = (time) => {
  if (!activeRingCanvas || !activeRingSize) return;
  if (time - activeRingLastDrawTime < ACTIVE_RING_FRAME_MS) {
    if (!prefersReducedMotion.matches && activeRingVisible && !document.hidden) {
      activeRingFrame = window.requestAnimationFrame(drawActiveRing);
    }
    return;
  }
  activeRingLastDrawTime = time;
  const { width, height, ratio } = activeRingSize;
  const context = activeRingContext;
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width + ACTIVE_RING_OUTSET * 2, height + ACTIVE_RING_OUTSET * 2);

  const radiusDp = width * (75.6 / 645);
  const path = activeRingPath || pointsToPath(buildG2Points(width, height, ACTIVE_RING_OUTSET, radiusDp));
  const centerX = ACTIVE_RING_OUTSET + width / 2;
  const centerY = ACTIVE_RING_OUTSET + height / 2;
  const rotation = (time % ACTIVE_RING_CYCLE_MS) / ACTIVE_RING_CYCLE_MS * Math.PI * 2;
  const gradient = context.createConicGradient(rotation, centerX, centerY);
  const ringColors = resolveRingColors(time);
  ringColors.forEach((color, index) => gradient.addColorStop(index / (ringColors.length - 1), color));

  ACTIVE_RING_HALOS.forEach((halo) => {
    context.save();
    context.strokeStyle = gradient;
    context.lineWidth = ACTIVE_RING_OUTER_STROKE * halo.stroke;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.globalAlpha = ACTIVE_RING_OUTER_ALPHA * halo.alpha;
    context.filter = `blur(${ACTIVE_RING_OUTER_STROKE * halo.blur}px)`;
    context.stroke(path);
    context.restore();
  });

  context.save();
  context.clip(path);
  context.strokeStyle = gradient;
  context.lineWidth = 2;
  context.stroke(path);
  context.restore();

  if (!prefersReducedMotion.matches && activeRingVisible && !document.hidden) {
    activeRingFrame = window.requestAnimationFrame(drawActiveRing);
  }
};

const statusPreview = document.querySelector('#features .dashboard-preview-phone .app-status-preview');
applyExactG2Shapes();
if (statusPreview) {
  resizeActiveRingCanvas();
  if (activeRingCard) {
    new IntersectionObserver(([entry]) => {
      activeRingVisible = entry.isIntersecting;
      window.cancelAnimationFrame(activeRingFrame);
      if (activeRingVisible && !document.hidden) activeRingFrame = window.requestAnimationFrame(drawActiveRing);
    }).observe(activeRingCard);
  }
}

let shapeRefreshFrame = 0;
const scheduleShapeRefresh = () => {
  if (shapeRefreshFrame) return;
  shapeRefreshFrame = window.requestAnimationFrame(() => {
    shapeRefreshFrame = 0;
    applyExactG2Shapes();
    resizeActiveRingCanvas();
  });
};
const shapeResizeObserver = new ResizeObserver(scheduleShapeRefresh);
if (statusPreview) shapeResizeObserver.observe(statusPreview);
g2ShapeElements.forEach((card) => shapeResizeObserver.observe(card));
phoneElements.forEach((phone) => shapeResizeObserver.observe(phone));
if (!hasNativeG2Corners) fallbackShapeElements.forEach((element) => shapeResizeObserver.observe(element));
document.fonts?.ready.then(scheduleShapeRefresh);
document.fonts?.addEventListener('loadingdone', scheduleShapeRefresh);
window.addEventListener('load', scheduleShapeRefresh);
window.addEventListener('pageshow', scheduleShapeRefresh);

document.addEventListener('visibilitychange', () => {
  scheduleLiveReadings();
  if (!document.hidden) scheduleShapeRefresh();
  window.cancelAnimationFrame(activeRingFrame);
  if (!document.hidden && activeRingVisible) activeRingFrame = window.requestAnimationFrame(drawActiveRing);
}, { passive: true });

const themePalettes = {
  dynamic: ['#4285f4', '#ea4335', '#fbbc04', '#34a853'],
  ocean: ['#95f1ff', '#47d7ff', '#149eff', '#5b75f0'],
  forest: ['#a8e5b3', '#63d57d', '#45b25a', '#b8c55c'],
  sunset: ['#ffe0a1', '#ffba67', '#ff7d50', '#d08a30'],
  blossom: ['#ffd4e2', '#ffa5ca', '#ef679a', '#b77fc5'],
  jizi: ['#e5dbff', '#cdb7ff', '#a07dff', '#7582ff'],
  monochrome: ['#ffffff', '#dde1e7', '#aeb5c0', '#707985'],
  ruby: ['#ff664d', '#ff3038', '#ff1744', '#d9002b']
};
// The phone shows the app's dark schemes, independently of the website's brand colors.
// Source: ui-foundation/theme/Yuzu.PowerTheme.kt. Card RGB values are computed with Compose's
// Oklab lerp(surface, surfaceVariant, .22f), then CardStyleSupport's primary tint.
// Monochrome keeps its explicit surfaceContainerLow. Dynamic uses the app's pre-Android-12
// fallback; a website cannot read Android's system dynamic palette.
const previewThemeSchemes = {
  dynamic: {
    primary: '#d0bcff', secondary: '#ccc2dc', background: '#141218',
    'on-surface': '#e6e0e9', 'on-surface-variant': '#cac4d0',
    'surface-variant': '#49454f', 'card-rgb': '38 35 43'
  },
  ocean: {
    primary: '#91c9ff', secondary: '#76ded9', background: '#07171d',
    'on-surface': '#e5f2f7', 'on-surface-variant': '#b8ccd2',
    'surface-variant': '#314d55', 'card-rgb': '26 47 57'
  },
  forest: {
    primary: '#82d9aa', secondary: '#b8d788', background: '#0d1511',
    'on-surface': '#e3f1e8', 'on-surface-variant': '#becabf',
    'surface-variant': '#3e4941', 'card-rgb': '31 45 37'
  },
  sunset: {
    primary: '#ffc16b', secondary: '#ffb875', background: '#18100d',
    'on-surface': '#f5ede8', 'on-surface-variant': '#d7c2ba',
    'surface-variant': '#51433d', 'card-rgb': '52 38 31'
  },
  blossom: {
    primary: '#ff9fc5', secondary: '#f0afcb', background: '#171017',
    'on-surface': '#f2ecf2', 'on-surface-variant': '#d3c2d0',
    'surface-variant': '#4f4450', 'card-rgb': '50 38 48'
  },
  jizi: {
    primary: '#cdb8ff', secondary: '#bfc8ff', background: '#14121b',
    'on-surface': '#eae6f2', 'on-surface-variant': '#cfc4d9',
    'surface-variant': '#4c4559', 'card-rgb': '47 41 58'
  },
  monochrome: {
    primary: '#ffffff', secondary: '#e0e0e0', background: '#000000',
    'on-surface': '#ffffff', 'on-surface-variant': '#f0f0f0',
    'surface-variant': '#303030', 'card-rgb': '45 45 45'
  },
  ruby: {
    primary: '#ff3038', secondary: '#ff6578', background: '#10090c',
    'on-surface': '#f5edef', 'on-surface-variant': '#e0c1c8',
    'surface-variant': '#493239', 'card-rgb': '46 22 27'
  }
};
const themeButtons = [...document.querySelectorAll('#features .theme-track [data-theme]')];
const themeNames = Object.keys(themePalettes);
const themeCurrentName = document.querySelector('[data-theme-current-name]');
let activeThemeIndex = themeNames.indexOf('dynamic');
let themeChangeTimer = null;
let themePaused = false;

/* 轮播恒为竖向：横/竖不再由量测尺寸推断（首帧尺寸未稳会先渲染成横向再跳变） */
const renderThemeCarousel = () => {
  const wallpaperThumb = document.querySelector('.wallpaper-track button i');
  const wheelScale = wallpaperThumb ? wallpaperThumb.getBoundingClientRect().width / 24 : 1;
  const verticalStep = 40 * wheelScale;
  themeButtons.forEach((button, index) => {
    let offset = index - activeThemeIndex;
    if (offset > themeNames.length / 2) offset -= themeNames.length;
    if (offset < -themeNames.length / 2) offset += themeNames.length;
    const distance = Math.abs(offset);
    const prevOffset = button._carouselOffset ?? offset;
    const wrapped = Math.abs(offset - prevOffset) > themeNames.length / 2;
    const renderToken = (button._carouselRenderToken || 0) + 1;
    button._carouselRenderToken = renderToken;
    const setPosition = (position, opacity) => {
      button.style.setProperty('--theme-x', '0px');
      button.style.setProperty('--theme-y', `${position * verticalStep}px`);
      button.style.setProperty('--theme-opacity', opacity);
    };
    const targetOpacity = distance === 0 ? '1' : distance === 1 ? '.62' : distance === 2 ? '.32' : '.12';
    button.style.transition = '';
    if (wrapped) {
      button.style.transition = 'none';
      setPosition(offset + Math.sign(offset), '.02');
      void button.offsetWidth;
      window.requestAnimationFrame(() => {
        if (button._carouselRenderToken !== renderToken) return;
        button.style.transition = '';
        setPosition(offset, targetOpacity);
      });
    } else {
      setPosition(offset, targetOpacity);
    }
    button.setAttribute('aria-pressed', String(index === activeThemeIndex));
    button.tabIndex = distance <= 1 ? 0 : -1;
    button.style.pointerEvents = distance <= 2 ? 'auto' : 'none';
    button._carouselOffset = offset;
  });
};

const applyTheme = (themeName) => {
  const colors = themePalettes[themeName];
  const scheme = previewThemeSchemes[themeName];
  if (!statusPreview || !colors || !scheme) return;
  const now = performance.now();
  const currentRingColors = resolveRingColors(now);
  activeThemeIndex = themeNames.indexOf(themeName);
  if (themeCurrentName) {
    themeCurrentName.textContent = themeButtons[activeThemeIndex]?.textContent.trim() || '';
  }
  activeRingTransition = {
    from: currentRingColors,
    to: [...colors, colors[0]],
    startedAt: now,
    duration: 500
  };
  statusPreview.dataset.activeTheme = themeName;
  colors.forEach((color, index) => statusPreview.style.setProperty(`--theme-${index + 1}`, color));
  Object.entries(scheme).forEach(([token, color]) => statusPreview.style.setProperty(`--preview-${token}`, color));
  const solidWallpaperSwatch = document.querySelector('.wallpaper-track [data-wallpaper="none"]');
  solidWallpaperSwatch?.style.setProperty('--solid-preview-background', scheme.background);
  scheduleCardBorderRefresh();
  statusPreview.classList.add('theme-changing');
  window.clearTimeout(themeChangeTimer);
  themeChangeTimer = window.setTimeout(() => statusPreview.classList.remove('theme-changing'), 80);
  renderThemeCarousel();
};

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyTheme(button.dataset.theme);
  });
});

const themeViewport = document.querySelector('.theme-viewport');
themeViewport?.addEventListener('mouseenter', () => {
  themePaused = true;
});
themeViewport?.addEventListener('mouseleave', () => {
  themePaused = false;
});

if (themeButtons.length) {
  applyTheme(statusPreview?.dataset.activeTheme || 'dynamic');
}

const wallpaperPaths = {
  starfield: 'assets/builtin-wallpaper-starfield.webp',
  none: null,
  lotus: 'assets/builtin-wallpaper-lotus.webp',
  sunset: 'assets/builtin-wallpaper-sunset.webp',
  cat: 'assets/builtin-wallpaper-cat.webp',
  'city-sunset': 'assets/builtin-wallpaper-city-sunset.webp'
};
const wallpaperButtons = [...document.querySelectorAll('[data-wallpaper]')];
const wallpaperName = document.querySelector('[data-wallpaper-current-name]');
const wallpaperLayers = [...document.querySelectorAll('.dashboard-wallpaper-layer')];
const siteAssetBase = new URL('.', document.currentScript?.src || document.baseURI);
const wallpaperImages = new Map();
let activeWallpaperIndex = 0;
let wallpaperPaused = false;
let activeWallpaperLayer = 0;
let wallpaperRequest = 0;

const renderWallpaperCarousel = () => {
  const thumb = document.querySelector('.wallpaper-track button i');
  const wheelScale = thumb ? thumb.getBoundingClientRect().width / 24 : 1;
  const verticalStep = 52 * wheelScale;
  wallpaperButtons.forEach((button, index) => {
    let offset = index - activeWallpaperIndex;
    if (offset > wallpaperButtons.length / 2) offset -= wallpaperButtons.length;
    if (offset < -wallpaperButtons.length / 2) offset += wallpaperButtons.length;
    const distance = Math.abs(offset);
    const prevOffset = button._carouselOffset ?? offset;
    const wrapped = Math.abs(offset - prevOffset) > wallpaperButtons.length / 2;
    const renderToken = (button._carouselRenderToken || 0) + 1;
    button._carouselRenderToken = renderToken;
    const setPosition = (position, opacity) => {
      button.style.setProperty('--wallpaper-x', '0px');
      button.style.setProperty('--wallpaper-y', `${position * verticalStep}px`);
      button.style.setProperty('--wallpaper-opacity', opacity);
    };
    const targetOpacity = distance === 0 ? '1' : distance === 1 ? '.64' : distance === 2 ? '.3' : '.1';
    button.style.transition = '';
    if (wrapped) {
      button.style.transition = 'none';
      setPosition(offset + Math.sign(offset), '.02');
      void button.offsetWidth;
      window.requestAnimationFrame(() => {
        if (button._carouselRenderToken !== renderToken) return;
        button.style.transition = '';
        setPosition(offset, targetOpacity);
      });
    } else {
      setPosition(offset, targetOpacity);
    }
    button.setAttribute('aria-pressed', String(index === activeWallpaperIndex));
    button.style.pointerEvents = distance <= 2 ? 'auto' : 'none';
    button._carouselOffset = offset;
  });
};

const applyWallpaper = (index) => {
  const request = ++wallpaperRequest;
  activeWallpaperIndex = (index + wallpaperButtons.length) % wallpaperButtons.length;
  const button = wallpaperButtons[activeWallpaperIndex];
  const path = wallpaperPaths[button.dataset.wallpaper];
  const layers = wallpaperLayers;
  const nextLayerIndex = activeWallpaperLayer === 0 ? 1 : 0;
  const showNextLayer = () => {
    if (request !== wallpaperRequest || !layers[nextLayerIndex]) return;
    layers[nextLayerIndex].style.backgroundImage = path ? `url("${new URL(path, siteAssetBase).href}")` : 'none';
    statusPreview.dataset.activeWallpaper = button.dataset.wallpaper;
    layers[nextLayerIndex].classList.add('is-visible');
    layers[activeWallpaperLayer]?.classList.remove('is-visible');
    activeWallpaperLayer = nextLayerIndex;
  };
  if (path) {
    let image = wallpaperImages.get(path);
    if (!image) {
      image = new Image();
      image.decoding = 'async';
      image.addEventListener('error', () => wallpaperImages.delete(path), { once: true });
      image.src = new URL(path, siteAssetBase).href;
      wallpaperImages.set(path, image);
    }
    if (image.complete && image.naturalWidth) showNextLayer();
    else image.addEventListener('load', showNextLayer, { once: true });
  } else {
    showNextLayer();
  }
  if (wallpaperName) wallpaperName.textContent = button.textContent.trim();
  renderWallpaperCarousel();
};

wallpaperButtons.forEach((button, index) => button.addEventListener('click', () => {
  applyWallpaper(index);
}));
const wallpaperViewport = document.querySelector('.wallpaper-viewport');
wallpaperViewport?.addEventListener('mouseenter', () => { wallpaperPaused = true; });
wallpaperViewport?.addEventListener('mouseleave', () => { wallpaperPaused = false; });
if (wallpaperButtons.length) renderWallpaperCarousel();

const CAROUSEL_TICK_MS = 4000;
const carouselClockEpoch = performance.now();
let carouselClockTimer = null;
let carouselClockTick = 0;
let carouselVisible = false;
const advanceCarouselClock = () => {
  const tick = Math.floor((performance.now() - carouselClockEpoch) / CAROUSEL_TICK_MS);
  const elapsedTicks = tick - carouselClockTick;
  carouselClockTick = tick;
  if (elapsedTicks > 0 && !themePaused && !wallpaperPaused) {
    if (themeButtons.length) applyTheme(themeNames[(activeThemeIndex + elapsedTicks) % themeNames.length]);
    if (wallpaperButtons.length) applyWallpaper(activeWallpaperIndex + elapsedTicks);
  }
};
const scheduleCarouselClock = () => {
  window.clearTimeout(carouselClockTimer);
  carouselClockTimer = null;
  if (!carouselVisible || document.hidden || (!themeButtons.length && !wallpaperButtons.length)) return;
  const elapsed = performance.now() - carouselClockEpoch;
  const delay = CAROUSEL_TICK_MS - (elapsed % CAROUSEL_TICK_MS);
  carouselClockTimer = window.setTimeout(() => {
    advanceCarouselClock();
    scheduleCarouselClock();
  }, delay);
};
const carouselRegion = statusPreview?.closest('.features-section');
if (carouselRegion) {
  new IntersectionObserver(([entry]) => {
    carouselVisible = entry.isIntersecting;
    if (carouselVisible && !document.hidden) advanceCarouselClock();
    scheduleCarouselClock();
  }, { rootMargin: '240px 0px' }).observe(carouselRegion);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && carouselVisible) advanceCarouselClock();
  scheduleCarouselClock();
}, { passive: true });

let responsiveLayoutWidth = window.innerWidth;
window.addEventListener('resize', () => {
  scheduleShapeRefresh();
  if (Math.abs(window.innerWidth - responsiveLayoutWidth) < 2) return;
  responsiveLayoutWidth = window.innerWidth;
  if (themeButtons.length) renderThemeCarousel();
  if (wallpaperButtons.length) renderWallpaperCarousel();
}, { passive: true });

/* 主按钮磁吸：鼠标悬停时向指针方向轻微吸附。
   稳定性三件套：①进入时缓存未位移的基准矩形（rect 若每次现读会包含当前 translate，形成反馈回路，指针停在边缘时按钮滑出→复位→滑回，浏览器补发 mousemove 造成持续抽动）；
   ②悬停期间 translate 无过渡（CSS 的 .3s 过渡会让每一步都变成 300ms 追赶动画）；
   ③位移钳制，按钮永远滑不出指针范围，杜绝 leave/enter 振荡。 */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.button-primary').forEach((button) => {
    const strength = 0.16;
    const maxShift = 10;
    let baseRect = null;
    let frame = 0;
    let lastEvent = null;

    const clamp = (value) => Math.max(-maxShift, Math.min(maxShift, value));
    const apply = () => {
      frame = 0;
      if (!baseRect || !lastEvent) return;
      const x = clamp((lastEvent.clientX - baseRect.left - baseRect.width / 2) * strength);
      const y = clamp((lastEvent.clientY - baseRect.top - baseRect.height / 2) * strength);
      button.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    };
    const schedule = (event) => {
      lastEvent = event;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    button.addEventListener('pointerenter', (event) => {
      // 基准矩形 = 当前 rect 减去已应用的 translate（处理过渡中途重入的情况）
      const rect = button.getBoundingClientRect();
      const match = /translate\(\s*([-\d.]+)px\s+([-\d.]+)px\s*\)/.exec(button.style.translate || '');
      baseRect = {
        left: rect.left - (match ? parseFloat(match[1]) : 0),
        top: rect.top - (match ? parseFloat(match[2]) : 0),
        width: rect.width,
        height: rect.height,
      };
      button.style.transition = '';
      schedule(event);
    });
    button.addEventListener('mousemove', schedule, { passive: true });
    button.addEventListener('mouseleave', () => {
      baseRect = null;
      lastEvent = null;
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      // 复位走短过渡，回位平滑；悬停期间无过渡、直接跟随
      button.style.transition = 'translate .32s cubic-bezier(.22,.8,.25,1)';
      button.style.translate = '0px 0px';
    });
  });
}

/* 首屏开场编排：双 rAF 确保初始态先绘制，1.8s 后移除类还原各元素原有 transition */
const introRoot = document.documentElement;
if (introRoot.classList.contains('intro')) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    introRoot.classList.add('intro-play');
    window.setTimeout(() => introRoot.classList.remove('intro', 'intro-play'), 1800);
  }));
}

/* 字符级标题拆分：逐字包 span 并编号，空格以 white-space: pre 保留 */
document.querySelectorAll('.hero h1, .experience-copy h2, .demo-copy h3, .capability-heading h2, .download-inner h2, .faq-section .section-heading h2').forEach((heading) => {
  let charIndex = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const fragment = document.createDocumentFragment();
        for (const ch of child.textContent) {
          const span = document.createElement('span');
          span.className = 'char';
          span.style.setProperty('--char-i', charIndex++);
          span.textContent = ch;
          fragment.appendChild(span);
        }
        child.replaceWith(fragment);
      } else if (child.nodeType === 1) {
        walk(child);
      }
    });
  };
  walk(heading);
  heading.closest('.reveal')?.classList.add('chars-split');
});

/* 点状分页导航：中心区域命中的 section 点亮对应圆点 */
const pageDots = document.querySelector('.page-dots');
if (pageDots && 'IntersectionObserver' in window) {
  const dotLinks = [...pageDots.querySelectorAll('a')];
  const dotBySectionId = new Map(dotLinks.map((link) => [link.getAttribute('href').slice(1), link]));
  const dotObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      dotLinks.forEach((link) => link.classList.remove('active'));
      dotBySectionId.get(entry.target.id)?.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  dotBySectionId.forEach((link, id) => {
    const section = document.getElementById(id);
    if (section) dotObserver.observe(section);
  });
}

/* 光标聚光灯：仅首屏与下载区出现的极淡跟随光 */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const spotlight = document.createElement('div');
  spotlight.className = 'cursor-spotlight';
  spotlight.setAttribute('aria-hidden', 'true');
  document.body.appendChild(spotlight);
  let spotlightFrame = 0;
  let spotlightEvent = null;
  const updateSpotlight = () => {
    spotlightFrame = 0;
    const event = spotlightEvent;
    if (!event?.target.closest?.('.hero, .download-section')) {
      if (spotlight.style.opacity !== '0') spotlight.style.opacity = '0';
      return;
    }
    if (spotlight.style.opacity !== '1') spotlight.style.opacity = '1';
    spotlight.style.translate = `${event.clientX - 280}px ${event.clientY - 280}px`;
  };
  document.addEventListener('mousemove', (event) => {
    spotlightEvent = event;
    if (!spotlightFrame) spotlightFrame = requestAnimationFrame(updateSpotlight);
  }, { passive: true });
  document.addEventListener('mouseleave', () => {
    spotlightEvent = null;
    cancelAnimationFrame(spotlightFrame);
    spotlightFrame = 0;
    spotlight.style.opacity = '0';
  });
}

/* Fill a single remaining cell using the resolved responsive grid, not device breakpoints. */
document.querySelectorAll('.capability-section .feature-grid').forEach((grid) => {
  const tile = grid.lastElementChild;
  if (!tile) return;
  const updateExploreTile = () => {
    const columns = getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
    const count = grid.children.length - 1;
    tile.hidden = !(columns > 1 && count % columns === columns - 1);
  };
  new ResizeObserver(updateExploreTile).observe(grid);
  updateExploreTile();
});
