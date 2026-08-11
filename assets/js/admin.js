/**
 * ============================================================
 * PANEL DE GESTIÓN DE CURSOS
 * ============================================================
 *
 * Requiere config.js y auth.js cargados antes que este archivo.
 */

/**
 * ============================================================
 * ESTADO
 * ============================================================
 */

let registrosCurso = [];

let registroActual = null;

let ultimoElementoCopyActivo = null;


/**
 * ============================================================
 * ELEMENTOS
 * ============================================================
 */

const cursoSelect =
  document.getElementById('cursoSelect');

const ciudadSelect =
  document.getElementById('ciudadSelect');

const loader =
  document.getElementById('loader');

const emptyState =
  document.getElementById('emptyState');

const editor =
  document.getElementById('editor');

const editorTitle =
  document.getElementById('editorTitle');

const editorMeta =
  document.getElementById('editorMeta');

const estadoBadge =
  document.getElementById('estadoBadge');

const saveBtn =
  document.getElementById('saveBtn');

const resetBtn =
  document.getElementById('resetBtn');

const saveStatus =
  document.getElementById('saveStatus');

const toast =
  document.getElementById('toast');

const connectionDot =
  document.getElementById('connectionDot');

const connectionText =
  document.getElementById('connectionText');


const campos = {

  activo:
    document.getElementById('activo'),

  estado:
    document.getElementById('estado'),

  fecha_inicio:
    document.getElementById('fecha_inicio'),

  fecha_fin:
    document.getElementById('fecha_fin'),

  calendario:
    document.getElementById('calendario'),

  precio:
    document.getElementById('precio'),

  docente:
    document.getElementById('docente'),

  horario:
    document.getElementById('horario'),

  reserva:
    document.getElementById('reserva'),

  link:
    document.getElementById('link'),

  asunto_template:
    document.getElementById('asunto_template'),

  copy_template:
    document.getElementById('copy_template'),

  notas:
    document.getElementById('notas')

};


/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function showLoader(show) {

  loader.classList.toggle(
    'show',
    show
  );

}


function showToast(
  message,
  type = 'success'
) {

  toast.textContent =
    message;

  toast.className =
    `toast ${type} show`;

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {

      toast.classList.remove(
        'show'
      );

    }, 3600);

}


function setConnection(
  ok,
  text
) {

  connectionDot.classList.toggle(
    'ok',
    ok
  );

  connectionText.textContent =
    text;

}


function actualizarBadge(
  estado
) {

  const valor =
    estado || '—';

  estadoBadge.textContent =
    valor;

  estadoBadge.className =
    `badge ${valor}`;

}


function normalizarRespuesta(data) {

  // n8n puede devolver directamente un array
  if (Array.isArray(data)) {
    return data;
  }

  // O puede venir envuelto
  if (Array.isArray(data.data)) {
    return data.data;
  }

  // O una sola fila
  if (data && typeof data === 'object') {
    return [data];
  }

  return [];

}


function mostrarEditor(
  mostrar
) {

  emptyState.style.display =
    mostrar
      ? 'none'
      : 'grid';

  editor.classList.toggle(
    'show',
    mostrar
  );

}


function limpiarCiudad() {

  ciudadSelect.innerHTML =
    '<option value="">Selecciona ciudad</option>';

  ciudadSelect.disabled =
    true;

}


/**
 * Convierte una marca de tiempo de la Data Table en algo legible.
 * Acepta ISO completo ("2026-08-11T00:50:56.495Z") o fecha simple.
 */
function formatearMomento(valor) {

  if (!valor) {
    return '';
  }

  const texto =
    String(valor).trim();


  if (texto.includes('T')) {

    const fecha =
      new Date(texto);

    return isNaN(fecha)
      ? ''
      : fecha.toLocaleString(
          'es-ES',
          {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }
        );

  }


  const simple =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  return simple
    ? `${simple[3]}/${simple[2]}/${simple[1]}`
    : texto;

}


