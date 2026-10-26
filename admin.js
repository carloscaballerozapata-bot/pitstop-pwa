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

function renderDashboard(data) {
  const { reservations, stats } = data;

  let html = '';

  // Stats
  html += '<div class="stats-grid">';
  html += '<div class="stat-card"><div class="num">' + stats.total + '</div><div class="label">Total</div></div>';
  html += '<div class="stat-card pendientes"><div class="num">' + stats.pendientes + '</div><div class="label">Pendientes</div></div>';
  html += '<div class="stat-card confirmadas"><div class="num">' + stats.confirmadas + '</div><div class="label">Confirmadas</div></div>';
  html += '<div class="stat-card canceladas"><div class="num">' + stats.canceladas + '</div><div class="label">Canceladas</div></div>';
  html += '</div>';

  // Reservations table
  html += '<div class="admin-section"><h3>🏁 Reservas</h3>';
  if (reservations.length === 0) {
    html += '<p class="text-muted text-center">No hay reservas aún.</p>';
  } else {
    html += '<div class="table-scroll"><table class="reservations-table">';
    html += '<thead><tr><th>Fecha</th><th>Hora</th><th>Nombre</th><th>Tel</th><th>Serv.</th><th>#</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
    reservations.forEach(r => {
      const badgeClass = r.estado === "PENDIENTE" ? "badge-pendiente" :
        r.estado === "CONFIRMADA" ? "badge-confirmada" : "badge-cancelada";
      html += '<tr>';
      html += '<td>' + esc(r.fecha) + '</td>';
      html += '<td>' + esc(r.hora) + '</td>';
      html += '<td>' + esc(r.nombre) + '</td>';
      html += '<td>' + esc(r.telefono) + '</td>';
      html += '<td>' + esc(r.servicio) + '</td>';
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
}

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
