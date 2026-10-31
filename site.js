(function () {
  var timer = 0;
  var mode = "drain";
  var tick = 0;

  function sample(kind, t) {
    if (kind === "drain") {
      var w = -5.4 + Math.sin(t * 0.72) * 1.55 + Math.sin(t * 0.21) * 0.35;
      var v = 3.96 + Math.sin(t * 0.31) * 0.025;
      return { w: w, v: v, ma: (w / v) * 1000, temp: 30.1 + Math.sin(t * 0.16) * 0.35 };
    }
    var cw = 19.4 + Math.sin(t * 0.48) * 3.6 + Math.sin(t * 0.19) * 0.8;
    var cv = 4.22 + Math.sin(t * 0.27) * 0.03;
    return { w: cw, v: cv, ma: (cw / cv) * 1000, temp: 33.4 + Math.sin(t * 0.14) * 0.6 };
  }

  function signed(n, digits) {
    var text = n.toFixed(digits);
    return n > 0 ? "+" + text : text;
  }

  function line(kind, t) {
    var values = [];
    var i;
    for (i = 0; i < 36; i += 1) values.push(sample(kind, t - (35 - i) * 0.35).w);
    var min = Math.min.apply(null, values.concat([-2]));
    var max = Math.max.apply(null, values.concat([2]));
    var span = max - min || 1;
    return values
      .map(function (value, index) {
        var x = (index / (values.length - 1)) * 320;
        var y = 86 - ((value - min) / span) * 74;
        return (index === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      })
      .join(" ");
  }

  function paint() {
    var now = sample(mode, tick);
    var w = document.getElementById("m-w");
    var temp = document.getElementById("m-t");
    var volts = document.getElementById("m-v");
    var amps = document.getElementById("m-a");
    var src = document.getElementById("m-src");
    var status = document.getElementById("meter-status");
    var path = document.getElementById("meter-line");
    if (!w || !path) return;
    w.innerHTML = signed(now.w, 2) + ' <span>W</span>';
    temp.innerHTML = now.temp.toFixed(1) + ' <span>°C</span>';
    volts.innerHTML = now.v.toFixed(2) + ' <span>V</span>';
    amps.innerHTML = signed(Math.round(now.ma), 0).replace(/\.0$/, "") + ' <span>mA</span>';
    var charging = mode === "charge";
    src.textContent = charging ? "外部电源" : "电池供电";
    status.textContent = charging ? "状态：充电中" : "状态：放电中";
    path.setAttribute("d", line(mode, tick));
  }

  function boot() {
    var root = document.getElementById("yp");
    if (!root || root.dataset.ready === "1") {
      paint();
      return;
    }
    root.dataset.ready = "1";
    var toggle = root.querySelector(".nav-toggle");
    var menu = document.getElementById("mobile-nav");
    if (toggle && menu) {
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
    root.querySelectorAll("[data-mode]").forEach(function (button) {
      button.addEventListener("click", function () {
        mode = button.getAttribute("data-mode");
        root.querySelectorAll("[data-mode]").forEach(function (item) {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        paint();
      });
    });
    paint();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    window.clearInterval(timer);
    timer = window.setInterval(function () {
      tick += 1;
      paint();
    }, 700);
  }

  document.addEventListener("yuzu-site-boot", boot);
  if (document.getElementById("yp")) boot();
})();
