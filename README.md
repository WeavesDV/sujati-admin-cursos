# Sujati · Administrador de cursos

Panel para editar los cursos de Spazio Bodywork guardados en la Data Table de n8n.

## Estructura

```
.
├── index.html            Redirige al acceso
├── login.html            Pantalla de acceso
├── admin.html            Panel de gestión (protegido)
├── robots.txt            Bloquea la indexación de todo el directorio
└── assets/
    ├── css/
    │   ├── base.css      Tokens de color, reset y botones (compartido)
    │   ├── login.css     Estilos del acceso
    │   └── admin.css     Estilos del panel
    └── js/
        ├── config.js        Webhooks, usuarios y duración de sesión
        ├── auth.js          Hash SHA-256, sesión y guard de páginas
        ├── login.js         Lógica del formulario de acceso
        ├── email-template.js Plantilla del correo (diseño Spazio)
        └── admin.js         Lógica del panel
```

Todo son archivos estáticos y scripts clásicos: funciona abriendo `index.html`
directamente o subiéndolo a cualquier hosting, sin build ni servidor.

## Acceso

Credenciales iniciales:

| Usuario  | Contraseña   |
|----------|--------------|
| `admin`  | `spazio2026` |
| `sujati` | `sujati2026` |

La sesión dura 8 horas, o 14 días si se marca "mantener sesión iniciada".

### Cambiar una contraseña

Las contraseñas se guardan como hash SHA-256, nunca en claro. Genera el nuevo hash:

```bash
printf 'nuevaClave' | sha256sum
```

y pega el resultado en el campo `hash` del usuario en `assets/js/config.js`.

### Alcance de la protección

Es autenticación **solo de cliente**: sirve para que el panel no quede a la vista
ni indexado, pero cualquiera que abra el código fuente ve la lista de usuarios y
sus hashes, y los webhooks de n8n siguen siendo llamables directamente.

Para protección real haría falta un `.htpasswd` (o Cloudflare Access) delante de
las páginas y un token en los webhooks.

## Vista previa del correo

Junto al editor del correo hay una vista previa que se actualiza mientras se
escribe. Muestra el copy ya montado sobre la plantilla de Spazio Bodywork
(cabecera con logo, banda malva, cuerpo, firma y pie) y con las variables
sustituidas por los datos del curso que está abierto, incluidos los cambios
todavía sin guardar.

- **Escritorio / Móvil** renderiza el correo a 600 px o a 380 px reales y lo
  reduce para que quepa en la columna, así que lo que se ve es la maqueta, no
  una versión readaptada.
- **Ampliar** abre el correo a tamaño real en una ventana.
- La franja amarilla avisa de las variables sin valor y de las que se han
  rellenado con un dato de ejemplo.

### Variables

Se escriben `{{variable}}` o `{variable}`. Además de las columnas de la Data
Table, la plantilla entiende estos alias:

| Alias            | Toma el valor de |
|------------------|------------------|
| `{{evento}}`     | `curso_nombre`   |
| `{{curso}}`      | `curso_nombre`   |
| `{{instructor}}` | `docente`        |
| `{{fecha_evento}}` | `fecha_inicio` |

`{{nombre}}`, `{{email}}` y `{{direccion}}` dependen del destinatario: no están
en la Data Table, así que en la vista previa se rellenan con un valor de ejemplo
y n8n las sustituye en el envío real.

Las fechas se muestran como "20 de febrero de 2026" y los importes como "350 €".

### Formato del copy

El copy se escribe en texto plano con estas marcas:

| Marca                      | Resultado |
|----------------------------|-----------|
| Línea en blanco            | Separa párrafos |
| `**texto**`                | Negrita |
| `## Título`                | Subtítulo |
| `> línea`                  | Caja rosa destacada |
| `\| línea`                 | Caja blanca con borde |
| `[boton:URL]Texto[/boton]` | Botón centrado |
| `---`                      | Línea separadora |

Los botones bajo "Correo automático" insertan cada bloque en el punto donde esté
el cursor.

El asunto se usa también como titular de la banda malva, y la ciudad como
antetítulo.

Si el copy contiene HTML completo (una `<table>`, un `<div>`…) se respeta tal
cual y no se le aplica la plantilla: sirve para pegar un correo ya maquetado.

### Cómo enviar exactamente lo que se ve

El panel guarda en la Data Table el copy **en texto plano con sus marcas**, no el
HTML. Para que el correo que sale de n8n sea idéntico a la vista previa, el flujo
de envío tiene que hacer el mismo montaje. `assets/js/email-template.js` no
depende del navegador ni de ningún paquete, así que se puede pegar entero en un
nodo **Code** de n8n y llamarlo igual que aquí:

```js
// Nodo Code, justo antes del nodo de envío.
// (pegar arriba el contenido de email-template.js)

const correo = EmailTemplate.render({
  asunto: $json.asunto_template,
  copy:   $json.copy_template,
  registro: { ...$json, nombre: $json.nombre_destinatario }
});

return [{ json: { asunto: correo.asunto, html: correo.html } }];
```

Mientras el flujo no haga ese paso, la vista previa enseña el diseño final pero
el correo enviado seguirá saliendo como lo monte n8n hoy.


## Webhooks

Se configuran en `assets/js/config.js`:

- `api.get` — devuelve las filas de un curso; recibe `?curso_id=…` por GET.
- `api.save` — recibe el registro completo por POST en JSON.

Las URLs `/webhook-test/` de n8n solo responden **una vez** tras pulsar
"Execute workflow" en el canvas. Para uso normal cambia `webhook-test` por
`webhook`.

Si el panel se abre desde `file://` o desde otro dominio, el nodo
"Respond to Webhook" debe devolver la cabecera `Access-Control-Allow-Origin`
o el navegador bloqueará la respuesta.

## Publicación

El proyecto está publicado con GitHub Pages:

<https://weavesdv.github.io/sujati-admin-cursos/>

Cada `git push` a `main` vuelve a desplegar el sitio en un par de minutos.

Un matiz sobre `robots.txt`: los buscadores solo leen el que está en la raíz
del dominio (`weavesdv.github.io/robots.txt`), que no controlamos. Lo que de
verdad mantiene el panel fuera de los buscadores es la etiqueta
`<meta name="robots" content="noindex">` que llevan las tres páginas.

Al ser un repositorio público, el código es visible para cualquiera: eso
incluye los usuarios con sus hashes y las URLs de los webhooks de n8n. Ver
"Alcance de la protección" más arriba.
