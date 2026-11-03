// ============================================================
// GO KART SPORT BAR — menu.js  (menú digital con detalle de producto)
// ⚠ PRODUCTOS Y PRECIOS PROVISIONALES (del diseño): reemplazar por el menú real.
//   Cada producto: { id, nombre, desc, precio (Bs), emoji, etiqueta?, extras? }
//   extras: [{ id, nombre, precio }]
// ============================================================
const EXTRAS_COMIDA = [
  { id: "x-papas", nombre: "Papas fritas", precio: 8 },
  { id: "x-bebida", nombre: "Bebida", precio: 10 },
  { id: "x-salsa", nombre: "Salsa extra", precio: 5 }
];

const MENU = [
  { categoria: "Burgers", emoji: "🍔", productos: [
    { id: "b0", nombre: "Hamburguesa Clásica", desc: "Carne, queso, lechuga, tomate, cebolla y salsa de la casa.", precio: 45, emoji: "🍔", etiqueta: "Top", extras: EXTRAS_COMIDA },
    { id: "b1", nombre: "Pole Position", desc: "Doble carne, cheddar, tocino, cebolla caramelizada y salsa de la casa.", precio: 55, emoji: "🍔", extras: EXTRAS_COMIDA },
    { id: "b3", nombre: "Pit Stop Chicken", desc: "Pollo crocante, coleslaw y mayo picante.", precio: 42, emoji: "🍗", extras: EXTRAS_COMIDA },
    { id: "b4", nombre: "Bandera a Cuadros", desc: "Burger vegetariana de lentejas, palta y queso.", precio: 38, emoji: "🥬", extras: EXTRAS_COMIDA }
  ]},
  { categoria: "Snacks", emoji: "🍟", productos: [
    { id: "s2", nombre: "Alitas BBQ", desc: "Crujientes alitas con salsa BBQ.", precio: 38, emoji: "🍗", extras: EXTRAS_COMIDA },
    { id: "s1", nombre: "Papas Loaded", desc: "Con queso, bacon y salsa especial.", precio: 32, emoji: "🍟", etiqueta: "Para compartir", extras: EXTRAS_COMIDA },
    { id: "s3", nombre: "Nachos de Boxes", desc: "Nachos con queso, guacamole, pico de gallo y jalapeños.", precio: 35, emoji: "🧀", extras: EXTRAS_COMIDA },
    { id: "s4", nombre: "Salchipapa", desc: "Papas fritas con salchicha y salsas.", precio: 22, emoji: "🌭", extras: EXTRAS_COMIDA }
  ]},
  { categoria: "Bebidas", emoji: "🥤", productos: [
    { id: "d1", nombre: "Gaseosa", desc: "Vaso 500 ml.", precio: 10, emoji: "🥤" },
    { id: "d2", nombre: "Limonada", desc: "Natural, con o sin menta.", precio: 15, emoji: "🍋" },
    { id: "d3", nombre: "Cerveza", desc: "Botella 620 ml (mayores de 18).", precio: 25, emoji: "🍺" },
    { id: "d4", nombre: "Agua", desc: "Botella 500 ml.", precio: 8, emoji: "💧" }
  ]},
  { categoria: "Postres", emoji: "🍨", productos: [
    { id: "p1", nombre: "Brownie con helado", desc: "Brownie tibio con bola de vainilla.", precio: 25, emoji: "🍫" },
    { id: "p2", nombre: "Helado", desc: "Dos bolas, sabores del día.", precio: 18, emoji: "🍨" },
    { id: "p3", nombre: "Waffle Podio", desc: "Waffle con frutillas, crema y miel de maple.", precio: 28, emoji: "🧇" }
  ]}
];

const $ = id => document.getElementById(id);
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
const bs = n => "Bs " + n.toLocaleString("es-BO");
const todos = () => MENU.flatMap(c => c.productos);
const buscar = id => todos().find(p => p.id === id);

// Pedido guardado en este teléfono (todavía no se envía a ningún lado).
// Cada línea: { clave, id, extras:[ids], cant }. Acepta el formato viejo {id: cantidad}.
let pedido = [];
try {
  const g = JSON.parse(localStorage.getItem("gk_pedido") || "[]");
  pedido = Array.isArray(g) ? g.filter(l => l && buscar(l.id))
    : Object.entries(g || {}).filter(([id]) => buscar(id)).map(([id, cant]) => ({ clave: id + "|", id, extras: [], cant: +cant || 1 }));
} catch (e) {}

const precioLinea = l => { const p = buscar(l.id); return (p.precio + (p.extras || []).filter(x => l.extras.includes(x.id)).reduce((a, x) => a + x.precio, 0)) * l.cant; };
const cantDe = id => pedido.filter(l => l.id === id).reduce((a, l) => a + l.cant, 0);

function guardarPedido() { try { localStorage.setItem("gk_pedido", JSON.stringify(pedido)); } catch (e) {} pintarPedido(); }
function pintarPedido() {
  const cant = pedido.reduce((a, l) => a + l.cant, 0), total = pedido.reduce((a, l) => a + precioLinea(l), 0);
  $("pedido-resumen").textContent = cant + (cant === 1 ? " producto" : " productos") + " · " + bs(total);
  $("pedido-barra").classList.toggle("on", cant > 0);
  document.body.classList.toggle("con-pedido", cant > 0);
}

