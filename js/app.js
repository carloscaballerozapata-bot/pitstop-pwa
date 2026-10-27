// ============================================================
// GO KART SPORT BAR — app.js  (inicio + reservas)
// Usa apiCall() de api.js: getPublicAppData, getAvailability, createReservation
// ============================================================

let appData = null;          // {appName, services[], settings{openingHour, closingHour, slotMinutes}}
let selectedService = null;
let selectedHora = "";
let horasPedido = 0;         // descarta respuestas viejas si se cambia de fecha/servicio rápido

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const hoyStr = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const ahoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const aMin = h => { const m = /^(\d{1,2}):(\d{2})/.exec(h || ""); return m ? +m[1] * 60 + +m[2] : -1; };
function fechaLarga(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" });
}
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

// ---------- Pantalla de carga ----------
// Se muestra una vez por sesión; se cierra cuando llegan los datos (mínimo 1,2 s, máximo 6 s).
const splash = {
  t0: Date.now(), p: 0, timer: null,
  iniciar() {
    let visto = false;
    try { visto = sessionStorage.getItem("gk_splash") === "1"; sessionStorage.setItem("gk_splash", "1"); } catch (e) {}
    if (visto) { this.cerrar(true); return; }
    this.timer = setInterval(() => { this.p = Math.min(90, this.p + (90 - this.p) * .12 + 1); this.pintar(); }, 120);
    setTimeout(() => this.listo(), 6000);
  },
  pintar() { const b = $("splash-progreso"); if (b) b.style.width = this.p + "%"; },
  listo() {
    if (!this.timer) return;
    clearInterval(this.timer); this.timer = null; this.p = 100; this.pintar();
    setTimeout(() => this.cerrar(), Math.max(350, 1200 - (Date.now() - this.t0)));
  },
  cerrar(ya) {
    const s = $("splash"); if (!s) return;
    if (ya) { s.remove(); return; }
    s.classList.add("fuera"); setTimeout(() => s.remove(), 500);
  }
};

// ---------- Carga inicial ----------
async function initApp() {
  try {
    appData = await apiCall("getPublicAppData");
    renderServices(appData.services || []);
    populateServiceSelect(appData.services || []);
    pintarEstado(appData.settings || {});
    aplicarZona();
  } catch (err) {
    const c = $("services-container");
    c.innerHTML = "";
    c.appendChild(el("p", "text-center text-muted", "No se pudieron cargar las experiencias. " + err.message));
    $("servicio").innerHTML = "";
    $("servicio").appendChild(new Option("No disponible — recarga la página", ""));
    console.error("initApp:", err);
  } finally {
    splash.listo();
  }
}

function pintarEstado(s) {
  const pill = $("estado");
  const abre = aMin(s.openingHour), cierra = aMin(s.closingHour);
  if (abre < 0 || cierra < 0) return;
  const abierto = ahoraMin() >= abre && ahoraMin() < cierra;
  pill.classList.remove("hidden");
  pill.classList.toggle("cerrado", !abierto);
  pill.querySelector("span").textContent = abierto ? "Abierto · hasta " + s.closingHour : "Abre " + s.openingHour;
}

// ---------- Experiencias ----------
function renderServices(services) {
  const c = $("services-container");
  c.innerHTML = "";
  if (!services.length) { c.appendChild(el("p", "text-center text-muted", "No hay experiencias disponibles por ahora.")); return; }
  services.forEach(s => {
    const card = el("article", "service-card");
    card.appendChild(el("h3", null, s.nombre));
    if (s.descripcion) card.appendChild(el("p", null, s.descripcion));
    const meta = el("div", "service-meta");
    meta.appendChild(el("span", null, "⏱ " + s.duracionMin + " min"));
    meta.appendChild(el("span", null, "👥 Hasta " + s.capacidad));
    meta.appendChild(el("span", "precio", s.precio > 0 ? "Bs " + s.precio : "Consultar precio"));
    card.appendChild(meta);
    const b = el("button", "btn btn-ghost btn-sm", "Reservar esta experiencia ↗");
    b.type = "button";
    b.addEventListener("click", () => { $("servicio").value = s.id; onServiceChange(); $("reservar").scrollIntoView({ behavior: "smooth" }); });
    card.appendChild(b);
    c.appendChild(card);
  });
}

