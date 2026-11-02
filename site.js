(function () {
  var mode = "drain";
  var tick = 0;
  var timer = 0;

  function sample(kind, t) {
    if (kind === "drain") {
      var w = -2.7 + Math.sin(t * 0.62) * 1.35 + Math.sin(t * 0.17) * 0.28;
      var v = 4.04 + Math.sin(t * 0.23) * 0.02;
      return {
        w: w,
        v: v,
        a: w / v,
        batt: 36 + Math.sin(t * 0.11) * 0.4,
        skin: 39 + Math.sin(t * 0.09) * 0.5,
        npu: 47.3 + Math.sin(t * 0.13) * 0.8,
        cpuT: 62 + Math.sin(t * 0.15) * 2.2,
        cpu: 18 + Math.sin(t * 0.4) * 7 + Math.sin(t * 0.9) * 3
      };
    }
    var cw = 18.6 + Math.sin(t * 0.45) * 2.8;
    var cv = 4.28 + Math.sin(t * 0.2) * 0.02;
    return {
      w: cw,
      v: cv,
      a: cw / cv,
      batt: 38.2 + Math.sin(t * 0.1) * 0.5,
      skin: 41.4 + Math.sin(t * 0.08) * 0.45,
      npu: 51 + Math.sin(t * 0.12) * 0.7,
      cpuT: 58 + Math.sin(t * 0.14) * 1.6,
      cpu: 22 + Math.sin(t * 0.35) * 5
    };
  }

  function num(n, digits) {
    return n.toFixed(digits);
  }

  function line(kind, t) {
    var values = [];
    var i;
    for (i = 0; i < 42; i += 1) values.push(sample(kind, t - (41 - i) * 0.28).w);
    var min = Math.min.apply(null, values.concat([kind === "drain" ? -8 : 8]));
    var max = Math.max.apply(null, values.concat([kind === "drain" ? 0 : 28]));
    var span = max - min || 1;
    return values
      .map(function (value, index) {
        var x = (index / (values.length - 1)) * 320;
        var y = 78 - ((value - min) / span) * 66;
        return (index === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      })
      .join(" ");
  }

  function paint() {
    var now = sample(mode, tick);
    var charging = mode === "charge";
    var map = {
      "m-w": num(now.w, 2) + " W",
      "m-a": num(now.a, 2) + " A",
      "m-v": num(now.v, 2) + " V",
      "m-batt": num(now.batt, 0) + " °C",
      "m-skin": num(now.skin, 1) + " °C",
      "m-npu": num(now.npu, 1) + " °C",
      "m-cput": num(now.cpuT, 1) + " °C",
      "m-cpu": Math.max(4, Math.min(96, now.cpu)).toFixed(1) + "%"
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });
    var status = document.getElementById("meter-status");
    var hero = document.getElementById("hero-status");
    var label = charging ? "状态：充电中" : "状态：放电中";
    if (status) status.textContent = label;
    if (hero) hero.textContent = label;
    var path = document.getElementById("meter-line");
    if (path) path.setAttribute("d", line(mode, tick));
    var power = document.getElementById("m-w");
    if (power) power.classList.toggle("is-charge", charging);
  }

  function setMode(next, root) {
    mode = next;
    root.querySelectorAll("[data-mode]").forEach(function (item) {
      item.setAttribute("aria-pressed", item.getAttribute("data-mode") === mode ? "true" : "false");
    });
    paint();
  }

  function bootNav(root) {
    var toggle = root.querySelector(".nav-toggle");
    var menu = document.getElementById("mobile-nav");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", open ? "false" : "true");
      toggle.setAttribute("aria-label", open ? "打开菜单" : "关闭菜单");
      menu.hidden = open;
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "打开菜单");
      }
    });
  }

  function bootLightbox() {
    var box = document.getElementById("lightbox");
    var img = document.getElementById("lightbox-img");
    var cap = document.getElementById("lightbox-cap");
    if (!box || !img || !cap) return;

    function close() {
      box.hidden = true;
      document.body.classList.remove("lock");
      img.removeAttribute("src");
    }

    document.querySelectorAll("[data-shot]").forEach(function (button) {
      button.addEventListener("click", function () {
        img.src = button.getAttribute("data-shot");
        img.alt = button.getAttribute("data-alt") || "";
        cap.textContent = button.getAttribute("data-cap") || "";
        box.hidden = false;
        document.body.classList.add("lock");
        var closer = box.querySelector(".lightbox-close");
        if (closer) closer.focus();
      });
    });

    box.addEventListener("click", function (event) {
      if (event.target === box || event.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !box.hidden) close();
    });
  }

  function boot() {
    var root = document.getElementById("yp");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    bootNav(root);
    bootLightbox();
    root.querySelectorAll("[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        setMode(button.getAttribute("data-mode"), root);
      });
    });
    paint();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = window.setInterval(function () {
      if (document.hidden) return;
      tick += 1;
      paint();
    }, 700);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
