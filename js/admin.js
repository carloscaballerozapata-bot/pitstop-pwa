// ============================================================
// PITSTOP — admin.js  (Panel de administración)
// ============================================================

function $(id) { return document.getElementById(id); }
function getClave() { return sessionStorage.getItem("pitstop_admin_clave") || ""; }
function setClave(c) { sessionStorage.setItem("pitstop_admin_clave", c); }
function clearClave() { sessionStorage.removeItem("pitstop_admin_clave"); }

function showView(view) {
  $("login-view").classList.toggle("hidden", view !== "login");
  $("dashboard-view").classList.toggle("hidden", view !== "dashboard");
}

function showAdminStatus(msg, type) {
  const el = $("admin-status");
  el.textContent = msg;
  el.className = "status-msg show " + type;
  setTimeout(() => { el.className = "status-msg"; }, 5000);
}

// --- Login ---
function handleLogin(e) {
  e.preventDefault();
  const clave = $("clave-input").value.trim();
  if (!clave) return;
  setClave(clave);
  $("clave-input").value = "";
  loadDashboard();
}

// --- Dashboard ---
async function loadDashboard() {
  showView("dashboard");
  $("dashboard-content").innerHTML =
    '<div class="loading-overlay"><span class="spinner"></span> Cargando panel...</div>';

  try {
    const data = await apiCall("adminGetDashboard", { clave: getClave() });
    renderDashboard(data);
    cargarRetosAdmin(); cargarFotosAdmin();
  } catch (err) {
    if (err.message.includes("No autorizado")) {
      clearClave();
      showView("login");
      showAdminStatus("Clave incorrecta. Intenta de nuevo.", "error");
    } else {
      $("dashboard-content").innerHTML =
        '<p class="text-center text-muted mt-2">Error: ' + err.message + '</p>';
    }
  }
}

let ultimoDashboard = null;
let filtroTipo = "todas";   // todas · mesa · carrera

function hoyISO() { const d = new Date(), p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }

// Ocupación de mesas de hoy: mesas con al menos una reserva activa hoy
function htmlOcupacion(data) {
  const mesas = data.mesas || [];
  if (!mesas.length) return "";
  const hoy = hoyISO();
  const activas = data.reservations.filter(r => r.tipo === "mesa" && r.fecha === hoy && r.estado !== "CANCELADA");
  const ocupadas = new Set(activas.map(r => r.mesaId));
  const nOc = mesas.filter(m => ocupadas.has(m.id)).length, nLib = mesas.length - nOc;
  const pct = n => (n / mesas.length * 100).toFixed(1) + "%";
  let h = '<div class="admin-section"><h3>🍔 Ocupación de mesas hoy</h3>';
  h += '<div class="ocupa-barra"><span style="width:' + pct(nLib) + ';background:var(--green)"></span><span style="width:' + pct(nOc) + ';background:var(--accent)"></span></div>';
  h += '<div class="ocupa-leyenda"><span><i style="background:var(--green)"></i>Libres <b>' + nLib + '</b></span><span><i style="background:var(--accent)"></i>Con reserva <b>' + nOc + '</b></span><span>Total <b>' + mesas.length + '</b></span></div>';
  h += '<p class="text-muted text-sm mt-1">' + activas.length + ' reserva(s) de mesa hoy. Las mesas se editan en la hoja "Mesas".</p></div>';
  return h;
}

