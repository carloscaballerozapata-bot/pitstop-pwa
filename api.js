// ============================================================
// PITSTOP — api.js  (comunicación con Apps Script)
// ============================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzqsLTn8VG2xxvWkO4GXhVZ0K0JNDohikc2uAuj81XnUaNJB6XbWmq8QYaVVos2sJys/exec";

async function apiCall(accion, datos = {}) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ accion, datos })
    });
    if (!res.ok) throw new Error("Error de red (" + res.status + "). Intenta de nuevo.");
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Error del servidor");
    return json.data;
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      throw new Error("Sin conexión a internet. Verifica tu red e intenta de nuevo.");
    }
    throw err;
  }
}
