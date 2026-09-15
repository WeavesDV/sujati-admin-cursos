/**
 * ============================================================
 * PLANTILLA DE CORREO · Spazio Bodywork
 * ============================================================
 *
 * Construye el HTML del correo a partir del asunto y del copy
 * que se escriben en el panel. El diseño (cabecera, banda,
 * tipografías y pie) es fijo: desde el editor solo se cambia
 * el contenido.
 *
 * No depende de nada: se puede cargar antes o después de
 * config.js y admin.js.
 */

const EmailTemplate = (function () {

  /**
   * ----------------------------------------------------------
   * MARCA
   * ----------------------------------------------------------
   * Colores y recursos del diseño aprobado.
   */

  const MARCA = {

    fondo: '#f3e8eb',

    tarjeta: '#ffffff',

    banda: '#928490',

    tinta: '#433e49',

    suave: '#928490',

    logo:
      'https://spaziobodywork.com/wp-content/uploads/2024/09/' +
      'logo-spazio-bodywork-spain-masaje-californiano-esalen-' +
      'barcelona-madrid-baleares.png',

    fuente:
      'Helvetica,Arial,sans-serif'

  };


  /**
   * ----------------------------------------------------------
   * VARIABLES
   * ----------------------------------------------------------
   * Alias: nombres que usa la plantilla y de qué campo de la
   * Data Table se alimentan.
   */

  const ALIAS = {

    evento: 'curso_nombre',

    curso: 'curso_nombre',

    instructor: 'docente',

    fecha_evento: 'fecha_inicio'

  };


  /**
   * Variables que no existen en la Data Table porque dependen
   * del destinatario. En la vista previa se rellenan con un
   * valor de ejemplo y se avisa de ello.
   */

  const MUESTRAS = {

    nombre: 'María',

    email: 'maria@ejemplo.com',

    direccion: '(dirección de la sede)'

  };


  const MESES = [
    'enero', 'febrero', 'marzo', 'abril',
    'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];


  /**
   * ============================================================
   * HELPERS
   * ============================================================
   */

  function escapar(texto) {

    return String(texto ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  }


  function formatearFecha(valor) {

    const iso =
      String(valor ?? '')
        .trim()
        .match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!iso) {
      return String(valor ?? '').trim();
    }

    const mes =
      MESES[Number(iso[2]) - 1] || iso[2];

    return `${Number(iso[3])} de ${mes} de ${iso[1]}`;

  }


  function formatearImporte(valor) {

    if (valor === '' || valor === null || valor === undefined) {
      return '';
    }

    const numero = Number(valor);

    if (isNaN(numero)) {
      return String(valor);
    }

    const texto =
      Number.isInteger(numero)
        ? String(numero)
        : numero.toFixed(2).replace('.', ',');

    return `${texto} €`;

  }


  /**
   * ============================================================
   * DATOS PARA LAS VARIABLES
   * ============================================================
   *
   * Recibe el registro tal cual está en el formulario y
   * devuelve el diccionario con el que se sustituyen las
   * variables del copy.
   */

  function datos(registro) {

    const fuente = registro || {};

    const mapa = {};


    // Todos los campos del registro, tal cual.
    Object.keys(fuente).forEach(key => {
      mapa[key] = fuente[key];
    });


    // Formatos legibles para lo que va dentro del correo.
    mapa.fecha_inicio = formatearFecha(fuente.fecha_inicio);
    mapa.fecha_fin    = formatearFecha(fuente.fecha_fin);
    mapa.precio       = formatearImporte(fuente.precio);
    mapa.reserva      = formatearImporte(fuente.reserva);


    // Alias de la plantilla.
    Object.keys(ALIAS).forEach(alias => {

      if (!mapa[alias]) {
        mapa[alias] = mapa[ALIAS[alias]];
      }

    });

    return mapa;

  }


  /**
   * Sustituye {{variable}} y {variable}.
   *
   * Devuelve también qué variables se han rellenado con un
   * valor de ejemplo y cuáles se han quedado sin valor, para
   * poder avisar en el panel.
   */

  function aplicarVariables(texto, valores) {

    const muestras = new Set();

    const faltantes = new Set();


    const resuelto =
      String(texto ?? '').replace(

        /\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g,

        (original, clave) => {

          const valor = valores ? valores[clave] : '';

          if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
            return String(valor);
          }

          if (Object.prototype.hasOwnProperty.call(MUESTRAS, clave)) {
            muestras.add(clave);
            return MUESTRAS[clave];
          }

          faltantes.add(clave);
          return original;

        }
      );


    return {
      texto: resuelto,
      muestras: Array.from(muestras),
      faltantes: Array.from(faltantes)
    };

  }


  /**
   * ============================================================
   * COPY → HTML
   * ============================================================
   *
   * Formato admitido dentro del campo "Copy del correo":
   *
   *   línea en blanco          separa párrafos
   *   **texto**                negrita
   *   ## Título                subtítulo
   *   > línea                  bloque destacado (caja rosa)
   *   | línea                  caja blanca con borde
   *   [boton:URL]Texto[/boton] botón
   *   ---                      separador
   */

  function esHtmlCompleto(copy) {

    return /<(table|html|!doctype|div|body)\b/i.test(
      String(copy ?? '')
    );

  }


  function enLinea(texto) {

    return escapar(texto)
      .replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="font-weight:bold;">$1</strong>'
      );

  }


  function parrafo(texto, margen = '0 0 16px 0') {

    return `
<p style="margin:${margen}; font-size:15px; color:${MARCA.tinta}; line-height:1.7; font-family:${MARCA.fuente};">
${texto}
</p>`;

  }


  function lineasAParrafos(lineas, margenUltimo) {

    return lineas
      .map((linea, indice) =>
        parrafo(
          enLinea(linea).replace(/\n/g, '<br />'),
          indice === lineas.length - 1
            ? (margenUltimo || '0')
            : '0 0 8px 0'
        )
      )
      .join('');

  }


  function caja(lineas) {

    return `
<table style="margin:24px 0;" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="background-color:${MARCA.fondo}; border-left:4px solid ${MARCA.banda}; border-radius:0 8px 8px 0; padding:18px 20px;">
${lineasAParrafos(lineas)}
</td>
</tr>
</tbody>
</table>`;

  }


  function cajaClara(lineas) {

    return `
<table style="margin:20px 0 24px 0;" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="background-color:${MARCA.tarjeta}; border:1px solid ${MARCA.fondo}; border-radius:10px; padding:18px 20px;">
${lineasAParrafos(lineas)}
</td>
</tr>
</tbody>
</table>`;

  }


  function boton(url, etiqueta) {

    return `
<table style="margin:26px 0 30px 0;" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td align="center">
<a style="display:inline-block; background-color:${MARCA.tinta}; color:#ffffff; text-decoration:none; padding:15px 32px; border-radius:8px; font-size:14px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; font-family:${MARCA.fuente};" href="${escapar(url)}" target="_blank" rel="noopener">
${enLinea(etiqueta)}
</a>
</td>
</tr>
</tbody>
</table>`;

  }


  function subtitulo(texto) {

    return `
<h2 style="margin:26px 0 12px 0; font-size:17px; font-weight:bold; color:${MARCA.tinta}; line-height:1.4; font-family:${MARCA.fuente};">
${enLinea(texto)}
</h2>`;

  }


  const SEPARADOR = `
<table style="margin:24px 0;" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="border-top:1px solid ${MARCA.fondo}; font-size:0;"></td>
</tr>
</tbody>
</table>`;


  function copyAHtml(copy) {

    const limpio =
      String(copy ?? '')
        .replace(/\r\n/g, '\n')
        .trim();

    if (!limpio) {

      return parrafo(
        `<span style="color:${MARCA.suave};">(El copy del correo está vacío.)</span>`
      );

    }


    return limpio
      .split(/\n{2,}/)
      .map(bloque => {

        const lineas =
          bloque
            .split('\n')
            .map(linea => linea.trim())
            .filter(Boolean);

        if (!lineas.length) {
          return '';
        }


        // Separador
        if (lineas.length === 1 && /^-{3,}$/.test(lineas[0])) {
          return SEPARADOR;
        }


        // Botón
        const cta =
          lineas[0].match(
            /^\[boton:\s*([^\]]+)\]([\s\S]*?)\[\/boton\]$/i
          );

        if (lineas.length === 1 && cta) {
          return boton(cta[1].trim(), cta[2].trim());
        }


        // Subtítulo
        if (lineas.length === 1 && /^##\s+/.test(lineas[0])) {
          return subtitulo(lineas[0].replace(/^##\s+/, ''));
        }


        // Caja destacada
        if (lineas.every(linea => linea.startsWith('>'))) {

          return caja(
            lineas.map(linea => linea.replace(/^>\s?/, ''))
          );

        }


        // Caja clara
        if (lineas.every(linea => linea.startsWith('|'))) {

          return cajaClara(
            lineas.map(linea => linea.replace(/^\|\s?/, ''))
          );

        }


        // Párrafo normal
        return parrafo(
          lineas.map(enLinea).join('<br />')
        );

      })
      .join('');

  }


  /**
   * ============================================================
   * ESTRUCTURA DEL CORREO
   * ============================================================
   */

  function cabecera() {

    return `
<tr>
<td style="background-color:${MARCA.tarjeta}; padding:32px 40px 24px; text-align:center; border-bottom:3px solid ${MARCA.fondo};">
<img style="display:block; margin:0 auto; max-width:170px; width:100%; height:auto; border:0;" src="${MARCA.logo}" alt="Spazio Bodywork" width="170" />
<p style="margin:14px 0 0 0; font-size:11px; letter-spacing:2.5px; text-transform:uppercase; color:${MARCA.suave}; font-family:${MARCA.fuente};">
Spazio Bodywork
</p>
</td>
</tr>`;

  }


  function banda(eyebrow, titulo) {

    const superior =
      eyebrow
        ? `
<p style="margin:0 0 5px 0; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#ffffff; font-family:${MARCA.fuente};">
${enLinea(eyebrow)}
</p>`
        : '';

    return `
<tr>
<td style="background-color:${MARCA.banda}; padding:22px 40px; text-align:center;">
${superior}
<h1 style="margin:0; font-size:20px; font-weight:bold; color:#ffffff; line-height:1.35; font-family:${MARCA.fuente};">
${enLinea(titulo)}
</h1>
</td>
</tr>`;

  }


  function firma() {

    return `
${SEPARADOR}
<p style="margin:0; font-size:15px; color:${MARCA.tinta}; line-height:1.7; font-family:${MARCA.fuente};">
Un saludo,<br />
<strong style="font-weight:bold; font-size:16px;">Sujati</strong>
</p>`;

  }


  function pie() {

    return `
<tr>
<td style="background-color:${MARCA.tinta}; padding:34px 40px;">
<table style="font-family:${MARCA.fuente};" border="0" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>

<td style="padding:0 18px 0 0; color:#ffffff;" valign="top" width="45%">
<p style="margin:0 0 14px 0; font-size:14px; font-weight:bold; color:#ffffff; font-family:${MARCA.fuente}; letter-spacing:2.5px; text-transform:uppercase;">
Spazio Bodywork
</p>
<p style="margin:0 0 14px 0; font-size:12px; line-height:1.7; color:#ffffff; font-family:${MARCA.fuente};">
<strong>● Masaje Californiano Psicosomático en Barcelona</strong><br />
C/ Viladomat, 152, piso 2,<br />
08015 Barcelona
</p>
<p style="margin:0; font-size:12px; line-height:1.7; color:#ffffff; font-family:${MARCA.fuente};">
<strong>● Masaje Californiano Psicosomático en Madrid</strong><br />
C/ Gonzalo De Córdoba 17 ofi. B,<br />
28010 Madrid
</p>
</td>

<td style="padding:0 10px;" align="center" valign="top" width="20%">
<table border="0" cellspacing="0" cellpadding="0" align="center">
<tbody>
<tr>
<td style="padding:0 0 14px 0;" align="center">
<a style="text-decoration:none;" href="https://www.instagram.com/spaziobodywork/" target="_blank" rel="noopener">
<img style="display:block; border:0; text-decoration:none;" src="https://spaziobodywork.com/wp-content/uploads/2026/05/instagram-new.png" alt="Instagram" width="26" height="26" />
</a>
</td>
</tr>
<tr>
<td style="padding:0 0 14px 0;" align="center">
<a style="text-decoration:none;" href="https://www.facebook.com/Spaziobodywork" target="_blank" rel="noopener">
<img style="display:block; border:0; text-decoration:none;" src="https://spaziobodywork.com/wp-content/uploads/2026/05/facebook-f.png" alt="Facebook" width="26" height="26" />
</a>
</td>
</tr>
<tr>
<td style="padding:0;" align="center">
<a style="text-decoration:none;" href="https://www.youtube.com/@spaziobodywork4322" target="_blank" rel="noopener">
<img style="display:block; border:0; text-decoration:none;" src="https://spaziobodywork.com/wp-content/uploads/2026/05/youtube-play.png" alt="YouTube" width="28" height="28" />
</a>
</td>
</tr>
</tbody>
</table>
</td>

<td style="padding:0 0 0 18px; color:#ffffff;" valign="top" width="35%">
<p style="margin:0 0 18px 0; font-size:14px; font-weight:bold; color:#ffffff; font-family:${MARCA.fuente}; letter-spacing:2.5px; text-transform:uppercase;">
Contacto
</p>
<p style="margin:0; font-size:13px; line-height:1.9; color:#ffffff; font-family:${MARCA.fuente};">
<a style="color:#ffffff; text-decoration:none;" href="tel:+34693059088">+34 693 05 90 88</a><br />
<a style="color:#ffffff; text-decoration:none;" href="mailto:info@spaziobodywork.com">info@spaziobodywork.com</a><br />
<a style="color:#ffffff; text-decoration:none;" href="https://www.spaziobodywork.com">www.spaziobodywork.com</a>
</p>
</td>

</tr>
</tbody>
</table>
</td>
</tr>`;

  }


  /**
   * ============================================================
   * RENDER
   * ============================================================
   *
   * render({ asunto, copy, registro }) devuelve:
   *
   *   { html, asunto, muestras, faltantes }
   *
   * `html` es el correo completo, listo para meter en un
   * iframe o para enviarlo desde n8n.
   */

  function render(opciones) {

    const config = opciones || {};

    const valores = datos(config.registro);


    const asunto =
      aplicarVariables(config.asunto, valores);

    const copy =
      aplicarVariables(config.copy, valores);


    const muestras =
      Array.from(
        new Set([].concat(asunto.muestras, copy.muestras))
      );

    const faltantes =
      Array.from(
        new Set([].concat(asunto.faltantes, copy.faltantes))
      );


    /**
     * Si el copy ya trae la maqueta completa (alguien ha
     * pegado el HTML entero), se respeta tal cual: envolverlo
     * en la plantilla lo rompería.
     */
    if (esHtmlCompleto(copy.texto)) {

      return {
        html: copy.texto,
        asunto: asunto.texto,
        propio: true,
        muestras,
        faltantes
      };

    }


    const titulo =
      asunto.texto.trim() ||
      'Asunto del correo';

    const eyebrow =
      (config.registro && config.registro.ciudad) || '';


    const html = `
<table style="background-color:${MARCA.fondo}; padding:32px 16px; font-family:${MARCA.fuente};" width="100%" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td align="center">

<table style="max-width:600px; background-color:${MARCA.tarjeta}; border-radius:16px; overflow:hidden; font-family:${MARCA.fuente};" width="100%" cellspacing="0" cellpadding="0">
<tbody>

<tr>
<td style="display:none!important; opacity:0; color:transparent; height:0; width:0; overflow:hidden;">
${enLinea(titulo)}
</td>
</tr>

${cabecera()}
${banda(eyebrow, titulo)}

<tr>
<td style="padding:36px 40px; font-family:${MARCA.fuente};">
${copyAHtml(copy.texto)}
${firma()}
</td>
</tr>

${pie()}

</tbody>
</table>

</td>
</tr>
</tbody>
</table>`;


    return {
      html,
      asunto: asunto.texto,
      propio: false,
      muestras,
      faltantes
    };

  }


  /**
   * Documento completo para el iframe de la vista previa.
   */

  function documento(html) {

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Vista previa</title>
<style>
  body { margin: 0; background: ${MARCA.fondo}; }
  img { max-width: 100%; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  }


  return {
    MARCA,
    MUESTRAS,
    datos,
    aplicarVariables,
    copyAHtml,
    render,
    documento
  };

})();
