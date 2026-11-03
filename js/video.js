// ============================================================
// GO KART SPORT BAR — video.js
// Fondo del inicio: clip corto sin sonido (video/hero-pista.mp4).
// Botón "Ver video": video completo con sonido (video/gokart-completo.mp4).
// No reproduce el fondo si el teléfono pide menos movimiento o ahorro de datos.
// ============================================================
(function () {
  const fondo = document.getElementById("hero-video");
  const hero = fondo && fondo.closest(".hero");
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ahorro = navigator.connection && navigator.connection.saveData;

  if (fondo && !quieto && !ahorro) {
    fondo.preload = "auto";
    fondo.addEventListener("playing", () => hero.classList.add("video-listo"), { once: true });
    const jugar = () => { const p = fondo.play(); if (p && p.catch) p.catch(() => {}); };
    // Pausa cuando el inicio no se ve (ahorra batería y datos)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { e.isIntersecting && !document.hidden ? jugar() : fondo.pause(); }, { threshold: 0.15 }).observe(hero);
    } else jugar();
    document.addEventListener("visibilitychange", () => { if (document.hidden) fondo.pause(); });
  }

  const btn = document.getElementById("btn-video");
  const modal = document.getElementById("video-modal");
  const completo = document.getElementById("video-completo");
  if (!btn || !modal || !completo) return;

  const abrir = () => {
    if (fondo) fondo.pause();
    if (modal.showModal) modal.showModal(); else modal.setAttribute("open", "");
    completo.currentTime = 0;
    const p = completo.play(); if (p && p.catch) p.catch(() => {});
  };
  const cerrar = () => {
    completo.pause();
    if (modal.close) modal.close(); else modal.removeAttribute("open");
  };
  btn.addEventListener("click", abrir);
  document.getElementById("video-cerrar").addEventListener("click", cerrar);
  modal.addEventListener("click", e => { if (e.target === modal) cerrar(); });
  modal.addEventListener("close", () => { completo.pause(); if (fondo && !quieto && !ahorro) { const p = fondo.play(); if (p && p.catch) p.catch(() => {}); } });
  completo.addEventListener("ended", cerrar);
})();
