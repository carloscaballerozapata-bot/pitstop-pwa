// ============================================================
// GO KART SPORT BAR — mapa.js  (zonas del circuito sobre la vista aérea)
// ============================================================

// Textos de cada zona: editar aquí.
const ZONAS = {
  pista: {
    titulo: "Pista", color: "",
    texto: "Circuito técnico con curvas cerradas, chicanes y una recta larga. Karts para adultos y grupos.",
    datos: ["🏁 Circuito técnico", "🪖 Casco incluido", "👥 Ideal para grupos"],
    acciones: [{ txt: "Reservar una carrera ↗", href: "./index.html?zona=Pista#reservar", principal: true }]
  },
  bar: {
    titulo: "Sport Bar", color: "amarilla",
    texto: "Burgers, snacks y bebidas mientras miras las carreras y los partidos en pantalla.",
    datos: ["🍔 Comida rápida", "📺 Pantallas", "🍺 Bebidas"],
    acciones: [{ txt: "Ver el menú", href: "./menu.html", principal: true },
               { txt: "Reservar para un grupo ↗", href: "./index.html?zona=Sport%20Bar#reservar" }]
  },
  terraza: {
    titulo: "Terraza", color: "amarilla",
    texto: "Mesas al aire libre con vista a toda la pista. El mejor lugar para cumpleaños y eventos.",
    datos: ["☀️ Al aire libre", "🎉 Eventos y cumpleaños", "👀 Vista a la pista"],
    acciones: [{ txt: "Reservar para un evento ↗", href: "./index.html?zona=Terraza#reservar", principal: true },
               { txt: "Ver el menú", href: "./menu.html" }]
  }
};

const $ = id => document.getElementById(id);
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

function mostrarZona(clave, centrar) {
  const z = ZONAS[clave]; if (!z) return;
  document.querySelectorAll(".zona").forEach(p => p.classList.toggle("on", p.dataset.zona === clave));
  document.querySelectorAll(".leyenda .tab").forEach(b => { const on = b.dataset.zona === clave; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  const box = $("info-zona"); box.innerHTML = ""; box.className = "info-zona " + z.color;
  const h = el("h2"); h.appendChild(el("i")); h.appendChild(document.createTextNode(z.titulo)); box.appendChild(h);
  box.appendChild(el("p", null, z.texto));
  const datos = el("div", "info-datos"); z.datos.forEach(d => datos.appendChild(el("span", null, d))); box.appendChild(datos);
  const acc = el("div", "info-acciones");
  z.acciones.forEach(a => { const l = el("a", "btn " + (a.principal ? "btn-primary" : "btn-ghost"), a.txt); l.href = a.href; acc.appendChild(l); });
  box.appendChild(acc);
  if (centrar) {   // en el celular el mapa es más ancho que la pantalla: lleva la zona a la vista
    const sc = $("mapa-scroll"), poly = document.querySelector('.zona[data-zona="' + clave + '"]');
    const r = poly.getBoundingClientRect(), rs = sc.getBoundingClientRect();
    sc.scrollBy({ left: r.left + r.width / 2 - (rs.left + rs.width / 2), behavior: centrar === "ya" ? "auto" : "smooth" });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".zona").forEach(p => {
    p.addEventListener("click", () => { mostrarZona(p.dataset.zona); $("info-zona").scrollIntoView({ behavior: "smooth", block: "nearest" }); });
    p.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); mostrarZona(p.dataset.zona); } });
  });
  document.querySelectorAll(".leyenda .tab").forEach(b => b.addEventListener("click", () => mostrarZona(b.dataset.zona, true)));
  const sc = $("mapa-scroll"), pedida = new URLSearchParams(location.search).get("zona");
  const ancho = sc.scrollWidth > sc.clientWidth + 2;
  if (!ancho) $("mapa-ayuda").classList.add("hidden");
  else if (!pedida) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
  mostrarZona(ZONAS[pedida] ? pedida : "pista", ancho && ZONAS[pedida] ? "ya" : false);   // zona pedida: centrada al abrir
  if (ancho) sc.addEventListener("pointerdown", () => $("mapa-ayuda").classList.add("hidden"), { once: true, passive: true });
});