function renderDashboard(data) {
  ultimoDashboard = data;
  const { stats } = data;
  const reservations = data.reservations.filter(r => filtroTipo === "todas" || (r.tipo || "carrera") === filtroTipo);

  let html = '';

  // Stats
  html += '<div class="stats-grid">';
  html += '<div class="stat-card"><div class="num">' + stats.total + '</div><div class="label">Total</div></div>';
  html += '<div class="stat-card pendientes"><div class="num">' + stats.pendientes + '</div><div class="label">Pendientes</div></div>';
  html += '<div class="stat-card confirmadas"><div class="num">' + stats.confirmadas + '</div><div class="label">Confirmadas</div></div>';
  html += '<div class="stat-card canceladas"><div class="num">' + stats.canceladas + '</div><div class="label">Canceladas</div></div>';
  html += '</div>';

  html += htmlOcupacion(data);

  // Reservations table
  html += '<div class="admin-section"><h3>🏁 Reservas</h3>';
  html += '<div class="filtro-tipo">' + [["todas", "Todas"], ["mesa", "🍔 Mesas"], ["carrera", "🏎️ Carreras"]].map(([k, t]) =>
    '<button type="button" class="tab' + (filtroTipo === k ? ' on' : '') + '" data-filtro="' + k + '">' + t + '</button>').join("") + '</div>';
  if (reservations.length === 0) {
    html += '<p class="text-muted text-center">No hay reservas aún.</p>';
  } else {
    html += '<div class="table-scroll"><table class="reservations-table">';
    html += '<thead><tr><th>Fecha</th><th>Hora</th><th>Nombre</th><th>Tel</th><th>Reserva</th><th>#</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    reservations.forEach(r => {
      const badgeClass = r.estado === "PENDIENTE" ? "badge-pendiente" :
        r.estado === "CONFIRMADA" ? "badge-confirmada" : "badge-cancelada";
      html += '<tr>';
      html += '<td>' + esc(r.fecha) + '</td>';
      html += '<td>' + esc(r.hora) + '</td>';
      html += '<td>' + esc(r.nombre) + '</td>';
      html += '<td>' + esc(r.telefono) + '</td>';
      html += '<td>' + (r.tipo === "mesa" ? "🍔 " : "🏎️ ") + esc(r.servicio) + (r.observaciones ? '<br><small class="text-muted">' + esc(r.observaciones) + '</small>' : '') + '</td>';
      html += '<td>' + r.participantes + '</td>';
      html += '<td><span class="badge ' + badgeClass + '">' + esc(r.estado) + '</span></td>';
      html += '<td>';
      if (r.estado !== "CONFIRMADA") html += '<button class="btn btn-sm btn-confirm" onclick="updateReservation(\'' + r.id + '\',\'CONFIRMADA\')">✓</button> ';
      if (r.estado !== "CANCELADA") html += '<button class="btn btn-sm btn-cancel" onclick="updateReservation(\'' + r.id + '\',\'CANCELADA\')">✕</button> ';
      if (r.estado !== "PENDIENTE") html += '<button class="btn btn-sm btn-pending" onclick="updateReservation(\'' + r.id + '\',\'PENDIENTE\')">⟲</button>';
      html += '</td></tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '</div>';

  $("dashboard-content").innerHTML = html;
  document.querySelectorAll("[data-filtro]").forEach(b => b.addEventListener("click", () => cambiarFiltro(b.dataset.filtro)));
}

function cambiarFiltro(t) { filtroTipo = t; if (ultimoDashboard) renderDashboard(ultimoDashboard); }

function esc(s) {
  const d = document.createElement("div");
  d.textContent = String(s || "");
  return d.innerHTML;
}

// --- Acciones ---
async function updateReservation(id, estado) {
  try {
    await apiCall("adminUpdateReservation", { id, nuevoEstado: estado, clave: getClave() });
    loadDashboard();
  } catch (err) {
    if (err.message.includes("No autorizado")) { clearClave(); showView("login"); return; }
    showAdminStatus(err.message, "error");
  }
}

async function handleBlock(e) {
  e.preventDefault();
  const data = {
    fecha: $("block-fecha").value,
    inicio: $("block-inicio").value,
    fin: $("block-fin").value,
    motivo: $("block-motivo").value.trim() || "Bloqueo operativo",
    clave: getClave()
  };
  if (!data.fecha || !data.inicio || !data.fin) {
    showAdminStatus("Completa fecha, desde y hasta.", "error");
    return;
  }
  try {
    await apiCall("adminAddBlock", data);
    showAdminStatus("Bloqueo creado.", "success");
    $("block-form").reset();
  } catch (err) {
    if (err.message.includes("No autorizado")) { clearClave(); showView("login"); return; }
    showAdminStatus(err.message, "error");
  }
}

async function handleSettings(e) {
  e.preventDefault();
  const data = {
    businessName: $("set-name").value.trim(),
    openingHour: $("set-open").value,
    closingHour: $("set-close").value,
    slotMinutes: Number($("set-slot").value),
    clave: getClave()
  };
  try {
    await apiCall("adminSaveSettings", data);
    showAdminStatus("Configuración guardada.", "success");
  } catch (err) {
    if (err.message.includes("No autorizado")) { clearClave(); showView("login"); return; }
    showAdminStatus(err.message, "error");
  }
}

function handleLogout() {
  clearClave();
  showView("login");
}

// --- Boot ---
document.addEventListener("DOMContentLoaded", () => {
  $("login-form").addEventListener("submit", handleLogin);
  $("block-form").addEventListener("submit", handleBlock);
  $("settings-form").addEventListener("submit", handleSettings);
  $("btn-logout").addEventListener("click", handleLogout);
  $("btn-refresh").addEventListener("click", loadDashboard);

  if (getClave()) {
    loadDashboard();
  } else {
    showView("login");
  }
});

// ============================================================
// Retos en pista y fotos por aprobar
// ============================================================
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function noAutorizado(err) { if (String(err.message).includes("No autorizado")) { clearClave(); showView("login"); return true; } return false; }

async function cargarRetosAdmin() {
  const box = $("retos-admin");
  try {
    const retos = await apiCall("adminListarRetos", { clave: getClave() });
    box.innerHTML = "";
    if (!retos.length) { box.appendChild(el("p", "text-muted text-center", "No hay retos abiertos.")); return; }
    retos.forEach(r => box.appendChild(formResultado(r)));
  } catch (err) { if (!noAutorizado(err)) box.textContent = "Error: " + err.message; }
}

function formResultado(r) {
  const f = el("form", "reto-admin");
  const cab = el("div", "reto-admin-cab");
  cab.appendChild(el("b", null, r.codigo)); cab.appendChild(el("span", "text-muted text-sm", r.premio));
  f.appendChild(cab);
  r.pilotos.forEach((p, i) => {
    const fila = el("div", "reto-admin-fila");
    fila.appendChild(el("span", null, p));
    const pos = el("select"); pos.setAttribute("aria-label", "Posición de " + p); pos.dataset.piloto = p;
    r.pilotos.forEach((_, j) => pos.appendChild(new Option("P" + (j + 1), j + 1)));
    pos.value = i + 1;
    const v = el("input"); v.placeholder = "Vuelta"; v.inputMode = "decimal"; v.maxLength = 8; v.setAttribute("aria-label", "Mejor vuelta de " + p);
    fila.appendChild(pos); fila.appendChild(v); f.appendChild(fila);
  });
  const acc = el("div", "reto-admin-acc");
  const ok = el("button", "btn btn-sm btn-confirm", "Guardar resultado"); ok.type = "submit";
  const no = el("button", "btn btn-sm btn-outline", "Cancelar reto"); no.type = "button";
  acc.appendChild(ok); acc.appendChild(no); f.appendChild(acc);
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const resultados = [...f.querySelectorAll(".reto-admin-fila")].map(x => ({ piloto: x.querySelector("select").dataset.piloto, pos: Number(x.querySelector("select").value), vuelta: x.querySelector("input").value.trim() }));
    ok.disabled = true;
    try { const res = await apiCall("adminCargarResultado", { clave: getClave(), codigo: r.codigo, resultados }); showAdminStatus("Resultado guardado. Ganó " + res.ganador + ".", "success"); cargarRetosAdmin(); }
    catch (err) { if (!noAutorizado(err)) showAdminStatus(err.message, "error"); ok.disabled = false; }
  });
  no.addEventListener("click", async () => {
    if (!confirm("¿Cancelar el reto " + r.codigo + "?")) return;
    try { await apiCall("adminCancelarReto", { clave: getClave(), codigo: r.codigo }); cargarRetosAdmin(); }
    catch (err) { if (!noAutorizado(err)) showAdminStatus(err.message, "error"); }
  });
  return f;
}

