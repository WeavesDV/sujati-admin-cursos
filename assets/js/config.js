/**
 * ============================================================
 * CONFIGURACIÓN GLOBAL
 * ============================================================
 *
 * Único archivo que hay que tocar para cambiar endpoints,
 * usuarios o duración de la sesión.
 */

const CONFIG = {

  /**
   * --------------------------------------------------------
   * Webhooks de n8n
   * --------------------------------------------------------
   * Las URLs /webhook-test/ solo responden una vez después de
   * pulsar "Execute workflow" en el canvas. Para el uso real
   * cambia "webhook-test" por "webhook".
   */
  api: {

    get:
      'https://n8n.weavewp.com/webhook/2d09dd67-8d21-4c18-bf5c-e958ed473210',

    save:
      'https://n8n.weavewp.com/webhook/fc12da9f-a6e0-4221-ada1-eced23e7e1c0'

  },


  /**
   * --------------------------------------------------------
   * Acceso
   * --------------------------------------------------------
   * La contraseña no se guarda en claro, solo su hash SHA-256.
   *
   * Para generar un hash nuevo:
   *
   *   printf 'nuevaClave' | sha256sum
   *
   * Credenciales iniciales:
   *   admin  / spazio2026
   *   sujati / sujati2026
   */
  usuarios: [
    {
      usuario: 'admin',
      hash: 'e9230e9942e94a4fb88060ef9327ce6cf260344f7e0a893635d44efa9691616f'
    },
    {
      usuario: 'sujati',
      hash: 'ce7deb7cc222b98796d3227e85fa7a174bdb248b6d78d2cab67e93f47827233c'
    }
  ],


  /**
   * --------------------------------------------------------
   * Sesión
   * --------------------------------------------------------
   */
  sesion: {

    /** Clave usada en el almacenamiento del navegador. */
    clave: 'sujati_sesion',

    /** Duración normal, en horas. */
    horas: 8,

    /** Duración con "mantener sesión iniciada", en horas. */
    horasRecordada: 24 * 14

  },


  /**
   * --------------------------------------------------------
   * Rutas
   * --------------------------------------------------------
   */
  rutas: {

    login: 'login.html',

    panel: 'admin.html'

  }

};
