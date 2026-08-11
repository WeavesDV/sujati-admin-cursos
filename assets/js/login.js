/**
 * ============================================================
 * PANTALLA DE ACCESO
 * ============================================================
 */

const form = document.getElementById('loginForm');
const inputUsuario = document.getElementById('usuario');
const inputClave = document.getElementById('clave');
const inputRecordar = document.getElementById('recordar');
const submitBtn = document.getElementById('submitBtn');
const alertBox = document.getElementById('alert');


function mostrarError(mensaje) {

  alertBox.textContent = mensaje;
  alertBox.classList.add('visible');

}


function limpiarError() {

  alertBox.textContent = '';
  alertBox.classList.remove('visible');

}


// Si ya hay sesión válida no tiene sentido volver a pedir el login.
Auth.saltarSiHaySesion();


form.addEventListener(
  'submit',
  async (evento) => {

    evento.preventDefault();

    limpiarError();

    const usuario = inputUsuario.value.trim();
    const clave = inputClave.value;

    if (!usuario || !clave) {

      mostrarError('Completa usuario y contraseña.');

      return;

    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Comprobando…';

    try {

      const correcto = await Auth.iniciarSesion(
        usuario,
        clave,
        inputRecordar.checked
      );

      if (!correcto) {

        mostrarError('Usuario o contraseña incorrectos.');

        inputClave.value = '';
        inputClave.focus();

        return;

      }

      location.replace(CONFIG.rutas.panel);

    } catch (error) {

      console.error(error);

      mostrarError(
        'No se pudo validar el acceso. Recarga la página e inténtalo de nuevo.'
      );

    } finally {

      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';

    }

  }
);


inputUsuario.focus();