async function cargarFotosAdmin() {
  const box = $("fotos-admin");
  try {
    const fotos = await apiCall("adminListarFotos", { clave: getClave() });
    box.innerHTML = "";
    if (!fotos.length) { box.appendChild(el("p", "text-muted text-center", "No hay fotos por revisar.")); return; }
    const g = el("div", "fotos-admin-grid");
    fotos.forEach(f => {
      const c = el("div", "foto-admin");
      if (f.mini) { const im = el("img"); im.src = f.mini; im.alt = "Foto de " + f.nombre; c.appendChild(im); } else c.appendChild(el("div", "foto-sin", "Sin vista previa: revísala en Drive"));
      c.appendChild(el("b", null, f.nombre)); if (f.texto) c.appendChild(el("p", "text-muted text-sm", f.texto));
      const acc = el("div", "reto-admin-acc");
      const si = el("button", "btn btn-sm btn-confirm", "Aprobar"), no = el("button", "btn btn-sm btn-cancel", "Rechazar");
      si.type = no.type = "button";
      const moderar = async estado => { si.disabled = no.disabled = true;
        try { await apiCall("adminModerarFoto", { clave: getClave(), id: f.id, estado }); c.remove(); if (!g.children.length) cargarFotosAdmin(); }
        catch (err) { if (!noAutorizado(err)) showAdminStatus(err.message, "error"); si.disabled = no.disabled = false; } };
      si.addEventListener("click", () => moderar("APROBADA")); no.addEventListener("click", () => moderar("RECHAZADA"));
      acc.appendChild(si); acc.appendChild(no); c.appendChild(acc); g.appendChild(c);
    });
    box.appendChild(g);
  } catch (err) { if (!noAutorizado(err)) box.textContent = "Error: " + err.message; }
}