function populateServiceSelect(services) {
  const sel = $("servicio");
  sel.innerHTML = "";
  sel.appendChild(new Option("Elige una experiencia", ""));
  services.forEach(s => sel.appendChild(new Option(s.nombre + (s.precio > 0 ? " · Bs " + s.precio : ""), s.id)));
}

// ---------- Formulario ----------
function onServiceChange() {
  const id = $("servicio").value;
  selectedService = appData && id ? appData.services.find(s => s.id === id) : null;
  const max = selectedService ? selectedService.capacidad : 10;
  const inp = $("participantes");
  inp.max = max;
  if (+inp.value > max) inp.value = max;
  $("cupo-ayuda").textContent = selectedService ? "Máximo " + max + " por horario en esta experiencia." : "";
  loadAvailability();
}

function vacioHoras(txt) {
  const box = $("horas"); box.innerHTML = "";
  box.appendChild(el("div", "chips-vacio", txt));
}

async function loadAvailability() {
  selectedHora = "";
  const fecha = $("fecha").value, servicioId = $("servicio").value;
  if (!fecha || !servicioId) { vacioHoras("Elige la experiencia y la fecha para ver los horarios."); return; }
  const pedido = ++horasPedido;
  vacioHoras("Buscando horarios libres…");
  try {
    const slots = await apiCall("getAvailability", { fecha, servicioId });
    if (pedido !== horasPedido) return;
    renderHoras(slots || [], fecha);
  } catch (err) {
    if (pedido === horasPedido) vacioHoras("No se pudieron cargar los horarios. " + err.message);
  }
}

function renderHoras(slots, fecha) {
  const box = $("horas"); box.innerHTML = "";
  const esHoy = fecha === hoyStr(), ya = ahoraMin();
  const visibles = slots.filter(s => !(esHoy && aMin(s.hora) <= ya));   // hoy: no se muestran horas que ya pasaron
  if (!visibles.length) { vacioHoras(slots.length ? "Ya no quedan horarios para hoy. Prueba otra fecha." : "No hay horarios ese día."); return; }
  const pedidos = +$("participantes").value || 1;
  visibles.forEach(s => {
    const b = el("button", "chip-hora");
    b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    b.dataset.hora = s.hora; b.dataset.restantes = s.restantes;
    b.appendChild(el("b", null, s.hora));
    const alcanza = s.disponible && s.restantes >= pedidos;
    b.appendChild(el("small", null, !s.disponible ? "Lleno" : !alcanza ? "Solo " + s.restantes : s.restantes <= 3 ? "Quedan " + s.restantes : s.restantes + " libres"));
    if (s.disponible && s.restantes <= 3) b.classList.add("pocos");
    b.disabled = !alcanza;
    b.addEventListener("click", () => elegirHora(b));
    box.appendChild(b);
  });
}

function elegirHora(b) {
  document.querySelectorAll(".chip-hora.on").forEach(x => { x.classList.remove("on"); x.setAttribute("aria-checked", "false"); });
  b.classList.add("on"); b.setAttribute("aria-checked", "true");
  selectedHora = b.dataset.hora;
  hideStatus();
}

function cambiarParticipantes(delta) {
  const inp = $("participantes"), max = +inp.max || 10;
  inp.value = Math.max(1, Math.min(max, (+inp.value || 1) + delta));
  onParticipantesChange();
}
function onParticipantesChange() {
  // los chips con menos lugares que los pedidos se deshabilitan
  const n = +$("participantes").value || 1;
  document.querySelectorAll(".chip-hora").forEach(b => {
    const r = +b.dataset.restantes, alcanza = r >= n && !/Lleno/.test(b.textContent);
    b.disabled = !alcanza;
    if (!alcanza && b.classList.contains("on")) { b.classList.remove("on"); selectedHora = ""; }
  });
}

