/* ============================================================
   AquaMind Portfolio — script.js
   Sections:
   1. Hero Canvas (animated particle rain + grid)
   2. Nav (scroll shrink + mobile burger)
   3. Scroll Reveal
   4. Counter Animations
   5. Chart.js Charts
   6. AI Card stagger delays
   7. Flowchart node pulse on scroll
   8. Smooth section progress indicator
   ============================================================ */

"use strict";

/* ─────────────────────────────────────────────
   1. HERO CANVAS — Animated water drop rain
   + flowing grid lines
───────────────────────────────────────────── */
(function initHeroCanvas() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let W, H, drops, gridLines;
  const GREEN = "rgba(29,158,117,";
  const TEAL  = "rgba(15,110,86,";

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    initDrops();
    initGrid();
  }

  /* --- Drops --- */
  function makeDrops(n) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 6 + Math.random() * 14,
      speed: 0.4 + Math.random() * 1.1,
      alpha: 0.06 + Math.random() * 0.18,
      width: 0.5 + Math.random() * 1.2,
    }));
  }

  function initDrops() {
    const count = Math.floor((W * H) / 8000);
    drops = makeDrops(count);
  }

  /* --- Grid lines --- */
  function initGrid() {
    gridLines = [];
    const cols = Math.ceil(W / 80);
    const rows = Math.ceil(H / 80);
    for (let c = 0; c <= cols; c++) {
      gridLines.push({ type: "v", pos: c * 80, offset: Math.random() * 80 });
    }
    for (let r = 0; r <= rows; r++) {
      gridLines.push({ type: "h", pos: r * 80, offset: Math.random() * 80 });
    }
  }

  let t = 0;

  function drawGrid() {
    gridLines.forEach((line) => {
      const pulse = Math.sin(t * 0.008 + line.offset * 0.04) * 0.5 + 0.5;
      ctx.strokeStyle = TEAL + (0.04 + pulse * 0.06) + ")";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      if (line.type === "v") {
        ctx.moveTo(line.pos, 0);
        ctx.lineTo(line.pos, H);
      } else {
        ctx.moveTo(0, line.pos);
        ctx.lineTo(W, line.pos);
      }
      ctx.stroke();
    });
  }

  function drawDrops() {
    drops.forEach((d) => {
      ctx.strokeStyle = GREEN + d.alpha + ")";
      ctx.lineWidth = d.width;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x, d.y + d.len);
      ctx.stroke();

      d.y += d.speed;
      if (d.y > H + d.len) {
        d.y = -d.len;
        d.x = Math.random() * W;
      }
    });
  }

  /* Ripple circles that spawn periodically */
  const ripples = [];
  function spawnRipple() {
    ripples.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0,
      maxR: 40 + Math.random() * 60,
      alpha: 0.25,
    });
  }
  setInterval(spawnRipple, 1200);

  function drawRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 0.6;
      rp.alpha *= 0.97;
      ctx.strokeStyle = GREEN + rp.alpha + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (rp.alpha < 0.01 || rp.r > rp.maxR) ripples.splice(i, 1);
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    t++;
    drawGrid();
    drawDrops();
    drawRipples();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  loop();
})();


/* ─────────────────────────────────────────────
   2. NAV — Scroll shrink + mobile burger
───────────────────────────────────────────── */
(function initNav() {
  const nav    = document.getElementById("nav");
  const burger = document.getElementById("navBurger");
  const links  = document.querySelector(".nav-links");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });

  burger.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  /* Close on link click */
  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => links.classList.remove("open"));
  });
})();


/* ─────────────────────────────────────────────
   3. SCROLL REVEAL — IntersectionObserver
───────────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll(".reveal");

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          /* Stagger children if parent has data-stagger */
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
  );

  els.forEach((el, i) => {
    /* Cascade delay based on siblings with same parent */
    const siblings = Array.from(el.parentElement.querySelectorAll(".reveal"));
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = idx * 80 + "ms";
    io.observe(el);
  });
})();


/* ─────────────────────────────────────────────
   4. COUNTER ANIMATIONS
   Targets: .stat-num (hero) and .mc-val (metrics)
───────────────────────────────────────────── */
(function initCounters() {
  function animateCounter(el, target, duration) {
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      /* Ease out cubic */
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  function observeCounters(selector, duration) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            animateCounter(el, target, duration);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll(selector).forEach((el) => io.observe(el));
  }

  observeCounters(".stat-num", 1800);
  observeCounters(".mc-val", 1400);
})();


