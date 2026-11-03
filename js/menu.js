// ============================================================
// GO KART SPORT BAR — menu.js  (menú digital)
// Menú real (carta #01). Cada producto: { id, nombre, desc, emoji, foto?, etiqueta?,
//   opciones: [{ n: "Simple", precio: 40 }, ...], salsa?: true }
// Fotos: carpeta de Drive "GO KART SPORT BAR / Menú / <categoría>".
//   Si la foto se llama igual que un plato ("Burger Clásica.jpg"), le pone la foto a ese plato.
//   Si no existe, la agrega como plato nuevo: "Burger Picante - Simple 45 - Doble 55.jpg".
// ============================================================
const SALSAS = ["BBQ clásica", "Hot", "Miel y mostaza"];
const FOTO = n => "./img/menu/" + n + ".jpg";

const MENU_BASE = [
  { categoria: "Hamburguesas", emoji: "🍔", productos: [
    { id: "burger-clasica", nombre: "Burger Clásica", emoji: "🍔", etiqueta: "Clásica",
      desc: "Carne premium de 120 g smash sazonada a la perfección, coronada con queso dambo, servida con pan brioche de la casa tostado en mantequilla, lechuga fresca, jugoso tomate y crujiente cebolla, acompañada de crocantes y doradas papas fritas.",
      opciones: [{ n: "Simple", precio: 40 }, { n: "Doble", precio: 50 }] },
    { id: "burger-go-kart", nombre: "Burger Go Kart", emoji: "🍔", etiqueta: "De la casa",
      desc: "Carne premium de 120 g smash sazonada a la perfección, coronada con queso cheddar, pan brioche de la casa tostado con mantequilla, aros de cebolla frita bañados con salsa BBQ y salsa de la casa, acompañada de crocantes y doradas papas fritas.",
      opciones: [{ n: "Simple", precio: 45 }, { n: "Doble", precio: 55 }] },
    { id: "burger-hawai", nombre: "Burger Hawai", emoji: "🍍",
      desc: "Carne premium de 120 g smash sazonada a la perfección, coronada con queso cheddar, servida con pan brioche de la casa tostado en mantequilla, lechuga fresca, piña asada, alioli y salsa de la casa, acompañada de crocantes y doradas papas fritas.",
      opciones: [{ n: "Simple", precio: 45 }, { n: "Doble", precio: 55 }] },
    { id: "chicken-sandwich", nombre: "Chicken Sandwich", emoji: "🍗",
      desc: "Crocante pollo frito, sazonado a la perfección, en pan brioche de la casa tostado con mantequilla, acompañado de salsa de la casa, lechuga fresca, tomate, cebolla crujiente y salsa tártara. Servido con doradas y crujientes papas fritas.",
      opciones: [{ n: "Simple", precio: 40 }] }
  ]},
  { categoria: "Alitas y Tenders", emoji: "🍗", productos: [
    { id: "alitas-racing", nombre: "Alitas Racing", emoji: "🍗", etiqueta: "Elige tu salsa", salsa: true,
      desc: "Jugosas alitas con doble empanizado, crujiente y dorado, bañadas generosamente con la salsa a elección.",
      opciones: [{ n: "6 uds", precio: 40 }, { n: "12 uds", precio: 60 }, { n: "18 uds", precio: 80 }] },
    { id: "tenders", nombre: "Tenders", emoji: "🍗", salsa: true,
      desc: "Crocantes y doradas piezas de pechuga de pollo bañadas en su salsa de la casa a elección, acompañadas con crujientes papas fritas.",
      opciones: [{ n: "6 uds", precio: 45 }, { n: "12 uds", precio: 65 }, { n: "18 uds", precio: 85 }] }
  ]},
  { categoria: "Piqueos para compartir", emoji: "🍟", productos: [
    { id: "salchipapa-turbo", nombre: "Salchipapa Turbo", emoji: "🌭",
      desc: "Crujientes papas doradas acompañadas de salchicha sellada a la plancha, bañadas con salsas de la casa.",
      opciones: [{ n: "Simple", precio: 30 }, { n: "Doble", precio: 45 }] },
    { id: "pique-go", nombre: "Pique Go", emoji: "🌶️", etiqueta: "Para compartir",
      desc: "Pique macho con crujientes y doradas papas fritas, salchicha sellada a la plancha, fresco tomate, cebolla crocante y un toque de locoto.",
      opciones: [{ n: "Simple", precio: 50 }, { n: "Doble", precio: 75 }] }
  ]},
  { categoria: "Costillas BBQ", emoji: "🔥", productos: [
    { id: "costillas-bbq", nombre: "Costillas BBQ", emoji: "🔥", etiqueta: "4 horas de cocción",
      desc: "Costilla de cerdo a cocción lenta durante 4 horas, bañada en nuestra salsa BBQ de la casa, acompañada de papas fritas crujientes y doradas y una fresca ensalada coleslaw.",
      opciones: [{ n: "1/2 Rack · 1 corredor", precio: 89 }, { n: "Rack completo · 2 corredores", precio: 120 }] }
  ]}
];
// Fotos que ya están en la app (img/menu/<id>.jpg)
// Fotos de referencia gratuitas (Unsplash y Pexels, ver img/menu/CREDITOS.txt). Se reemplazan subiendo la foto real a Drive.
const FOTOS_LOCALES = ["burger-clasica", "burger-go-kart", "burger-hawai", "chicken-sandwich", "alitas-racing", "tenders", "salchipapa-turbo", "pique-go", "costillas-bbq"];
MENU_BASE.forEach(c => c.productos.forEach(p => { if (FOTOS_LOCALES.includes(p.id)) p.foto = FOTO(p.id); }));

