/**
 * ============================================================
 * AUTENTICACIÓN
 * ============================================================
 *
 * Login sin base de datos: los usuarios están en config.js y la
 * sesión vive en el almacenamiento del navegador.
 *
 * Uso:
 *
 *   <script src="assets/js/config.js"></script>
 *   <script src="assets/js/auth.js" data-guard></script>
 *
 * El atributo data-guard protege la página: si no hay sesión
 * válida redirige al login antes de pintar nada.
 */

const Auth = (function () {

  const AJUSTES = CONFIG.sesion;
  const RUTAS = CONFIG.rutas;


  /**
   * ----------------------------------------------------------
   * Hashing
   * ----------------------------------------------------------
   */

  async function sha256(texto) {
    // crypto.subtle solo existe en contexto seguro (https o localhost).
    // Al abrir el archivo con file:// se usa la implementación de respaldo.
    if (window.crypto && crypto.subtle) {
      const datos = new TextEncoder().encode(texto);
      const buffer = await crypto.subtle.digest('SHA-256', datos);

      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    return sha256Fallback(texto);
  }


  /** SHA-256 en JavaScript puro (respaldo para contextos no seguros). */
  function sha256Fallback(texto) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
      0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
      0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
      0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
      0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
      0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const bytes = Array.from(new TextEncoder().encode(texto));
    const bitLen = bytes.length * 8;

    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);

    // Longitud en 64 bits big-endian (los 32 altos son 0 para entradas normales).
    for (let i = 0; i < 4; i++) bytes.push(0);
    for (let i = 3; i >= 0; i--) bytes.push((bitLen >>> (i * 8)) & 0xff);

    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let bloque = 0; bloque < bytes.length; bloque += 64) {
      const w = new Uint32Array(64);

      for (let i = 0; i < 16; i++) {
        const o = bloque + i * 4;
        w[i] = (bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3];
      }

      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let [a, b, c, d, e, f, g, h] = H;

      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;

        h = g; g = f; f = e;
        e = (d + t1) >>> 0;
        d = c; c = b; b = a;
        a = (t1 + t2) >>> 0;
      }

      const nuevos = [a, b, c, d, e, f, g, h];
      for (let i = 0; i < 8; i++) H[i] = (H[i] + nuevos[i]) >>> 0;
    }

    return H.map(x => x.toString(16).padStart(8, '0')).join('');
  }


  /**
   * ----------------------------------------------------------
   * Sesión
   * ----------------------------------------------------------
   */

  function leerSesion() {

    const crudo =
      sessionStorage.getItem(AJUSTES.clave) ||
      localStorage.getItem(AJUSTES.clave);

    if (!crudo) return null;

    try {

      const sesion = JSON.parse(crudo);

      if (!sesion || !(sesion.expira > Date.now())) return null;

      return sesion;

    } catch (error) {

      return null;

    }

  }


  function guardarSesion(usuario, recordar) {

    const horas = recordar
      ? AJUSTES.horasRecordada
      : AJUSTES.horas;

    const sesion = {
      usuario,
      expira: Date.now() + horas * 60 * 60 * 1000
    };

    // Evita dejar una sesión vieja en el otro almacenamiento.
    borrarSesion();

    const almacen = recordar ? localStorage : sessionStorage;

    almacen.setItem(
      AJUSTES.clave,
      JSON.stringify(sesion)
    );

  }


  function borrarSesion() {

    sessionStorage.removeItem(AJUSTES.clave);
    localStorage.removeItem(AJUSTES.clave);

  }


  /**
   * ----------------------------------------------------------
   * API pública
   * ----------------------------------------------------------
   */

  /**
   * Valida credenciales contra CONFIG.usuarios.
   * Devuelve true si el acceso es correcto.
   */
  async function iniciarSesion(usuario, contrasena, recordar) {

    const nombre = String(usuario || '').trim().toLowerCase();
    const hash = await sha256(contrasena);

    const encontrado = CONFIG.usuarios.find(
      u => u.usuario === nombre && u.hash === hash
    );

    if (!encontrado) return false;

    guardarSesion(encontrado.usuario, Boolean(recordar));

    return true;

  }


  function cerrarSesion() {

    borrarSesion();

    location.replace(RUTAS.login);

  }


  /** Redirige al login si no hay sesión válida. */
  function proteger() {

    if (leerSesion()) return;

    borrarSesion();

    location.replace(RUTAS.login);

  }


  /** Salta al panel si ya hay sesión (para la pantalla de login). */
  function saltarSiHaySesion() {

    if (!leerSesion()) return;

    location.replace(RUTAS.panel);

  }


  return {
    sesion: leerSesion,
    iniciarSesion,
    cerrarSesion,
    proteger,
    saltarSiHaySesion
  };

})();


/**
 * El atributo data-guard en la etiqueta <script> protege la página
 * en cuanto se carga el archivo, antes de pintar el contenido.
 */
if (
  document.currentScript &&
  document.currentScript.hasAttribute('data-guard')
) {

  Auth.proteger();

}