/* ─────────────────────────────────────────────
   5. CHART.JS CHARTS — animate only when the
   #data section scrolls into view
───────────────────────────────────────────── */
(function initCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js not loaded");
    return;
  }

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = "#888780";

  const gridStyle = { color: "rgba(100,100,100,0.1)", drawBorder: false };

  let chartsBuilt = false;

  function buildCharts() {
    if (chartsBuilt) return;
    chartsBuilt = true;

    /* ── a) Bar Chart — Water Usage ── */
    const waterCtx = document.getElementById("waterChart");
    if (waterCtx) {
      new Chart(waterCtx, {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Traditional",
              data: [4900, 5300, 5700, 6200, 6000, 5500],
              backgroundColor: "#3B8BD4",
              borderRadius: 6,
              borderSkipped: false,
            },
            {
              label: "AquaMind AI",
              data: [3400, 3650, 3950, 4300, 4050, 3750],
              backgroundColor: "#1D9E75",
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1200,
            easing: "easeOutQuart",
            delay: (ctx) => ctx.dataIndex * 80,
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#1A1A18",
              titleColor: "#fff",
              bodyColor: "rgba(255,255,255,0.7)",
              padding: 12,
              callbacks: {
                label: (ctx) =>
                  ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} L`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12 } } },
            y: {
              grid: gridStyle,
              beginAtZero: false,
              min: 2500,
              ticks: { font: { size: 11 }, callback: (v) => v.toLocaleString() + " L" },
            },
          },
        },
      });
    }

    /* ── b) Doughnut — Breakdown ── */
    const pieCtx = document.getElementById("pieChart");
    if (pieCtx) {
      new Chart(pieCtx, {
        type: "doughnut",
        data: {
          labels: ["Used efficiently (AI)", "Saved vs traditional", "Unavoidable loss"],
          datasets: [{
            data: [58, 25, 17],
            backgroundColor: ["#1D9E75", "#3B8BD4", "#EF9F27"],
            borderWidth: 0,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "65%",
          animation: { animateRotate: true, duration: 1400, easing: "easeOutQuart" },
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 11 }, padding: 14, boxWidth: 10, boxHeight: 10 },
            },
            tooltip: {
              backgroundColor: "#1A1A18",
              titleColor: "#fff",
              bodyColor: "rgba(255,255,255,0.7)",
              padding: 12,
              callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}%` },
            },
          },
        },
      });
    }

    /* ── c) Line — Soil Moisture ── */
    const soilCtx = document.getElementById("soilChart");
    if (soilCtx) {
      new Chart(soilCtx, {
        type: "line",
        data: {
          labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
          datasets: [
            {
              label: "Soil moisture %",
              data: [68, 60, 53, 72, 65, 58, 74],
              borderColor: "#1D9E75",
              backgroundColor: "rgba(29,158,117,0.08)",
              tension: 0.45,
              pointRadius: 5,
              pointBackgroundColor: "#1D9E75",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              fill: true,
              borderWidth: 2.5,
            },
            {
              label: "Optimal min (55%)",
              data: [55, 55, 55, 55, 55, 55, 55],
              borderColor: "#BA7517",
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
              borderWidth: 1.5,
              tension: 0,
            },
            {
              label: "Optimal max (75%)",
              data: [75, 75, 75, 75, 75, 75, 75],
              borderColor: "#185FA5",
              borderDash: [6, 4],
              pointRadius: 0,
              fill: false,
              borderWidth: 1.5,
              tension: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 1400, easing: "easeOutQuart" },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#1A1A18",
              titleColor: "#fff",
              bodyColor: "rgba(255,255,255,0.7)",
              padding: 12,
              callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12 } } },
            y: {
              grid: gridStyle,
              min: 35,
              max: 90,
              ticks: { font: { size: 11 }, callback: (v) => v + "%" },
            },
          },
        },
      });
    }
  }

  /* Only build & animate charts when #data section enters the viewport */
  const dataSection = document.getElementById("data");
  if (!dataSection) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          buildCharts();
          io.unobserve(dataSection);
        }
      });
    },
    { threshold: 0.15 }
  );

  io.observe(dataSection);
})();


/* ─────────────────────────────────────────────
   6. AI CARD STAGGER on scroll entry
───────────────────────────────────────────── */
(function initAiCards() {
  const cards = document.querySelectorAll(".ai-card");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || 0, 10);
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, delay);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  cards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(28px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    io.observe(card);
  });
})();