function textoMeta(registro) {

  const partes = [
    registro.ciudad || 'General',
    `ID ${registro.id}`
  ];

  const momento =
    formatearMomento(
      registro.updatedAt ||
      registro.ultima_actualizacion
    );

  if (momento) {

    partes.push(
      `Actualizado ${momento}`
    );

  }

  return partes.join(' · ');

}


/**
 * Mensaje fijo junto a los botones. A diferencia del toast, no
 * desaparece: deja constancia de la última escritura confirmada.
 */
function marcarEstadoGuardado(
  texto,
  tipo = ''
) {

  saveStatus.textContent =
    texto;

  saveStatus.className =
    `save-status ${tipo}`.trim();

}


/**
 * Compara lo enviado con lo que ha devuelto el servidor, para
 * detectar campos que la Data Table haya guardado de otra forma.
 */
function diferenciasConGuardado(
  enviado,
  guardado
) {

  return Object.keys(campos).filter(
    key => {

      const a =
        key.startsWith('fecha')
          ? normalizarFecha(enviado[key])
          : enviado[key];

      const b =
        key.startsWith('fecha')
          ? normalizarFecha(guardado[key])
          : guardado[key];

      return (
        String(a ?? '').trim() !==
        String(b ?? '').trim()
      );

    }
  );

}


function normalizarFecha(valor) {

  if (!valor) {
    return '';
  }

  /**
   * La Data Table puede devolver la fecha como ISO completo
   * ("2026-09-12T00:00:00.000Z"). Un input[type=date] solo
   * acepta YYYY-MM-DD: si le llega el ISO entero lo descarta
   * en silencio y la fecha se perdería al guardar.
   */
  const texto =
    String(valor).trim();

  const iso =
    texto.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

  return iso
    ? iso[1]
    : texto;

}


function asignarValor(
  key,
  value
) {

  const campo =
    campos[key];

  if (!campo) {
    return;
  }

  campo.value =
    campo.type === 'date'
      ? normalizarFecha(value)
      : value ?? '';

}


/**
 * ============================================================
 * CARGAR CURSO DESDE N8N
 * ============================================================
 */

async function cargarCurso(
  cursoId
) {

  registrosCurso =
    [];

  registroActual =
    null;

  limpiarCiudad();

  mostrarEditor(
    false
  );

  if (!cursoId) {
    return;
  }

  showLoader(
    true
  );

  setConnection(
    false,
    'Consultando...'
  );


  try {

    // GET: n8n recibe el curso en $json.query.curso_id
    // Ejemplo:
    // ?curso_id=formacion-anual
    const url =
      `${CONFIG.api.get}?curso_id=${encodeURIComponent(cursoId)}`;


    const response =
      await fetch(
        url,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `Error HTTP ${response.status}`
      );

    }


    const raw =
      await response.json();


    registrosCurso =
      normalizarRespuesta(
        raw
      );


    if (!registrosCurso.length) {

      throw new Error(
        'No se encontraron configuraciones para este curso.'
      );

    }


    ciudadSelect.innerHTML =
      '<option value="">Selecciona ciudad</option>';


    registrosCurso.forEach(
      registro => {

        const option =
          document.createElement(
            'option'
          );

        option.value =
          String(registro.id);

        option.textContent =
          registro.ciudad || 'General';

        ciudadSelect.appendChild(
          option
        );

      }
    );


    ciudadSelect.disabled =
      false;


    setConnection(
      true,
      'Conectado'
    );


    /**
     * Si solo hay una ciudad/modalidad,
     * la seleccionamos automáticamente.
     */
    if (
      registrosCurso.length === 1
    ) {

      ciudadSelect.value =
        String(
          registrosCurso[0].id
        );

      seleccionarRegistro(
        registrosCurso[0].id
      );

    }


  } catch (error) {

    console.error(
      error
    );

    setConnection(
      false,
      'Error de conexión'
    );

    showToast(
      error.message ||
      'No se pudo cargar la información.',
      'error'
    );

  } finally {

    showLoader(
      false
    );

  }

}


