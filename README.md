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
        ├── config.js     Webhooks, usuarios y duración de sesión
        ├── auth.js       Hash SHA-256, sesión y guard de páginas
        ├── login.js      Lógica del formulario de acceso
        └── admin.js      Lógica del panel
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
