// ============================================================
// GO KART SPORT BAR — circuito.js  (simulación animada del circuito)
// Karts que frenan en curvas, aceleran en rectas, se adelantan y derrapan.
// Es una animación decorativa: no muestra datos reales de la pista.
// ============================================================
(function () {
  const svg = document.getElementById("circuito-svg");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const trazado = document.getElementById("trazado-circuito");
  const capaKarts = document.getElementById("capa-karts");
  const capaHumo = document.getElementById("capa-humo");
  const capaEstela = document.getElementById("capa-estela");
  const tabla = document.getElementById("tabla-posiciones");
  const vueltaTxt = document.getElementById("vuelta-num");
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Muestreo del trazado: punto, ángulo y curvatura ----------
  const L = trazado.getTotalLength(), PASO = 2, N = Math.floor(L / PASO);
  const pts = [];
  for (let i = 0; i < N; i++) { const p = trazado.getPointAtLength(i * PASO); pts.push({ x: p.x, y: p.y }); }
  const ang = pts.map((p, i) => { const q = pts[(i + 2) % N], o = pts[(i - 2 + N) % N]; return Math.atan2(q.y - o.y, q.x - o.x); });
  const dif = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const curva = ang.map((a, i) => Math.abs(dif(ang[(i + 6) % N], ang[(i - 6 + N) % N])) / (12 * PASO));
  // velocidad máxima por punto: mira la curva que viene (los pilotos frenan antes)
  const VMAX = 330, VMIN = 95;
  const vLimite = curva.map((_, i) => {
    let c = 0; for (let k = 0; k < 40; k++) c = Math.max(c, curva[(i + k) % N] * (1 - k / 60));
    return Math.max(VMIN, VMAX / (1 + c * 120));
  });
  const muestra = d => { const i = Math.floor(((d % L) + L) % L / PASO) % N; return i; };

  // ---------- Karts ----------
  const PILOTOS = [
    { n: "07", color: "#ff2d3d", casco: "#ffd400", nombre: "ROJO" },
    { n: "21", color: "#ffd400", casco: "#111318", nombre: "AMARILLO" },
    { n: "33", color: "#2f8bff", casco: "#f5f7fb", nombre: "AZUL" },
    { n: "44", color: "#22d36b", casco: "#ff2d3d", nombre: "VERDE" },
    { n: "99", color: "#f5f7fb", casco: "#ff7a00", nombre: "BLANCO" }
  ];

  function dibujarKart(p) {
    const g = document.createElementNS(NS, "g");
    g.innerHTML =
      // sombra
      '<ellipse cx="1" cy="2" rx="19" ry="11" fill="rgba(0,0,0,.45)"/>' +
      // neumáticos
      '<rect x="-16" y="-13" width="10" height="6" rx="2" fill="#0b0c10"/><rect x="-16" y="7" width="10" height="6" rx="2" fill="#0b0c10"/>' +
      '<rect x="7" y="-12" width="8" height="5" rx="2" fill="#0b0c10"/><rect x="7" y="7" width="8" height="5" rx="2" fill="#0b0c10"/>' +
      // chasis y pontones
      '<path d="M-14 -7 L10 -6 Q19 -4 20 0 Q19 4 10 6 L-14 7 Q-17 0 -14 -7Z" fill="' + p.color + '"/>' +
      '<path d="M-12 -9 L4 -8 L4 -6 L-12 -6Z M-12 9 L4 8 L4 6 L-12 6Z" fill="' + p.color + '" opacity=".85"/>' +
      '<path d="M12 -5 Q18 -3 19 0 Q18 3 12 5Z" fill="rgba(255,255,255,.35)"/>' +
      // alerón trasero y volante
      '<rect x="-19" y="-8" width="3" height="16" rx="1" fill="#1b1d24"/>' +
      '<circle cx="6" cy="0" r="2.4" fill="none" stroke="#1b1d24" stroke-width="1.4"/>' +
      // casco del piloto con visera
      '<circle cx="-2" cy="0" r="5.4" fill="' + p.casco + '" stroke="#0b0c10" stroke-width="1"/>' +
      '<path d="M0.5 -3.4 Q4 0 0.5 3.4 Q2 0 0.5 -3.4Z" fill="#0b0c10"/>' +
      // número
      '<text x="-10" y="2.3" font-size="6.2" font-family="Saira Condensed, sans-serif" font-weight="900" fill="#0b0c10" text-anchor="middle">' + p.n + '</text>';
    capaKarts.appendChild(g);
    return g;
  }

  const karts = PILOTOS.map((p, i) => ({
    p, g: dibujarKart(p),
    dist: -i * 62,                     // salen en fila desde la meta
    v: 0, carril: (i % 2 ? 11 : -11), carrilObj: (i % 2 ? 11 : -11),
    talento: 0.94 + Math.random() * 0.08, estela: [], vueltas: 0, deriva: 0
  }));

  // ---------- Humo ----------
  const humos = [];
  function humo(x, y, a) {
    if (humos.length > 70) return;
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", 3); c.setAttribute("fill", "rgba(220,224,232,.55)");
    capaHumo.appendChild(c);
    humos.push({ c, x, y, r: 3, o: .55, vx: -Math.cos(a) * 12 + (Math.random() - .5) * 18, vy: -Math.sin(a) * 12 + (Math.random() - .5) * 18 });
  }

  // ---------- Bucle ----------
  let t0 = null, visible = true, vuelta = 1, ultimoOrden = "";
  const estelaPath = karts.map(k => {
    const pl = document.createElementNS(NS, "polyline");
    pl.setAttribute("fill", "none"); pl.setAttribute("stroke", k.p.color); pl.setAttribute("stroke-width", "8");
    pl.setAttribute("stroke-linecap", "round"); pl.setAttribute("opacity", ".0");
    capaEstela.appendChild(pl); return pl;
  });

  function paso(dt) {
    karts.forEach((k, i) => {
      const idx = muestra(k.dist);
      // velocidad objetivo con talento y un poco de vida
      let vObj = vLimite[idx] * k.talento * (0.97 + 0.03 * Math.sin(performance.now() / 900 + i));
      // ¿hay alguien delante en el mismo carril? -> intenta adelantar por el otro lado
      karts.forEach(o => {
        if (o === k) return;
        let gap = ((o.dist - k.dist) % L + L) % L;
        if (gap < 52 && Math.abs(o.carril - k.carril) < 12) {
          if (curva[idx] < 0.004) k.carrilObj = o.carril > 0 ? -12 : 12;   // en recta se abre para pasar
          else vObj = Math.min(vObj, o.v * 0.98);                         // en curva espera
        }
      });
      const acel = vObj > k.v ? 160 : 420;                               // frena más fuerte de lo que acelera
      k.v += Math.max(-acel * dt, Math.min(acel * dt, vObj - k.v));
      const antes = k.dist;
      k.dist += k.v * dt;
      if (Math.floor(k.dist / L) > Math.floor(antes / L) && k.dist > 0) k.vueltas++;
      k.carril += (k.carrilObj - k.carril) * Math.min(1, dt * 2.2);
      // derrape: el kart gira un poco más que la curva cuando va rápido
      const exceso = Math.max(0, curva[idx] * k.v - 0.9);
      k.deriva += ((dif(ang[(idx + 4) % N], ang[idx]) > 0 ? 1 : -1) * Math.min(0.32, exceso * 0.18) - k.deriva) * Math.min(1, dt * 5);
      const pt = pts[idx], a = ang[idx], nx = -Math.sin(a), ny = Math.cos(a);
      const x = pt.x + nx * k.carril, y = pt.y + ny * k.carril;
      k.g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + ((a + k.deriva) * 180 / Math.PI).toFixed(1) + ") scale(1.55)");
      if (exceso > 0.6 && Math.random() < 0.55) humo(x - Math.cos(a) * 22, y - Math.sin(a) * 22, a);
      // estela de velocidad en las rectas
      k.estela.push(x.toFixed(1) + "," + y.toFixed(1)); if (k.estela.length > 9) k.estela.shift();
      estelaPath[i].setAttribute("points", k.estela.join(" "));
      estelaPath[i].setAttribute("opacity", Math.max(0, (k.v - 230) / 300).toFixed(2));
    });
    for (let j = humos.length - 1; j >= 0; j--) {
      const h = humos[j];
      h.x += h.vx * dt; h.y += h.vy * dt; h.r += 22 * dt; h.o -= 0.6 * dt;
      if (h.o <= 0) { h.c.remove(); humos.splice(j, 1); continue; }
      h.c.setAttribute("cx", h.x.toFixed(1)); h.c.setAttribute("cy", h.y.toFixed(1)); h.c.setAttribute("r", h.r.toFixed(1)); h.c.setAttribute("opacity", h.o.toFixed(2));
    }
  }

  function pintarTabla() {
    const orden = karts.slice().sort((a, b) => b.dist - a.dist);
    const lider = orden[0];
    const v = Math.max(1, Math.floor(lider.dist / L) + 1);
    if (v !== vuelta) { vuelta = v; if (vueltaTxt) vueltaTxt.textContent = String(v).padStart(2, "0"); }
    const clave = orden.map(k => k.p.n).join();
    if (clave === ultimoOrden) return;
    ultimoOrden = clave;
    tabla.innerHTML = "";
    orden.forEach((k, i) => {
      const li = document.createElement("li");
      const gap = i === 0 ? "LÍDER" : "+" + ((lider.dist - k.dist) / 330).toFixed(1) + "s";
      li.innerHTML = '<b>P' + (i + 1) + '</b><i style="background:' + k.p.color + '"></i><span>#' + k.p.n + '</span><em>' + gap + '</em>';
      tabla.appendChild(li);
    });
  }

  function frame(t) {
    if (t0 === null) t0 = t;
    const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
    if (visible && !document.hidden) { paso(dt); }
    requestAnimationFrame(frame);
  }

  if (reducido) {   // sin animación: karts quietos en la parrilla
    paso(0.016); pintarTabla(); return;
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(svg);
  requestAnimationFrame(frame);
  setInterval(() => { if (visible && !document.hidden) pintarTabla(); }, 450);
  pintarTabla();
})();
