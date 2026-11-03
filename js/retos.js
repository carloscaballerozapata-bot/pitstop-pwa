// ============================================================
// GO KART SPORT BAR — retos.js  (retos entre amigos, campeones y galería)
// API: crearReto, verReto, getCampeones, getFotos, subirFoto
// ============================================================
const $ = id => document.getElementById(id);
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
function fechaCorta(iso) { const [y, m, d] = String(iso || "").split("-").map(Number); return y ? new Date(y, m - 1, d).toLocaleDateString("es-BO", { day: "numeric", month: "short" }) : ""; }
function estado(id, msg, tipo) { const s = $(id); s.textContent = msg; s.className = "status-msg show " + tipo; }
function limpiar(id) { $(id).className = "status-msg"; }

// ---------- Pestañas ----------
function verVista(v) {
  document.querySelectorAll(".tabs .tab").forEach(b => { const on = b.dataset.vista === v; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  document.querySelectorAll(".vista").forEach(s => s.classList.toggle("on", s.id === "vista-" + v));
  if (v === "campeones") cargarCampeones();
  if (v === "galeria") cargarGaleria();
  try { history.replaceState(null, "", "#" + v); } catch (e) {}
}

// ---------- Formulario de pilotos ----------
function filaPiloto(valor) {
  const box = $("pilotos");
  if (box.children.length >= 8) return;
  const f = el("div", "piloto-fila");
  f.appendChild(el("b", null, "P" + (box.children.length + 1)));
  const inp = el("input"); inp.maxLength = 24; inp.placeholder = "Nombre o apodo"; inp.value = valor || ""; inp.autocomplete = "off";
  f.appendChild(inp);
  const q = el("button", "quitar", "✕"); q.type = "button"; q.setAttribute("aria-label", "Quitar piloto");
  q.addEventListener("click", () => { if (box.children.length > 2) { f.remove(); numerar(); } });
  f.appendChild(q);
  box.appendChild(f); numerar();
}
function numerar() {
  [...$("pilotos").children].forEach((f, i) => { f.querySelector("b").textContent = "P" + (i + 1); f.querySelector("input").setAttribute("aria-label", "Piloto " + (i + 1)); });
  $("mas-piloto").classList.toggle("hidden", $("pilotos").children.length >= 8);
}

async function crear(e) {
  e.preventDefault(); limpiar("estado-reto");
  const pilotos = [...document.querySelectorAll("#pilotos input")].map(i => i.value.trim()).filter(Boolean);
  const premio = $("premio").value.trim();
  if (pilotos.length < 2) return estado("estado-reto", "Escribe al menos 2 pilotos.", "error");
  if (premio.length < 3) return estado("estado-reto", "Escribe qué se juegan.", "error");
  const btn = $("btn-reto"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Creando…';
  try {
    const r = await apiCall("crearReto", { pilotos, premio });
    const mis = leer("gk_retos", []); mis.unshift({ codigo: r.codigo, creado: Date.now() }); guardar("gk_retos", mis.slice(0, 20));
    $("codigo-nuevo").textContent = r.codigo;
    const txt = "🏁 ¡Reto en GO KART SPORT BAR!\n🏎️ " + r.pilotos.join(" vs ") + "\n🎯 " + r.premio + "\n🔖 Código: " + r.codigo +
      "\nMira el resultado en la app: " + location.href.split("#")[0].replace(/[^/]*$/, "") + "retos.html?reto=" + r.codigo;
    $("compartir-reto").href = "https://wa.me/?text=" + encodeURIComponent(txt);
    $("reto-creado").classList.remove("hidden");
    $("reto-creado").scrollIntoView({ behavior: "smooth", block: "center" });
    $("form-reto").reset(); $("pilotos").innerHTML = ""; filaPiloto(); filaPiloto();
    pintarMisRetos();
  } catch (err) { estado("estado-reto", err.message, "error"); }
  finally { btn.disabled = false; btn.textContent = "Crear reto"; }
}

// ---------- Mis retos y podio ----------
function tarjetaReto(r) {
  const t = el("div", "tarjeta reto" + (r.estado === "TERMINADO" ? " terminado" : ""));
  const cab = el("div", "reto-cab"); cab.appendChild(el("b", null, r.codigo));
  const est = { ABIERTO: ["badge-pendiente", "En pista"], TERMINADO: ["badge-confirmada", "Terminado"], CANCELADO: ["badge-cancelada", "Cancelado"] }[r.estado] || ["", r.estado];
  cab.appendChild(el("span", "badge " + est[0], est[1])); t.appendChild(cab);
  t.appendChild(el("p", null, r.pilotos.join(" · ") + " — " + r.premio + (r.fecha ? " · " + fechaCorta(r.fecha) : "")));
  if (r.estado === "TERMINADO" && r.resultados.length) {
    const podio = el("div", "podio");
    [1, 0, 2].forEach(i => {
      const x = r.resultados[i]; if (!x) { podio.appendChild(el("div")); return; }
      const d = el("div", "p" + (i + 1)); d.appendChild(el("i", null, ["🏆", "🥈", "🥉"][i]));
      d.appendChild(el("strong", null, x.piloto)); d.appendChild(el("span", null, "P" + x.pos + (x.vueltaTxt ? " · " + x.vueltaTxt : "")));
      podio.appendChild(d);
    });
    t.appendChild(podio);
    if (r.resultados.length > 3) {
      const ul = el("ul", "resto");
      r.resultados.slice(3).forEach(x => { const li = el("li"); li.appendChild(el("span", null, "P" + x.pos + " " + x.piloto)); li.appendChild(el("span", null, x.vueltaTxt || "")); ul.appendChild(li); });
      t.appendChild(ul);
    }
    const ultimo = r.resultados[r.resultados.length - 1];
    t.appendChild(el("div", "veredicto", "🏁 Ganó " + r.resultados[0].piloto + ". Premio: " + r.premio + " (último: " + ultimo.piloto + ")."));
  } else if (r.estado === "ABIERTO") {
    t.appendChild(el("p", null, "Cuando terminen, el personal carga los resultados y aquí aparece el podio."));
  }
  return t;
}

async function pintarMisRetos() {
  const box = $("mis-retos"); const mis = leer("gk_retos", []);
  const pedido = new URLSearchParams(location.search).get("reto");
  const codigos = [...new Set([pedido, ...mis.map(m => m.codigo)].filter(Boolean).map(c => c.toUpperCase()))].slice(0, 10);
  if (!codigos.length) { box.innerHTML = ""; return; }
  box.innerHTML = ""; const h = el("h2", "section-title mt-2"); h.innerHTML = "Mis <span>retos</span>"; box.appendChild(h);
  for (const c of codigos) {
    const lugar = el("div"); lugar.appendChild(el("p", "cargando", "Cargando " + c + "…")); box.appendChild(lugar);
    apiCall("verReto", { codigo: c }).then(r => { lugar.innerHTML = ""; lugar.appendChild(tarjetaReto(r)); })
      .catch(() => { lugar.remove(); });
  }
}

async function buscar() {
  const c = $("buscar-codigo").value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (c.length !== 5) return;
  const mis = leer("gk_retos", []);
  if (!mis.some(m => m.codigo === c)) { mis.unshift({ codigo: c, creado: Date.now() }); guardar("gk_retos", mis.slice(0, 20)); }
  $("buscar-codigo").value = "";
  await pintarMisRetos();
  $("mis-retos").scrollIntoView({ behavior: "smooth" });
}

// ---------- Campeones ----------
let campeonesCargados = false;
async function cargarCampeones() {
  if (campeonesCargados) return;
  const box = $("campeones");
  try {
    const d = await apiCall("getCampeones"); campeonesCargados = true; box.innerHTML = "";
    const mesTxt = new Date(d.mes + "-15").toLocaleDateString("es-BO", { month: "long", year: "numeric" });
    const c = el("div", "tarjeta campeon");
    c.appendChild(el("div", "copa", "🏆")); c.appendChild(el("small", null, "Campeón de " + mesTxt));
    if (d.campeonMes) {
      c.appendChild(el("b", null, d.campeonMes.piloto));
      c.appendChild(el("p", null, d.campeonMes.victorias + (d.campeonMes.victorias === 1 ? " reto ganado" : " retos ganados") + (d.campeonMes.mejorTxt ? " · mejor vuelta " + d.campeonMes.mejorTxt : "")));
    } else { c.appendChild(el("b", null, "¿Serás tú?")); c.appendChild(el("p", null, "Todavía nadie ganó un reto este mes.")); }
    box.appendChild(c);
    box.appendChild(tabla("Vueltas más rápidas", d.vueltas.map((v, i) => [i + 1, v.piloto + " · " + fechaCorta(v.fecha), v.vueltaTxt]), "Aún no hay tiempos cargados."));
    if (d.tablaMes.length > 1) box.appendChild(tabla("Ranking del mes", d.tablaMes.map((v, i) => [i + 1, v.piloto, v.victorias + (v.victorias === 1 ? " victoria" : " victorias")]), ""));
    box.appendChild(tabla("Últimos retos", d.historial.map(h => ["🏁", h.ganador + " ganó · " + h.premio, fechaCorta(h.fecha)]), "Aún no hay retos terminados."));
  } catch (err) { box.innerHTML = ""; box.appendChild(el("p", "vacio", "No se pudieron cargar los campeones. " + err.message)); }
}
function tabla(titulo, filas, vacio) {
  const t = el("div", "tarjeta"); t.appendChild(el("h2", null, titulo));
  if (!filas.length) { t.appendChild(el("p", "vacio", vacio)); return t; }
  const tb = el("table", "tabla");
  filas.forEach(f => { const tr = el("tr"); f.forEach(x => tr.appendChild(el("td", null, String(x)))); tb.appendChild(tr); });
  t.appendChild(tb); return t;
}

// ---------- Galería ----------
let galeriaCargada = false;
async function cargarGaleria() {
  if (galeriaCargada) return;
  const g = $("galeria"); g.innerHTML = '<p class="cargando" style="grid-column:1/-1"><span class="spinner"></span></p>';
  try {
    const fotos = await apiCall("getFotos"); galeriaCargada = true; g.innerHTML = "";
    if (!fotos.length) { g.appendChild(el("p", "vacio", "Todavía no hay fotos publicadas. ¡Sube la primera!")); g.firstChild.style.gridColumn = "1/-1"; return; }
    fotos.forEach(f => {
      const fig = el("figure"); const im = el("img"); im.src = f.mini; im.alt = "Foto de " + f.nombre; im.loading = "lazy";
      im.onerror = () => fig.remove();
      fig.appendChild(im); const cap = el("figcaption"); cap.appendChild(el("b", null, f.nombre)); if (f.texto) cap.appendChild(document.createTextNode(f.texto));
      fig.appendChild(cap); fig.addEventListener("click", () => { $("foto-grande").src = f.foto; $("foto-grande").alt = "Foto de " + f.nombre; $("foto-grande-txt").textContent = f.nombre + (f.texto ? " — " + f.texto : ""); $("hoja-foto").classList.add("on"); });
      g.appendChild(fig);
    });
  } catch (err) { g.innerHTML = ""; g.appendChild(el("p", "vacio", "No se pudo cargar la galería. " + err.message)); }
}

// Achica la foto en el teléfono antes de enviarla
function achicar(archivo, lado, calidad) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(archivo), im = new Image();
    im.onload = () => {
      const k = Math.min(1, lado / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", calidad));
    };
    im.onerror = () => { URL.revokeObjectURL(url); mal(new Error("No se pudo leer la foto. Prueba con otra.")); };
    im.src = url;
  });
}

async function enviarFoto(e) {
  e.preventDefault(); limpiar("estado-foto");
  const nombre = $("foto-nombre").value.trim(), archivo = $("foto-archivo").files[0];
  if (nombre.length < 2) return estado("estado-foto", "Escribe tu nombre o apodo.", "error");
  if (!archivo || !/^image\//.test(archivo.type)) return estado("estado-foto", "Elige una foto.", "error");
  if (!$("foto-acepto").checked) return estado("estado-foto", "Marca la casilla para aceptar la publicación.", "error");
  const btn = $("btn-foto"); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Enviando…';
  try {
    const [imagen, mini] = await Promise.all([achicar(archivo, 1280, .82), achicar(archivo, 220, .6)]);
    const r = await apiCall("subirFoto", { nombre, texto: $("foto-texto").value.trim(), imagen, mini, acepto: true });
    estado("estado-foto", r.mensaje, "success");
    $("form-foto").reset(); $("foto-previa").style.display = "none";
    guardar("gk_apodo", nombre);
  } catch (err) { estado("estado-foto", err.message, "error"); }
  finally { btn.disabled = false; btn.textContent = "Enviar foto"; }
}

// ---------- Arranque ----------
document.addEventListener("DOMContentLoaded", () => {
  filaPiloto(leer("gk_apodo", "")); filaPiloto();
  try { const c = JSON.parse(localStorage.getItem("gk_cliente") || "null"); if (c && c.nombre && !leer("gk_apodo", "")) document.querySelector("#pilotos input").value = c.nombre.split(" ")[0]; } catch (e) {}
  $("foto-nombre").value = leer("gk_apodo", "");
  $("mas-piloto").addEventListener("click", () => { filaPiloto(); const ins = document.querySelectorAll("#pilotos input"); ins[ins.length - 1].focus(); });
  document.querySelectorAll("#sugerencias button").forEach(b => b.addEventListener("click", () => { $("premio").value = b.textContent; }));
  $("form-reto").addEventListener("submit", crear);
  $("btn-buscar").addEventListener("click", buscar);
  $("buscar-codigo").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); buscar(); } });
  $("form-foto").addEventListener("submit", enviarFoto);
  $("foto-archivo").addEventListener("change", () => {
    const f = $("foto-archivo").files[0], p = $("foto-previa");
    if (f && /^image\//.test(f.type)) { p.src = URL.createObjectURL(f); p.style.display = "block"; } else p.style.display = "none";
  });
  $("hoja-foto").addEventListener("click", e => { if (e.target.id === "hoja-foto" || e.target.hasAttribute("data-cerrar")) $("hoja-foto").classList.remove("on"); });
  document.querySelectorAll(".tabs .tab").forEach(b => b.addEventListener("click", () => verVista(b.dataset.vista)));
  const inicial = (location.hash || "").slice(1);
  verVista(["reto", "campeones", "galeria"].includes(inicial) ? inicial : "reto");
  pintarMisRetos();
});
