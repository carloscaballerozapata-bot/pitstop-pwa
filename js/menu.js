// ============================================================
// GO KART SPORT BAR — menu.js  (menú digital)
// ⚠ PRODUCTOS Y PRECIOS DE EJEMPLO: reemplazar por el menú real.
//   Cada producto: { id, nombre, desc, precio (Bs), emoji, etiqueta? }
// ============================================================
const MENU = [
  { categoria: "Burgers", emoji: "🍔", productos: [
    { id: "b1", nombre: "Pole Position", desc: "Doble carne, cheddar, tocino, cebolla caramelizada y salsa de la casa.", precio: 55, emoji: "🍔", etiqueta: "Top" },
    { id: "b2", nombre: "Vuelta Rápida", desc: "Carne de res, queso, lechuga, tomate y pepinillos.", precio: 40, emoji: "🍔" },
    { id: "b3", nombre: "Pit Stop Chicken", desc: "Pollo crocante, coleslaw y mayo picante.", precio: 42, emoji: "🍗" },
    { id: "b4", nombre: "Bandera a Cuadros", desc: "Burger vegetariana de lentejas, palta y queso.", precio: 38, emoji: "🥬" }
  ]},
  { categoria: "Snacks", emoji: "🍟", productos: [
    { id: "s1", nombre: "Papas Turbo", desc: "Papas fritas con cheddar fundido y tocino.", precio: 25, emoji: "🍟", etiqueta: "Para compartir" },
    { id: "s2", nombre: "Alitas Box", desc: "8 alitas BBQ o picantes con salsa ranch.", precio: 45, emoji: "🍗" },
    { id: "s3", nombre: "Nachos de Boxes", desc: "Nachos con queso, guacamole, pico de gallo y jalapeños.", precio: 35, emoji: "🧀" },
    { id: "s4", nombre: "Salchipapa", desc: "Papas fritas con salchicha y salsas.", precio: 22, emoji: "🌭" }
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

// Pedido guardado en este teléfono (todavía no se envía a ningún lado)
let pedido = {};
try { pedido = JSON.parse(localStorage.getItem("gk_pedido") || "{}"); } catch (e) {}
const todos = () => MENU.flatMap(c => c.productos);

function guardarPedido() { try { localStorage.setItem("gk_pedido", JSON.stringify(pedido)); } catch (e) {} pintarPedido(); }
function pintarPedido() {
  const ps = todos(), cant = Object.values(pedido).reduce((a, n) => a + n, 0);
  const total = Object.entries(pedido).reduce((a, [id, n]) => a + ((ps.find(p => p.id === id) || {}).precio || 0) * n, 0);
  $("pedido-resumen").textContent = cant + (cant === 1 ? " producto" : " productos") + " · " + bs(total);
  $("pedido-barra").classList.toggle("on", cant > 0);
  document.body.classList.toggle("con-pedido", cant > 0);
}

function mostrarCategoria(i) {
  document.querySelectorAll("#tabs .tab").forEach((b, j) => { b.classList.toggle("on", i === j); b.setAttribute("aria-selected", i === j); });
  const box = $("productos"); box.innerHTML = "";
  MENU[i].productos.forEach(p => {
    const card = el("article", "producto");
    card.appendChild(el("div", "producto-img", p.emoji));
    const info = el("div");
    const h = el("h3", null, p.nombre);
    if (p.etiqueta) h.appendChild(el("span", "etiqueta", p.etiqueta));
    info.appendChild(h);
    info.appendChild(el("p", null, p.desc));
    const pie = el("div", "producto-pie");
    pie.appendChild(el("span", "producto-precio", bs(p.precio)));
    const b = el("button", "btn", pedido[p.id] ? "Agregado (" + pedido[p.id] + ")" : "Agregar al pedido");
    b.type = "button";
    if (pedido[p.id]) b.classList.add("ok");
    b.addEventListener("click", () => {
      pedido[p.id] = (pedido[p.id] || 0) + 1; guardarPedido();
      b.textContent = "Agregado (" + pedido[p.id] + ")"; b.classList.add("ok");
    });
    pie.appendChild(b); info.appendChild(pie); card.appendChild(info); box.appendChild(card);
  });
  try { sessionStorage.setItem("gk_menu_tab", i); } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  const tabs = $("tabs");
  MENU.forEach((c, i) => {
    const b = el("button", "tab", c.emoji + " " + c.categoria);
    b.type = "button"; b.setAttribute("role", "tab");
    b.addEventListener("click", () => mostrarCategoria(i));
    tabs.appendChild(b);
  });
  $("pedido-vaciar").addEventListener("click", () => { pedido = {}; guardarPedido(); mostrarCategoria(+(sessionStorage.getItem("gk_menu_tab") || 0)); });
  let ini = 0; try { ini = +(sessionStorage.getItem("gk_menu_tab") || 0); } catch (e) {}
  mostrarCategoria(Math.min(ini, MENU.length - 1));
  pintarPedido();
});
