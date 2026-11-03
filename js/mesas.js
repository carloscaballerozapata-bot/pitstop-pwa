// ============================================================
// GO KART SPORT BAR — mesas.js  (plano de mesas y reserva de mesa)
// Usa apiCall() de api.js: getPublicAppData (mesas, horario) y getTableAvailability
// Las mesas se editan en la hoja "Mesas" (ID · Zona · Capacidad · Vista · Activa).
// ============================================================

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const hoyStr = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const ahoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const aMin = h => { const m = /(\d{1,2}):(\d{2})/.exec(h || ""); return m ? +m[1] * 60 + +m[2] : -1; };
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function fechaCorta(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-BO", { weekday: "short", day: "numeric", month: "short" });
}

// Foto de cada zona en el detalle de la mesa
const FOTO_ZONA = { "terraza": "./img/render-aereo.jpg", "sport bar": "./img/galeria-mural.jpg", "interior": "./img/render-pista.jpg" };
const fotoZona = z => FOTO_ZONA[String(z || "").toLowerCase()] || "./img/render-pista.jpg";

let mesas = [];            // [{id, zona, capacidad, vista}]
let disp = null;           // {horas:[{hora, bloqueada}], ocupadas:{hora:[ids]}}
let horaSel = "";
let mesaSel = null;
let pedido = 0;

// ---------- Dibujo de una mesa (con tantas sillas como capacidad) ----------
function svgMesa(cap) {
  const ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", "0 0 100 100"); s.setAttribute("aria-hidden", "true");
  const sillas = Math.max(1, Math.min(cap, 8)), r = 38;
  for (let i = 0; i < sillas; i++) {
    const a = (i / sillas) * Math.PI * 2 - Math.PI / 2, c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", 50 + Math.cos(a) * r); c.setAttribute("cy", 50 + Math.sin(a) * r); c.setAttribute("r", 9);
    c.setAttribute("fill", "none"); c.setAttribute("stroke", "currentColor"); c.setAttribute("stroke-width", "4");
    s.appendChild(c);
  }
  const t = document.createElementNS(ns, "circle");
  t.setAttribute("cx", 50); t.setAttribute("cy", 50); t.setAttribute("r", 22);
  t.setAttribute("fill", "currentColor"); t.setAttribute("fill-opacity", ".22"); t.setAttribute("stroke", "currentColor"); t.setAttribute("stroke-width", "4");
  s.appendChild(t);
  return s;
}

const ocupadaEn = (mesaId, hora) => !!(disp && (disp.ocupadas[hora] || []).includes(mesaId));
const horasVisibles = () => {
  if (!disp) return [];
  const esHoy = $("fecha").value === hoyStr(), ya = ahoraMin();
  return disp.horas.filter(h => !h.bloqueada && !(esHoy && aMin(h.hora) <= ya));
};

// ---------- Carga ----------
async function cargarMesas() {
  try {
    const data = await apiCall("getPublicAppData");
    mesas = data.mesas || [];
    if (!mesas.length) { vacio("Las reservas de mesa se activarán muy pronto."); return false; }
    const zonas = [...new Set(mesas.map(m => m.zona))];
    zonas.forEach(z => $("zona").appendChild(new Option(z, z)));
    const pedida = new URLSearchParams(location.search).get("zona");
    if (pedida) { const z = zonas.find(x => x.toLowerCase() === pedida.toLowerCase()); if (z) $("zona").value = z; }
    return true;
  } catch (err) { vacio("No se pudieron cargar las mesas. " + err.message); return false; }
}

async function cargarDisponibilidad() {
  const fecha = $("fecha").value; if (!fecha) return;
  const n = ++pedido;
  $("horas").innerHTML = '<div class="chips-vacio">Buscando horarios…</div>';
  try {
    const d = await apiCall("getTableAvailability", { fecha });
    if (n !== pedido) return;
    disp = d;
    const vis = horasVisibles();
    if (!vis.some(h => h.hora === horaSel)) horaSel = vis.length ? vis[0].hora : "";
    pintarHoras(); pintarPlano();
  } catch (err) {
    if (n === pedido) { $("horas").innerHTML = ""; $("horas").appendChild(el("div", "chips-vacio", "No se pudieron cargar los horarios. " + err.message)); }
  }
}

function vacio(txt) { const p = $("plano"); p.innerHTML = ""; p.appendChild(el("div", "vacio-plano", txt)); }

// ---------- Pintar ----------
function pintarHoras() {
  const box = $("horas"); box.innerHTML = "";
  const vis = horasVisibles();
  if (!vis.length) { box.appendChild(el("div", "chips-vacio", "No quedan horarios este día. Prueba otra fecha.")); return; }
  vis.forEach(h => {
    const libres = mesas.filter(m => !ocupadaEn(m.id, h.hora)).length;
    const b = el("button", "chip-hora" + (h.hora === horaSel ? " on" : ""));
    b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", h.hora === horaSel);
    b.appendChild(el("b", null, h.hora)); b.appendChild(el("small", null, libres ? libres + " libres" : "Lleno"));
    b.addEventListener("click", () => { horaSel = h.hora; pintarHoras(); pintarPlano(); });
    box.appendChild(b);
  });
}