/**
 * ============================================================
 * SELECCIONAR FILA
 * ============================================================
 */

function seleccionarRegistro(
  id
) {

  marcarEstadoGuardado('');

  const registro =
    registrosCurso.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!registro) {

    registroActual =
      null;

    mostrarEditor(
      false
    );

    return;

  }


  registroActual =
    JSON.parse(
      JSON.stringify(
        registro
      )
    );


  cargarFormulario(
    registroActual
  );

}


/**
 * ============================================================
 * CARGAR FORMULARIO
 * ============================================================
 */

function cargarFormulario(
  registro
) {

  editorTitle.textContent =
    registro.curso_nombre ||
    registro.curso_id ||
    'Curso';


  editorMeta.textContent =
    textoMeta(registro);


  Object.keys(
    campos
  ).forEach(
    key => {

      asignarValor(
        key,
        registro[key]
      );

    }
  );


  actualizarBadge(
    registro.estado
  );


  mostrarEditor(
    true
  );

}


/**
 * ============================================================
 * CONSTRUIR PAYLOAD
 * ============================================================
 */

function construirPayload() {

  if (!registroActual) {

    throw new Error(
      'No hay ningún registro seleccionado.'
    );

  }


  return {

    id:
      registroActual.id,

    curso_id:
      registroActual.curso_id,

    curso_nombre:
      registroActual.curso_nombre,

    ciudad:
      registroActual.ciudad,

    activo:
      campos.activo.value,

    estado:
      campos.estado.value,

    fecha_inicio:
      campos.fecha_inicio.value,

    fecha_fin:
      campos.fecha_fin.value,

    calendario:
      campos.calendario.value.trim(),

    precio:
      campos.precio.value === ''
        ? 0
        : Number(
            campos.precio.value
          ),

    docente:
      campos.docente.value.trim(),

    horario:
      campos.horario.value.trim(),

    reserva:
      campos.reserva.value === ''
        ? ''
        : Number(
            campos.reserva.value
          ),

    link:
      campos.link.value.trim(),

    asunto_template:
      campos.asunto_template.value.trim(),

    copy_template:
      campos.copy_template.value,

    notas:
      campos.notas.value.trim(),

    ultima_actualizacion:
      new Date()
        .toISOString()
        .slice(0, 10)

  };

}


/**
 * ============================================================
 * GUARDAR
 * ============================================================
 */