/* ─────────────────────────────────────────────
   7. FLOW NODE pulse entrance animation
───────────────────────────────────────────── */
(function initFlowNodes() {
  const nodes = document.querySelectorAll(".flow-node");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const siblings = Array.from(
            entry.target.parentElement.querySelectorAll(".flow-node")
          );
          const idx = siblings.indexOf(entry.target);
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0) scale(1)";
          }, idx * 100);
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  nodes.forEach((node) => {
    node.style.opacity = "0";
    node.style.transform = "translateY(16px) scale(0.97)";
    node.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    io.observe(node);
  });
})();


/* ─────────────────────────────────────────────
   8. SCROLL PROGRESS BAR (top of viewport)
───────────────────────────────────────────── */
(function initProgressBar() {
  const bar = document.createElement("div");
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    background: linear-gradient(to right, #1D9E75, #3B8BD4);
    z-index: 999;
    width: 0%;
    transition: width 0.1s linear;
    pointer-events: none;
  `;
  document.body.appendChild(bar);

  window.addEventListener(
    "scroll",
    () => {
      const scrolled = window.scrollY;
      const total =
        document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = ((scrolled / total) * 100).toFixed(2) + "%";
    },
    { passive: true }
  );
})();


/* ─────────────────────────────────────────────
   9. SDG CARD tilt on hover (subtle 3D)
───────────────────────────────────────────── */
(function initTilt() {
  const cards = document.querySelectorAll(".sdg-card, .comp-card, .ai-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(600px) rotateY(${dx * 4}deg) rotateX(${-dy * 4}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
})();


/* ─────────────────────────────────────────────
   10. ACTIVE NAV LINK highlight on scroll
───────────────────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) => {
            a.style.color = "";
            if (a.getAttribute("href") === "#" + entry.target.id) {
              a.style.color = "#1D9E75";
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((s) => io.observe(s));
})();


/* ─────────────────────────────────────────────
   11. COMPETITIVE TABLE — Row hover highlight
───────────────────────────────────────────── */
(function initTableHover() {
  const rows = document.querySelectorAll(".comp-table tbody tr");
  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.style.background = "rgba(29,158,117,0.06)";
    });
    row.addEventListener("mouseleave", () => {
      row.style.background = "";
    });
  });
})();


/* ─────────────────────────────────────────────
   12. FUTURE TIMELINE dot pulse on scroll
───────────────────────────────────────────── */
(function initTimelinePulse() {
  const dots = document.querySelectorAll(".fi-dot");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const dot = entry.target;
          dot.style.boxShadow = "0 0 0 0 rgba(29,158,117,0.6)";
          dot.style.animation = "dotPulse 1s ease-out forwards";
          io.unobserve(dot);
        }
      });
    },
    { threshold: 1 }
  );

  /* Inject keyframe */
  const style = document.createElement("style");
  style.textContent = `
    @keyframes dotPulse {
      0%   { box-shadow: 0 0 0 0 rgba(29,158,117,0.6); }
      70%  { box-shadow: 0 0 0 12px rgba(29,158,117,0); }
      100% { box-shadow: 0 0 0 0 rgba(29,158,117,0); }
    }
    @keyframes tagFloat {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-3px); }
    }
  `;
  document.head.appendChild(style);

  dots.forEach((dot) => io.observe(dot));
})();


/* ─────────────────────────────────────────────
   13. TAG FLOAT animation on hover
───────────────────────────────────────────── */
(function initTagFloat() {
  document.querySelectorAll(".tag, .sector-tag").forEach((tag) => {
    tag.addEventListener("mouseenter", () => {
      tag.style.animation = "tagFloat 0.6s ease-in-out";
    });
    tag.addEventListener("animationend", () => {
      tag.style.animation = "";
    });
  });
})();


/* Hero parallax removed — hero content stays perfectly centred at all times */


/* ─────────────────────────────────────────────
   15. SCROLL HINT — fade out on scroll start
   Positioned bottom-right, vertical text (CSS-driven)
───────────────────────────────────────────── */
(function initScrollHint() {
  const hint = document.querySelector(".hero-scroll-hint");
  if (!hint) return;

  window.addEventListener("scroll", () => {
    /* Start fading at 40px, fully gone by 160px */
    const y       = window.scrollY;
    const opacity = Math.max(0, 1 - (y - 40) / 120);
    hint.style.opacity       = opacity;
    hint.style.pointerEvents = opacity < 0.05 ? "none" : "";
    hint.style.transform     = `translateY(${y * 0.35}px)`;
  }, { passive: true });
})();


/* ─────────────────────────────────────────────
   INIT LOG
───────────────────────────────────────────── */
console.log(
  "%c💧 AquaMind Portfolio loaded",
  "color:#1D9E75;font-family:monospace;font-size:14px;font-weight:bold;"
);