const sinTilde = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const EMOJI_CAT = { hamburguesas: "🍔", burgers: "🍔", bebidas: "🥤", postres: "🍨", combos: "🏁", snacks: "🍟" };

// Une el menú base con las fotos y platos de Drive
function unirConDrive(cats) {
  const menu = JSON.parse(JSON.stringify(MENU_BASE));
  (cats || []).forEach(c => (c.productos || []).forEach(d => {
    const opciones = (d.opciones && d.opciones.length) ? d.opciones.map(o => ({ n: o.n || "", precio: Number(o.precio) || 0 }))
      : (d.precio ? [{ n: "", precio: Number(d.precio) }] : null);
    let p = null;
    menu.forEach(m => m.productos.forEach(x => { if (sinTilde(x.nombre) === sinTilde(d.nombre)) p = x; }));
    if (p) {                                   // foto de un plato que ya existe
      if (d.foto) p.foto = d.foto;
      if (d.desc) p.desc = d.desc;
      if (opciones) p.opciones = opciones;
      return;
    }
    let cat = menu.find(m => sinTilde(m.categoria) === sinTilde(c.categoria));
    if (!cat) { cat = { categoria: c.categoria, emoji: EMOJI_CAT[sinTilde(c.categoria)] || "🍽️", productos: [] }; menu.push(cat); }
    cat.productos.push({ id: "d-" + d.id, nombre: d.nombre, desc: d.desc || "", emoji: cat.emoji, foto: d.foto,
      opciones: opciones || [{ n: "", precio: 0 }] });
  }));
  return menu;
}

let MENU = MENU_BASE;
try { const g = JSON.parse(localStorage.getItem("gk_menu2") || "null"); if (g && g.length) MENU = unirConDrive(g); } catch (e) {}

const $ = id => document.getElementById(id);
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
const bs = n => n > 0 ? "Bs " + n.toLocaleString("es-BO") : "Consultar";
const todos = () => MENU.flatMap(c => c.productos);
const buscar = id => todos().find(p => p.id === id);
const desde = p => { const ps = p.opciones.map(o => o.precio).filter(x => x > 0); return ps.length ? (ps.length > 1 ? "desde " : "") + bs(Math.min(...ps)) : "Consultar"; };