async function guardarCambios(
  event
) {

  event.preventDefault();


  try {

    const payload =
      construirPayload();


    saveBtn.disabled =
      true;

    saveBtn.textContent =
      'Guardando...';


    const response =
      await fetch(
        CONFIG.api.save,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'Accept':
              'application/json'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );


    if (!response.ok) {

      let detail = '';

      try {

        detail =
          await response.text();

      } catch {}

      throw new Error(
        detail ||
        `Error HTTP ${response.status}`
      );

    }


    let respuesta = null;

    try {

      respuesta =
        await response.json();

    } catch {}


    /**
     * La confirmación se construye con la fila que devuelve n8n,
     * no con lo que acabamos de enviar: así lo que se ve en
     * pantalla es lo que ha quedado realmente en la Data Table.
     */

    const filas =
      respuesta
        ? normalizarRespuesta(respuesta)
        : [];

    const guardado =
      filas.find(
        fila =>
          fila &&
          String(fila.id) ===
          String(payload.id)
      ) || null;


    const confirmado =
      guardado || payload;


    Object.assign(
      registroActual,
      confirmado
    );


    const index =
      registrosCurso.findIndex(
        item =>
          String(item.id) ===
          String(payload.id)
      );


    if (index !== -1) {

      registrosCurso[index] =
        {
          ...registrosCurso[index],
          ...confirmado
        };

    }


    // Repinta el formulario con los valores confirmados.
    cargarFormulario(
      registroActual
    );


    const ciudad =
      registroActual.ciudad || 'General';

    const hora =
      new Date().toLocaleTimeString(
        'es-ES',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      );


    if (!guardado) {

      /**
       * n8n respondió, pero sin devolver la fila (por ejemplo con
       * "Respond immediately"). No podemos confirmar el contenido.
       */

      marcarEstadoGuardado(
        `Enviado a las ${hora} · sin confirmación del servidor`,
        'warn'
      );

      showToast(
        (respuesta && respuesta.message) ||
        'Cambios enviados correctamente.'
      );

      return;

    }


    const diferencias =
      diferenciasConGuardado(
        payload,
        guardado
      );


    if (diferencias.length) {

      marcarEstadoGuardado(
        `Guardado a las ${hora} con diferencias: ${diferencias.join(', ')}`,
        'warn'
      );

      showToast(
        `Guardado, pero la Data Table devolvió otros valores en: ${diferencias.join(', ')}`,
        'warning'
      );

      return;

    }


    marcarEstadoGuardado(
      `Guardado a las ${hora} · ${ciudad}`,
      'ok'
    );

    showToast(
      `Cambios guardados en la Data Table · ${ciudad}`
    );


  } catch (error) {

    console.error(
      error
    );

    showToast(
      error.message ||
      'No se pudieron guardar los cambios.',
      'error'
    );

  } finally {

    saveBtn.disabled =
      false;

    saveBtn.textContent =
      'Guardar cambios';

  }

}


/**
 * ============================================================
 * INSERTAR VARIABLES
 * ============================================================
 */

function insertarVariable(
  variable
) {

  const target =
    ultimoElementoCopyActivo ||
    campos.copy_template;


  if (
    ![
      campos.copy_template,
      campos.asunto_template
    ].includes(target)
  ) {

    return;

  }


  const start =
    target.selectionStart ??
    target.value.length;

  const end =
    target.selectionEnd ??
    start;


  target.value =
    target.value.slice(0, start) +
    variable +
    target.value.slice(end);


  const nuevaPosicion =
    start +
    variable.length;


  target.focus();


  target.setSelectionRange(
    nuevaPosicion,
    nuevaPosicion
  );

}


/**
 * ============================================================
 * EVENTOS
 * ============================================================
 */

cursoSelect.addEventListener(
  'change',
  () => {

    cargarCurso(
      cursoSelect.value
    );

  }
);


ciudadSelect.addEventListener(
  'change',
  () => {

    seleccionarRegistro(
      ciudadSelect.value
    );

  }
);


editor.addEventListener(
  'submit',
  guardarCambios
);


resetBtn.addEventListener(
  'click',
  () => {

    if (!registroActual) {
      return;
    }

    cargarFormulario(
      registroActual
    );

    marcarEstadoGuardado('');

    showToast(
      'Cambios descartados.'
    );

  }
);


campos.estado.addEventListener(
  'change',
  () => {

    actualizarBadge(
      campos.estado.value
    );

  }
);


campos.copy_template.addEventListener(
  'focus',
  () => {

    ultimoElementoCopyActivo =
      campos.copy_template;

  }
);


campos.asunto_template.addEventListener(
  'focus',
  () => {

    ultimoElementoCopyActivo =
      campos.asunto_template;

  }
);


document
  .querySelectorAll(
    '.variable'
  )
  .forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          insertarVariable(
            button.dataset.variable
          );

        }
      );

    }
  );


/**
 * ============================================================
 * SESIÓN
 * ============================================================
 */

const sesion = Auth.sesion();

document
  .getElementById('sesionUsuario')
  .textContent =
    (sesion && sesion.usuario) || '—';


document
  .getElementById('logoutBtn')
  .addEventListener(
    'click',
    () => {

      if (confirm('¿Cerrar la sesión?')) {
        Auth.cerrarSesion();
      }

    }
  );
