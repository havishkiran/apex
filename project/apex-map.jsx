// apex-map.jsx — a faked dark vector map.
// Procedural grayscale street network drawn on <canvas> (blocks, streets,
// arterials, a desaturated river), with the live ride route as an SVG overlay
// so the orange line gets a real glow. Orange route + puck only when recording.

const { useRef, useEffect, useState } = React;

// deterministic PRNG so the city looks the same every render
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCity(canvas, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rnd = mulberry32(20260604);

  // base
  ctx.fillStyle = '#0E1014';
  ctx.fillRect(0, 0, w, h);

  // map is rotated a touch for an organic, non-aligned feel
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.12);
  ctx.translate(-w / 2, -h / 2);
  const pad = 240; // overscan so rotation doesn't reveal edges

  // subtle district blocks (faint lighter fills)
  for (let i = 0; i < 80; i++) {
    const x = -pad + rnd() * (w + pad * 2);
    const y = -pad + rnd() * (h + pad * 2);
    const bw = 26 + rnd() * 90, bh = 26 + rnd() * 90;
    ctx.fillStyle = `rgba(150,160,176,${0.03 + rnd() * 0.045})`;
    ctx.fillRect(x, y, bw, bh);
  }

  // a desaturated river band (near-grayscale slate, won't fight the orange)
  ctx.save();
  ctx.strokeStyle = 'rgba(78,92,108,0.6)';
  ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-60, h * 0.16);
  ctx.bezierCurveTo(w * 0.32, h * 0.28, w * 0.18, h * 0.5, w * 0.46, h * 0.62);
  ctx.bezierCurveTo(w * 0.72, h * 0.73, w * 0.6, h * 0.92, w + 60, h * 1.02);
  ctx.stroke();
  // river inner sheen
  ctx.strokeStyle = 'rgba(102,118,136,0.4)';
  ctx.lineWidth = 22; ctx.stroke();
  ctx.restore();

  // minor street grid (slightly jittered)
  const step = 58;
  ctx.lineCap = 'round';
  for (let gx = -pad; gx < w + pad; gx += step) {
    ctx.strokeStyle = `rgba(154,164,180,${0.16 + rnd() * 0.08})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    let x = gx + (rnd() - 0.5) * 14;
    ctx.moveTo(x, -pad);
    for (let y = -pad; y < h + pad; y += 40) {
      x += (rnd() - 0.5) * 6;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let gy = -pad; gy < h + pad; gy += step) {
    ctx.strokeStyle = `rgba(154,164,180,${0.16 + rnd() * 0.08})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    let y = gy + (rnd() - 0.5) * 14;
    ctx.moveTo(-pad, y);
    for (let x = -pad; x < w + pad; x += 40) {
      y += (rnd() - 0.5) * 6;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // a few thicker arterials
  ctx.strokeStyle = 'rgba(188,196,210,0.34)';
  ctx.lineWidth = 5;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const horiz = rnd() > 0.5;
    if (horiz) {
      const y = rnd() * h;
      ctx.moveTo(-pad, y + (rnd() - 0.5) * 80);
      ctx.bezierCurveTo(w * 0.3, y + (rnd() - 0.5) * 120, w * 0.7, y + (rnd() - 0.5) * 120, w + pad, y + (rnd() - 0.5) * 80);
    } else {
      const x = rnd() * w;
      ctx.moveTo(x + (rnd() - 0.5) * 80, -pad);
      ctx.bezierCurveTo(x + (rnd() - 0.5) * 120, h * 0.3, x + (rnd() - 0.5) * 120, h * 0.7, x + (rnd() - 0.5) * 80, h + pad);
    }
    ctx.stroke();
  }
  ctx.restore();

  // vignette to focus center
  const g = ctx.createRadialGradient(w / 2, h * 0.44, h * 0.16, w / 2, h * 0.5, h * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,11,14,0.6)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// the ride route in 402x874 viewBox space; head (latest position) ends near centre
const ROUTE_D = "M64 778 C104 720 170 742 184 678 C200 612 150 566 196 516 C238 474 300 480 286 414 C278 376 232 388 212 398";

function ApexMap({ recording = true, accent = '#FF6B1A', following = false, turnDir = 'right' }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const pathRef = useRef(null);
  const [len, setLen] = useState(0);
  const [head, setHead] = useState({ x: 212, y: 398 });

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const render = () => {
      const r = wrap.getBoundingClientRect();
      if (r.width && r.height) drawCity(canvas, r.width, r.height);
    };
    const raf = requestAnimationFrame(render);
    const t0 = setTimeout(render, 60);
    const ro = new ResizeObserver(render);
    ro.observe(wrap);
    return () => { cancelAnimationFrame(raf); clearTimeout(t0); ro.disconnect(); };
  }, []);

  useEffect(() => {
    if (pathRef.current) {
      const L = pathRef.current.getTotalLength();
      setLen(L);
      const p = pathRef.current.getPointAtLength(L);
      setHead({ x: p.x, y: p.y });
    }
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#0E1014' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <svg viewBox="0 0 402 874" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <filter id="routeGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* follow-route: a forward route from the rider, bending toward the next turn */}
        {following && (() => {
          const ahead = {
            right: 'M201 760 L201 392 C201 344 214 318 262 314 C322 309 360 318 392 300',
            left: 'M201 760 L201 392 C201 344 188 318 140 314 C80 309 42 318 10 300',
            'slight-right': 'M201 760 L201 430 C201 372 232 330 300 270 C338 236 360 220 384 198',
            'slight-left': 'M201 760 L201 430 C201 372 170 330 102 270 C64 236 42 220 18 198',
            straight: 'M201 760 L201 150',
            uturn: 'M201 760 L201 420 C201 366 246 350 246 398 C246 452 214 470 214 510',
            arrive: 'M201 760 L201 360',
          }[turnDir] || 'M201 760 L201 392 C201 344 214 318 262 314';
          const behind = 'M201 980 L201 760';
          return (
            <g>
              {/* traveled (dim) */}
              <path d={behind} fill="none" stroke={accent} strokeOpacity="0.28" strokeWidth="5"
                strokeLinecap="round" />
              {/* route ahead: glow + bright */}
              <path d={ahead} fill="none" stroke={accent} strokeOpacity="0.32" strokeWidth="15"
                strokeLinecap="round" strokeLinejoin="round" filter="url(#routeGlow)" />
              <path d={ahead} fill="none" stroke={accent} strokeWidth="6"
                strokeLinecap="round" strokeLinejoin="round" />
              {/* destination flag at end when arriving */}
              {turnDir === 'arrive' && (
                <g transform="translate(201 360)">
                  <circle r="9" fill={accent} /><circle r="3.6" fill="#0E1014" />
                </g>
              )}
              {/* nav position chevron (heading up) */}
              <g transform="translate(201 760)">
                <circle r="20" fill={accent} fillOpacity="0.16">
                  <animate attributeName="r" values="15;26;15" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.26;0.04;0.26" dur="2.2s" repeatCount="indefinite" />
                </circle>
                <circle r="15" fill="#0E1014" stroke={accent} strokeWidth="2" />
                <path d="M0 -8 L6 6 L0 2 L-6 6 Z" fill={accent} />
              </g>
            </g>
          );
        })()}

        {recording && !following && (
          <g>
            {/* soft glow underlay */}
            <path d={ROUTE_D} fill="none" stroke={accent} strokeOpacity="0.35"
              strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"
              filter="url(#routeGlow)" />
            {/* the route, drawing in */}
            <path ref={pathRef} d={ROUTE_D} fill="none" stroke={accent}
              strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"
              style={len ? {
                strokeDasharray: len, strokeDashoffset: len,
                animation: 'apexDraw 2.4s cubic-bezier(0.22,1,0.36,1) forwards',
              } : { opacity: 0 }} />
            {/* heading puck */}
            <g transform={`translate(${head.x} ${head.y})`}>
              <circle r="17" fill={accent} fillOpacity="0.18">
                <animate attributeName="r" values="13;22;13" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.28;0.04;0.28" dur="2.2s" repeatCount="indefinite" />
              </circle>
              <circle r="9" fill={accent} />
              <circle r="4.2" fill="#F2F2F0" />
            </g>
          </g>
        )}

        {!recording && !following && (
          // idle: a neutral location puck, no orange (orange = active only)
          <g transform="translate(201 432)">
            <circle r="15" fill="#F2F2F0" fillOpacity="0.10">
              <animate attributeName="r" values="11;19;11" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.16;0.03;0.16" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle r="7.5" fill="#F2F2F0" fillOpacity="0.92" />
            <circle r="3.4" fill="#0C0D10" />
          </g>
        )}
      </svg>

      <style>{`@keyframes apexDraw { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

Object.assign(window, { ApexMap });