// Pedido guardado en este teléfono. Cada línea: { clave, id, op (índice de opción), salsa, cant }
let pedido = [];
try { const g = JSON.parse(localStorage.getItem("gk_pedido2") || "[]"); if (Array.isArray(g)) pedido = g.filter(l => l && buscar(l.id)); } catch (e) {}

const precioLinea = l => { const p = buscar(l.id); const o = p && p.opciones[l.op]; return o ? o.precio * l.cant : 0; };
const cantDe = id => pedido.filter(l => l.id === id).reduce((a, l) => a + l.cant, 0);

function guardarPedido() { try { localStorage.setItem("gk_pedido2", JSON.stringify(pedido)); } catch (e) {} pintarPedido(); }
function pintarPedido() {
  const cant = pedido.reduce((a, l) => a + l.cant, 0), total = pedido.reduce((a, l) => a + precioLinea(l), 0);
  $("pedido-resumen").textContent = cant + (cant === 1 ? " producto" : " productos") + " · " + bs(total);
  $("pedido-barra").classList.toggle("on", cant > 0);
  document.body.classList.toggle("con-pedido", cant > 0);
}

function figura(p, cls) {
  const fig = el("div", cls, p.foto ? null : p.emoji);
  if (p.foto) {
    const im = el("img"); im.src = p.foto; im.alt = p.nombre; im.loading = "lazy";
    im.onerror = () => { im.remove(); fig.textContent = p.emoji; fig.classList.remove("con-foto"); };
    fig.appendChild(im); fig.classList.add("con-foto");
  }
  return fig;
}