let catActual = -1;   // -1 = Todos
function mostrarCategoria(i) {
  catActual = i;
  document.querySelectorAll("#tabs .tab").forEach((b, j) => { const on = j === i + 1; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
  const box = $("productos"); box.innerHTML = "";
  (i < 0 ? todos() : MENU[i].productos).forEach(p => {
    const card = el("article", "producto");
    card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-label", "Ver " + p.nombre);
    card.appendChild(el("div", "producto-img", p.emoji));
    const info = el("div");
    const h = el("h3", null, p.nombre);
    if (p.etiqueta) h.appendChild(el("span", "etiqueta", p.etiqueta));
    info.appendChild(h);
    info.appendChild(el("p", null, p.desc));
    const pie = el("div", "producto-pie");
    pie.appendChild(el("span", "producto-precio", bs(p.precio)));
    const n = cantDe(p.id);
    const b = el("button", "mas-rapido" + (n ? " ok" : ""), n ? String(n) : "+");
    b.type = "button"; b.setAttribute("aria-label", "Agregar " + p.nombre);
    b.addEventListener("click", ev => { ev.stopPropagation(); agregar(p, [], 1); mostrarCategoria(catActual); });
    pie.appendChild(b); info.appendChild(pie); card.appendChild(info);
    card.addEventListener("click", () => abrirProducto(p));
    card.addEventListener("keydown", ev => { if (ev.key === "Enter") abrirProducto(p); });
    box.appendChild(card);
  });
  try { sessionStorage.setItem("gk_menu_tab", i); } catch (e) {}
}

function agregar(p, extras, cant) {
  const clave = p.id + "|" + extras.slice().sort().join(",");
  const l = pedido.find(x => x.clave === clave);
  if (l) l.cant += cant; else pedido.push({ clave, id: p.id, extras: extras.slice(), cant });
  guardarPedido();
}

// ---------- Detalle de producto ----------
let prodSel = null, cantSel = 1;
function abrirProducto(p) {
  prodSel = p; cantSel = 1;
  $("prod-emoji").textContent = p.emoji;
  $("prod-nombre").textContent = p.nombre;
  $("prod-precio").textContent = bs(p.precio);
  $("prod-desc").textContent = p.desc;
  const box = $("prod-extras"); box.innerHTML = "";
  $("prod-extras-wrap").classList.toggle("hidden", !(p.extras && p.extras.length));
  (p.extras || []).forEach(x => {
    const lab = el("label", "extra");
    const c = el("input"); c.type = "checkbox"; c.value = x.id; c.addEventListener("change", pintarTotal);
    lab.appendChild(c); lab.appendChild(el("span", null, x.nombre)); lab.appendChild(el("b", null, "+ " + bs(x.precio)));
    box.appendChild(lab);
  });
  pintarTotal();
  $("hoja-producto").classList.add("on");
}
const extrasSel = () => [...document.querySelectorAll("#prod-extras input:checked")].map(c => c.value);
function pintarTotal() {
  const p = prodSel; if (!p) return;
  const t = (p.precio + (p.extras || []).filter(x => extrasSel().includes(x.id)).reduce((a, x) => a + x.precio, 0)) * cantSel;
  $("prod-cant").textContent = cantSel;
  $("prod-agregar").textContent = "Agregar al pedido · " + bs(t);
}
function cerrarProducto() { $("hoja-producto").classList.remove("on"); prodSel = null; }

document.addEventListener("DOMContentLoaded", () => {
  const tabs = $("tabs");
  [{ categoria: "Todos", emoji: "" }].concat(MENU).forEach((c, i) => {
    const b = el("button", "tab", (c.emoji ? c.emoji + " " : "") + c.categoria);
    b.type = "button"; b.setAttribute("role", "tab");
    b.addEventListener("click", () => mostrarCategoria(i - 1));
    tabs.appendChild(b);
  });
  $("pedido-vaciar").addEventListener("click", () => { pedido = []; guardarPedido(); mostrarCategoria(catActual); });
  $("prod-menos").addEventListener("click", () => { cantSel = Math.max(1, cantSel - 1); pintarTotal(); });
  $("prod-mas").addEventListener("click", () => { cantSel = Math.min(20, cantSel + 1); pintarTotal(); });
  $("prod-agregar").addEventListener("click", () => { agregar(prodSel, extrasSel(), cantSel); cerrarProducto(); mostrarCategoria(catActual); });
  $("hoja-producto").addEventListener("click", e => { if (e.target.id === "hoja-producto" || e.target.hasAttribute("data-cerrar")) cerrarProducto(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarProducto(); });
  let ini = -1; try { const g = sessionStorage.getItem("gk_menu_tab"); if (g !== null) ini = +g; } catch (e) {}
  mostrarCategoria(Math.max(-1, Math.min(ini, MENU.length - 1)));
  pintarPedido();
});