function pintarPlano() {
  const p = $("plano"); p.innerHTML = "";
  if (!horaSel) { vacio("Elige otra fecha para ver las mesas."); return; }
  const filtro = $("zona").value;
  const zonas = [...new Set(mesas.map(m => m.zona))].filter(z => !filtro || z === filtro);
  zonas.forEach((z, i) => {
    const sec = el("div", "zona-plano");
    const lista = mesas.filter(m => m.zona === z);
    const libres = lista.filter(m => !ocupadaEn(m.id, horaSel)).length;
    const h = el("h3", null, z); h.appendChild(el("small", null, libres + "/" + lista.length + " libres")); sec.appendChild(h);
    const g = el("div", "mesas-grid");
    lista.forEach(m => {
      const oc = ocupadaEn(m.id, horaSel);
      const b = el("button", "mesa" + (oc ? " ocupada" : "") + (mesaSel && mesaSel.id === m.id ? " elegida" : ""));
      b.type = "button";
      b.setAttribute("aria-label", "Mesa " + m.id + ", " + m.capacidad + " personas, " + (oc ? "reservada" : "disponible"));
      b.appendChild(svgMesa(m.capacidad)); b.appendChild(el("span", "num", m.id));
      b.addEventListener("click", () => abrirMesa(m));
      g.appendChild(b);
    });
    sec.appendChild(g); p.appendChild(sec);
    if (i === 0 && zonas.length > 1) { const pista = el("div", "pista-deco", "PISTA"); pista.setAttribute("aria-hidden", "true"); p.appendChild(pista); }
  });
}

// ---------- Detalle de mesa ----------
function abrirMesa(m) {
  mesaSel = m;
  $("mesa-titulo").textContent = "Mesa " + m.id;
  $("mesa-cap").textContent = m.capacidad + (m.capacidad === 1 ? " persona" : " personas");
  $("mesa-zona").textContent = m.zona;
  $("mesa-vista").textContent = m.vista || "—";
  $("mesa-foto").style.backgroundImage = "url('" + fotoZona(m.zona) + "')";
  pintarHorasMesa();
  abrir("hoja-mesa");
  pintarPlano();
}

function pintarHorasMesa() {
  const m = mesaSel, box = $("mesa-horas"); box.innerHTML = "";
  const vis = horasVisibles().filter(h => !ocupadaEn(m.id, h.hora));
  // si la mesa está reservada a la hora elegida, se le propone su primer horario libre
  if (ocupadaEn(m.id, horaSel) && vis.length) horaSel = vis[0].hora;
  const libre = vis.length > 0;
  $("mesa-estado").textContent = libre ? "Disponible " + horaSel : "Sin horarios";
  $("mesa-estado").className = "pastilla " + (libre ? "libre" : "ocupada");
  if (!libre) { box.appendChild(el("div", "chips-vacio", "Esta mesa no tiene horarios libres ese día.")); $("btn-reservar-mesa").disabled = true; return; }
  $("btn-reservar-mesa").disabled = false;
  vis.forEach(h => {
    const b = el("button", "chip-hora" + (h.hora === horaSel ? " on" : ""));
    b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", h.hora === horaSel);
    b.appendChild(el("b", null, h.hora));
    b.addEventListener("click", () => { horaSel = h.hora; pintarHorasMesa(); pintarHoras(); pintarPlano(); });
    box.appendChild(b);
  });
}

// ---------- Confirmar ----------
function abrirConfirmar() {
  const m = mesaSel; if (!m || !horaSel) return;
  const d = $("conf-datos"); d.innerHTML = "";
  [["Mesa", m.id + " · " + m.zona], ["Fecha", fechaCorta($("fecha").value)], ["Hora", horaSel], ["Capacidad", "Hasta " + m.capacidad]]
    .forEach(([k, v]) => { const f = el("div"); f.appendChild(el("span", null, k)); f.appendChild(el("b", null, v)); d.appendChild(f); });
  const inp = $("personas"); inp.max = m.capacidad; inp.value = Math.min(Math.max(+inp.value || 2, 1), m.capacidad);
  hideStatus();
  cerrar("hoja-mesa"); abrir("hoja-confirmar");
}

function cambiarPersonas(delta) {
  const inp = $("personas"), max = +inp.max || 10;
  inp.value = Math.max(1, Math.min(max, (+inp.value || 1) + delta));
}

function showStatus(msg, type) { const s = $("status-msg"); s.textContent = msg; s.className = "status-msg show " + type; }
function hideStatus() { $("status-msg").className = "status-msg"; }