function showStatus(msg, type) {
  const s = $("status-msg");
  s.textContent = msg; s.className = "status-msg show " + type;
  s.scrollIntoView({ behavior: "smooth", block: "center" });
}
function hideStatus() { $("status-msg").className = "status-msg"; }

async function submitReservation(e) {
  e.preventDefault();
  hideStatus();
  const data = {
    nombre: $("nombre").value.trim(),
    telefono: $("telefono").value.trim(),
    email: $("email").value.trim(),
    servicioId: $("servicio").value,
    fecha: $("fecha").value,
    hora: selectedHora,
    participantes: Number($("participantes").value),
    observaciones: $("observaciones").value.trim()
  };
  if (!data.servicioId) return showStatus("Elige una experiencia.", "error");
  if (!data.fecha) return showStatus("Elige la fecha.", "error");
  if (!data.hora) return showStatus("Toca un horario disponible.", "error");
  if (data.nombre.length < 2) return showStatus("Escribe tu nombre completo.", "error");
  if (data.telefono.replace(/\D/g, "").length < 7) return showStatus("Escribe un número de WhatsApp válido.", "error");

  const btn = $("btn-submit");
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Enviando…';
  try {
    const r = await apiCall("createReservation", data);
    const reserva = Object.assign({}, data, { codigo: r.codigo, estado: r.estado || "PENDIENTE", servicio: selectedService ? selectedService.nombre : "", creada: Date.now() });
    guardarLocal(reserva);
    mostrarConfirmacion(reserva);
    $("reservation-form").reset();
    $("fecha").value = data.fecha;
    selectedService = null; vacioHoras("Elige la experiencia y la fecha para ver los horarios.");
  } catch (err) {
    showStatus(err.message, "error");
    if (/capacidad|horario/i.test(err.message)) loadAvailability();
  } finally {
    btn.disabled = false; btn.textContent = "Solicitar reserva ↗";
  }
}

// "Mi cuenta" muestra las reservas hechas desde este teléfono
function guardarLocal(r) {
  try {
    const lista = JSON.parse(localStorage.getItem("gk_reservas") || "[]");
    lista.unshift(r);
    localStorage.setItem("gk_reservas", JSON.stringify(lista.slice(0, 30)));
    localStorage.setItem("gk_cliente", JSON.stringify({ nombre: r.nombre, telefono: r.telefono, email: r.email }));
  } catch (e) {}
}
function precargarCliente() {
  try {
    const c = JSON.parse(localStorage.getItem("gk_cliente") || "null");
    if (!c) return;
    if (c.nombre) $("nombre").value = c.nombre;
    if (c.telefono) $("telefono").value = c.telefono;
    if (c.email) $("email").value = c.email;
  } catch (e) {}
}