let catActual = -1;   // -1 = Todos
function mostrarCategoria(i) {
  catActual = i;
  document.querySelectorAll("#tabs .tab").forEach((b, j) => { const on = j === i + 1; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  const box = $("productos"); box.innerHTML = "";
  (i < 0 ? MENU : [MENU[i]]).forEach(c => {
    if (i < 0) box.appendChild(el("h2", "menu-cat", c.categoria));
    c.productos.forEach(p => {
      const card = el("article", "producto");
      card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", "Ver " + p.nombre);
      card.appendChild(figura(p, "producto-img"));
      const info = el("div");
      const h = el("h3", null, p.nombre);
      if (p.etiqueta) h.appendChild(el("span", "etiqueta", p.etiqueta));
      info.appendChild(h);
      info.appendChild(el("p", null, p.desc));
      const pie = el("div", "producto-pie");
      pie.appendChild(el("span", "producto-precio", desde(p)));
      const n = cantDe(p.id);
      const b = el("button", "mas-rapido" + (n ? " ok" : ""), n ? String(n) : "+");
      b.type = "button"; b.setAttribute("aria-label", "Elegir " + p.nombre);
      b.addEventListener("click", ev => { ev.stopPropagation(); abrirProducto(p); });
      pie.appendChild(b); info.appendChild(pie); card.appendChild(info);
      card.addEventListener("click", () => abrirProducto(p));
      card.addEventListener("keydown", ev => { if (ev.key === "Enter") abrirProducto(p); });
      box.appendChild(card);
    });
  });
  try { sessionStorage.setItem("gk_menu_tab", i); } catch (e) {}
}

function agregar(p, op, salsa, cant) {
  const clave = p.id + "|" + op + "|" + (salsa || "");
  const l = pedido.find(x => x.clave === clave);
  if (l) l.cant += cant; else pedido.push({ clave, id: p.id, op, salsa: salsa || "", cant });
  guardarPedido();
}

// ---------- Detalle de producto ----------
let prodSel = null, cantSel = 1, opSel = 0, salsaSel = "";
function opcionBoton(txt, sub, on, fn) {
  const b = el("button", "opcion" + (on ? " on" : "")); b.type = "button";
  b.setAttribute("role", "radio"); b.setAttribute("aria-checked", on);
  b.appendChild(el("b", null, txt)); if (sub) b.appendChild(el("small", null, sub));
  b.addEventListener("click", fn); return b;
}
function pintarOpciones() {
  const p = prodSel;
  const box = $("prod-opciones"); box.innerHTML = "";
  const hayTamanos = p.opciones.length > 1 || p.opciones[0].n;
  $("prod-opciones-wrap").classList.toggle("hidden", !hayTamanos);
  p.opciones.forEach((o, i) => box.appendChild(opcionBoton(o.n || "Precio", bs(o.precio), i === opSel, () => { opSel = i; pintarOpciones(); pintarTotal(); })));
  const sb = $("prod-salsas"); sb.innerHTML = "";
  $("prod-salsas-wrap").classList.toggle("hidden", !p.salsa);
  if (p.salsa) SALSAS.forEach(s => sb.appendChild(opcionBoton(s, null, s === salsaSel, () => { salsaSel = s; pintarOpciones(); pintarTotal(); })));
}
function abrirProducto(p) {
  prodSel = p; cantSel = 1; opSel = 0; salsaSel = p.salsa ? SALSAS[0] : "";
  const foto = $("prod-emoji");
  foto.textContent = p.foto ? "" : p.emoji;
  foto.style.backgroundImage = p.foto ? "url('" + p.foto.replace(/'/g, "%27") + "')" : "";
  foto.classList.toggle("con-foto", !!p.foto);
  $("prod-nombre").textContent = p.nombre;
  $("prod-precio").textContent = desde(p);
  $("prod-desc").textContent = p.desc;
  pintarOpciones(); pintarTotal();
  $("hoja-producto").classList.add("on");
}
function pintarTotal() {
  const p = prodSel; if (!p) return;
  $("prod-cant").textContent = cantSel;
  $("prod-agregar").textContent = "Agregar · " + bs(p.opciones[opSel].precio * cantSel);
}
function cerrarProducto() { $("hoja-producto").classList.remove("on"); prodSel = null; }

function usarMenu(cats) {
  MENU = cats;
  pedido = pedido.filter(l => buscar(l.id));
  pintarTabs();
  mostrarCategoria(Math.max(-1, Math.min(catActual, MENU.length - 1)));
  pintarPedido();
}

async function cargarMenuDrive() {
  if (typeof apiCall !== "function") return;
  try {
    const cats = await apiCall("getMenu");
    usarMenu(unirConDrive(cats));
    try { if (cats && cats.length) localStorage.setItem("gk_menu2", JSON.stringify(cats)); else localStorage.removeItem("gk_menu2"); } catch (e) {}
  } catch (err) { console.warn("Fotos del menú en Drive no disponibles:", err.message); }
}

function pintarTabs() {
  const tabs = $("tabs"); tabs.innerHTML = "";
  [{ categoria: "Todos", emoji: "" }].concat(MENU).forEach((c, i) => {
    const b = el("button", "tab", (c.emoji ? c.emoji + " " : "") + c.categoria);
    b.type = "button"; b.setAttribute("role", "tab");
    b.addEventListener("click", () => mostrarCategoria(i - 1));
    tabs.appendChild(b);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  pintarTabs();
  $("pedido-vaciar").addEventListener("click", () => { pedido = []; guardarPedido(); mostrarCategoria(catActual); });
  $("prod-menos").addEventListener("click", () => { cantSel = Math.max(1, cantSel - 1); pintarTotal(); });
  $("prod-mas").addEventListener("click", () => { cantSel = Math.min(20, cantSel + 1); pintarTotal(); });
  $("prod-agregar").addEventListener("click", () => { agregar(prodSel, opSel, salsaSel, cantSel); cerrarProducto(); mostrarCategoria(catActual); });
  $("hoja-producto").addEventListener("click", e => { if (e.target.id === "hoja-producto" || e.target.hasAttribute("data-cerrar")) cerrarProducto(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarProducto(); });
  let ini = -1; try { const g = sessionStorage.getItem("gk_menu_tab"); if (g !== null) ini = +g; } catch (e) {}
  mostrarCategoria(Math.max(-1, Math.min(ini, MENU.length - 1)));
  pintarPedido();
  cargarMenuDrive();
});