async function enviar(e) {
  e.preventDefault(); hideStatus();
  const m = mesaSel;
  const data = {
    mesaId: m.id, fecha: $("fecha").value, hora: horaSel,
    participantes: Number($("personas").value),
    nombre: $("nombre").value.trim(), telefono: $("telefono").value.trim(),
    observaciones: $("observaciones").value.trim()
  };
  if (data.nombre.length < 2) return showStatus("Escribe tu nombre completo.", "error");
  if (data.telefono.replace(/\D/g, "").length < 7) return showStatus("Escribe un número de WhatsApp válido.", "error");
  const btn = $("btn-enviar");
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Enviando…';
  try {
    const r = await apiCall("createReservation", data);
    const reserva = { nombre: data.nombre, telefono: data.telefono, fecha: data.fecha, hora: data.hora, participantes: data.participantes,
      servicio: "Mesa " + m.id + " · " + m.zona, codigo: r.codigo, estado: r.estado || "PENDIENTE", creada: Date.now() };
    guardarLocal(reserva);
    $("observaciones").value = "";
    cerrar("hoja-confirmar");
    mostrarEnviada(reserva);
    cargarDisponibilidad();
  } catch (err) {
    showStatus(err.message, "error");
    if (/reservada|disponible/i.test(err.message)) cargarDisponibilidad();
  } finally {
    btn.disabled = false; btn.textContent = "Enviar solicitud";
  }
}

function guardarLocal(r) {
  try {
    const lista = JSON.parse(localStorage.getItem("gk_reservas") || "[]");
    lista.unshift(r);
    localStorage.setItem("gk_reservas", JSON.stringify(lista.slice(0, 30)));
    const c = JSON.parse(localStorage.getItem("gk_cliente") || "{}");
    localStorage.setItem("gk_cliente", JSON.stringify(Object.assign(c, { nombre: r.nombre, telefono: r.telefono })));
  } catch (e) {}
}
function precargarCliente() {
  try {
    const c = JSON.parse(localStorage.getItem("gk_cliente") || "null");
    if (c && c.nombre) $("nombre").value = c.nombre;
    if (c && c.telefono) $("telefono").value = c.telefono;
  } catch (e) {}
}

function mostrarEnviada(r) {
  const d = $("ok-datos"); d.innerHTML = "";
  const cod = String(r.codigo || "").slice(0, 8).toUpperCase();
  [["Mesa", r.servicio.replace(/^Mesa /, "")], ["Fecha", fechaCorta(r.fecha)], ["Hora", r.hora], ["Personas", String(r.participantes)], ["Código", cod]]
    .forEach(([k, v], i, a) => { const f = el("div"); f.appendChild(el("span", null, k)); f.appendChild(el("b", i === a.length - 1 ? "codigo" : null, v)); d.appendChild(f); });
  const texto = "🏁 ¡Reservé mesa en GO KART SPORT BAR!\n🍔 " + r.servicio + " · " + r.participantes + " personas\n📅 " +
    fechaCorta(r.fecha) + " a las " + r.hora + "\n🔖 Código: " + cod + "\n(pendiente de confirmación) ¿Te sumas?";
  $("btn-whatsapp").href = "https://wa.me/?text=" + encodeURIComponent(texto);
  abrir("confirmacion"); lanzarConfeti();
}
function lanzarConfeti() {
  const c = $("confeti"); c.innerHTML = "";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colores = ["#ffd400", "#ff3545", "#f5f7fb", "#0b0d12"];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%"; p.style.background = colores[i % colores.length];
    p.style.animationDelay = (Math.random() * .5) + "s"; p.style.animationDuration = (1.2 + Math.random() * .9) + "s";
    c.appendChild(p);
  }
}

// ---------- Hojas ----------
function abrir(id) { $(id).classList.add("on"); }
function cerrar(id) { $(id).classList.remove("on"); if (id === "confirmacion") $("confeti").innerHTML = ""; }

// ---------- Arranque ----------
document.addEventListener("DOMContentLoaded", async () => {
  $("fecha").min = hoyStr(); $("fecha").value = hoyStr();
  precargarCliente();
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m || e.target.hasAttribute("data-cerrar")) { cerrar(m.id); if (m.id === "hoja-mesa") { mesaSel = null; pintarPlano(); } } });
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".modal.on").forEach(m => cerrar(m.id)); });
  $("fecha").addEventListener("change", () => { horaSel = ""; cargarDisponibilidad(); });
  $("zona").addEventListener("change", pintarPlano);
  $("btn-reservar-mesa").addEventListener("click", abrirConfirmar);
  $("menos").addEventListener("click", () => cambiarPersonas(-1));
  $("mas").addEventListener("click", () => cambiarPersonas(1));
  $("personas").addEventListener("change", () => cambiarPersonas(0));
  $("form-mesa").addEventListener("submit", enviar);
  if (await cargarMesas()) cargarDisponibilidad();
});