// ---------- Confirmación ----------
function mostrarConfirmacion(r) {
  const datos = $("confirm-datos"); datos.innerHTML = "";
  [["Experiencia", r.servicio], ["Fecha", fechaLarga(r.fecha)], ["Hora", r.hora],
   ["Participantes", String(r.participantes)], ["Código", String(r.codigo || "").slice(0, 8).toUpperCase()]]
    .forEach(([k, v], i, a) => {
      const fila = el("div"); fila.appendChild(el("span", null, k));
      fila.appendChild(el("b", i === a.length - 1 ? "codigo" : null, v)); datos.appendChild(fila);
    });
  const texto = "🏁 ¡Reservé en GO KART SPORT BAR!\n" +
    "🏎️ " + r.servicio + " · " + r.participantes + (r.participantes === 1 ? " piloto" : " pilotos") + "\n" +
    "📅 " + fechaLarga(r.fecha) + " a las " + r.hora + "\n" +
    "🔖 Código: " + String(r.codigo || "").slice(0, 8).toUpperCase() + "\n" +
    "(pendiente de confirmación) ¿Te sumas?";
  $("btn-whatsapp").href = "https://wa.me/?text=" + encodeURIComponent(texto);
  const m = $("confirmacion");
  m.classList.add("on");
  lanzarConfeti();
  setTimeout(() => $("btn-whatsapp").focus(), 350);
}
function cerrarConfirmacion() { $("confirmacion").classList.remove("on"); $("confeti").innerHTML = ""; }
function lanzarConfeti() {
  const c = $("confeti"); c.innerHTML = "";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colores = ["#ff3545", "#ffdc35", "#f5f7fb", "#0b0d12"];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colores[i % colores.length];
    p.style.animationDelay = (Math.random() * .5) + "s";
    p.style.animationDuration = (1.2 + Math.random() * .9) + "s";
    c.appendChild(p);
  }
}

// ---------- Galería ----------
function initCarrusel() {
  const pista = $("carrusel"), puntos = $("carrusel-puntos");
  if (!pista) return;
  const items = [...pista.children];
  items.forEach((_, i) => {
    const b = document.createElement("button"); b.type = "button"; b.tabIndex = -1;
    b.addEventListener("click", () => ir(i)); puntos.appendChild(b);
  });
  const actual = () => Math.round(pista.scrollLeft / (items[0].offsetWidth + 11));
  const marcar = () => [...puntos.children].forEach((b, i) => b.classList.toggle("on", i === actual()));
  const ir = i => pista.scrollTo({ left: items[i].offsetLeft - (pista.offsetWidth - items[i].offsetWidth) / 2, behavior: "smooth" });
  pista.addEventListener("scroll", () => requestAnimationFrame(marcar), { passive: true });
  let pausa = false, auto;
  const programar = () => { clearInterval(auto); auto = setInterval(() => { if (!pausa && !document.hidden) ir((actual() + 1) % items.length); }, 5000); };
  ["touchstart", "mouseenter"].forEach(ev => pista.addEventListener(ev, () => { pausa = true; }, { passive: true }));
  ["touchend", "mouseleave"].forEach(ev => pista.addEventListener(ev, () => { pausa = false; programar(); }, { passive: true }));
  marcar(); programar();
}

// ---------- Arranque ----------
document.addEventListener("DOMContentLoaded", () => {
  splash.iniciar();
  $("fecha").min = hoyStr();
  $("fecha").value = hoyStr();
  precargarCliente();
  initApp();
  initCarrusel();
  $("servicio").addEventListener("change", onServiceChange);
  $("fecha").addEventListener("change", loadAvailability);
  $("menos").addEventListener("click", () => cambiarParticipantes(-1));
  $("mas").addEventListener("click", () => cambiarParticipantes(1));
  $("participantes").addEventListener("change", () => cambiarParticipantes(0));
  $("reservation-form").addEventListener("submit", submitReservation);
  $("btn-otra").addEventListener("click", () => { cerrarConfirmacion(); $("reservar").scrollIntoView({ behavior: "smooth" }); });
  $("confirmacion").addEventListener("click", e => { if (e.target.id === "confirmacion") cerrarConfirmacion(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarConfirmacion(); });
});

// Desde mapa.html (index.html?zona=Sport%20Bar#reservar): anota la zona y, si alguna experiencia
// la menciona en su nombre (ej. "Mesa Sport Bar"), la deja elegida.
function aplicarZona() {
  const zona = new URLSearchParams(location.search).get("zona");
  if (!zona) return;
  if (!$("observaciones").value) $("observaciones").value = "Zona: " + zona;
  const n = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const s = (appData.services || []).find(x => n(x.nombre).includes(n(zona)));
  if (s) { $("servicio").value = s.id; onServiceChange(); }
}
