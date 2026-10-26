// ============================================================
// PITSTOP — app.js  (Página pública de reservas)
// ============================================================

// --- Estado global ---
let appData = null;     // {appName, services[], settings{}}
let selectedService = null;

// --- Helpers ---
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function $(id) { return document.getElementById(id); }

function showStatus(msg, type) {
  const el = $("status-msg");
  el.textContent = msg;
  el.className = "status-msg show " + type;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (type === "success") setTimeout(() => { el.className = "status-msg"; }, 6000);
}

function hideStatus() {
  $("status-msg").className = "status-msg";
}

function setLoading(btnId, loading) {
  const btn = $(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.origText = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span> Enviando...';
  } else {
    btn.textContent = btn.dataset.origText || "SOLICITAR RESERVA ↗";
  }
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// --- Inicialización ---
async function initApp() {
  try {
    appData = await apiCall("getPublicAppData");
    renderServices(appData.services);
    populateServiceSelect(appData.services);
    $("fecha").min = todayStr();
  } catch (err) {
    $("services-container").innerHTML =
      '<p class="text-center text-muted">No se pudieron cargar los servicios. Recarga la página.</p>';
    console.error("initApp error:", err);
  }
}

// --- Renderizar servicios ---
function renderServices(services) {
  const container = $("services-container");
  if (!services || services.length === 0) {
    container.innerHTML = '<p class="text-center text-muted">No hay servicios disponibles.</p>';
    return;
  }
  container.innerHTML = "";
  services.forEach(s => {
    const card = document.createElement("div");
    card.className = "service-card";

    const h3 = document.createElement("h3");
    h3.textContent = s.nombre;
    card.appendChild(h3);

    const desc = document.createElement("p");
    desc.textContent = s.descripcion;
    card.appendChild(desc);

    const meta = document.createElement("div");
    meta.className = "service-meta";
    const dur = document.createElement("span");
    dur.textContent = "⏱ " + s.duracionMin + " min";
    const cap = document.createElement("span");
    cap.textContent = "👥 Hasta " + s.capacidad + " karts";
    const price = document.createElement("span");
    price.textContent = s.precio > 0 ? ("💰 Bs. " + s.precio) : "💰 Consultar";
    meta.appendChild(dur);
    meta.appendChild(cap);
    meta.appendChild(price);
    card.appendChild(meta);

    container.appendChild(card);
  });
}

// --- Llenar select de servicios ---
function populateServiceSelect(services) {
  const sel = $("servicio");
  sel.innerHTML = '<option value="">— Elige experiencia —</option>';
  services.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.nombre;
    opt.dataset.capacidad = s.capacidad;
    sel.appendChild(opt);
  });
}

// --- Eventos del formulario ---
function onServiceChange() {
  const sel = $("servicio");
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.value) {
    selectedService = appData.services.find(s => s.id === opt.value);
    $("participantes").max = selectedService ? selectedService.capacidad : 100;
    $("participantes").value = 1;
    loadAvailability();
  } else {
    selectedService = null;
    $("hora").innerHTML = '<option value="">— Selecciona fecha y servicio —</option>';
  }
}

function onDateChange() {
  if (selectedService) loadAvailability();
}

async function loadAvailability() {
  const fecha = $("fecha").value;
  const servicioId = $("servicio").value;
  if (!fecha || !servicioId) return;

  const sel = $("hora");
  sel.innerHTML = '<option value="">Cargando...</option>';
  sel.disabled = true;

  try {
    const slots = await apiCall("getAvailability", { fecha, servicioId });
    sel.innerHTML = '<option value="">— Elige horario —</option>';
    if (!slots || slots.length === 0) {
      sel.innerHTML = '<option value="">No hay horarios disponibles</option>';
    } else {
      slots.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.hora;
        opt.textContent = s.hora + (s.disponible ? (" — " + s.restantes + " lugar" + (s.restantes !== 1 ? "es" : "")) : " — LLENO");
        opt.disabled = !s.disponible;
        sel.appendChild(opt);
      });
    }
  } catch (err) {
    sel.innerHTML = '<option value="">Error al cargar horarios</option>';
    console.error("loadAvailability:", err);
  } finally {
    sel.disabled = false;
  }
}

async function submitReservation(e) {
  e.preventDefault();
  hideStatus();
  setLoading("btn-submit", true);

  const data = {
    nombre: $("nombre").value.trim(),
    telefono: $("telefono").value.trim(),
    email: $("email").value.trim(),
    servicioId: $("servicio").value,
    fecha: $("fecha").value,
    hora: $("hora").value,
    participantes: Number($("participantes").value),
    observaciones: $("observaciones").value.trim()
  };

  if (!data.nombre || !data.telefono || !data.servicioId || !data.fecha || !data.hora) {
    showStatus("Completa todos los campos obligatorios.", "error");
    setLoading("btn-submit", false);
    return;
  }

  try {
    const result = await apiCall("createReservation", data);
    showStatus("🏁 " + result.mensaje + " Código: " + result.codigo.slice(0, 8), "success");
    $("reservation-form").reset();
    $("hora").innerHTML = '<option value="">— Selecciona fecha y servicio —</option>';
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    setLoading("btn-submit", false);
  }
}

// --- Boot ---
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  $("servicio").addEventListener("change", onServiceChange);
  $("fecha").addEventListener("change", onDateChange);
  $("reservation-form").addEventListener("submit", submitReservation);
});
