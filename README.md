# pijamaslucerito.com

Landing de marca de **Saramantha** (INDISUTEX S.A.S.). La venta se hace en el catálogo digital (`pijamasalmayor.com/saramantha`) y por WhatsApp. Esta página atrae y genera confianza, y lleva al cliente al catálogo.

Es HTML, CSS y JS sin frameworks ni proceso de compilación. Se publica en GitHub Pages.

## Estructura

```
index.html      Página principal
404.html        Página de error
css/styles.css  Estilos (colores y medidas en :root)
js/config.js    Configuración: catálogo, WhatsApp, vendedoras, redes, IDs de medición
js/main.js      Comportamiento: atribución, cookies, medición, menú móvil
robots.txt, sitemap.xml, CNAME, .nojekyll
```

## Cambios frecuentes

| Qué | Dónde |
|---|---|
| Número de WhatsApp, URL del catálogo | `js/config.js` (y los `href` por defecto en `index.html`) |
| Vendedoras (`?ws=nombre`) | `js/config.js` → `vendedoras` |
| Instagram / TikTok | `js/config.js` → `social` (la sección aparece sola al llenarlos) |
| Meta Pixel, GA4, Clarity | `js/config.js` → `tracking` |
| Efectos navideños (luces, nieve, insignia) | Clase `navidad` en `<html>`: quítala fuera de temporada |
| Sección del catálogo / temporada | Sección `#temporada` en `index.html` (imagen de fondo, textos y chips) |
| Preguntas frecuentes | Sección `#preguntas` **y** el JSON-LD `FAQPage` del `<head>`: deben coincidir |

## Reglas de contenido

- No publicar calificaciones, cifras de clientas ni testimonios que no se puedan demostrar.
- La analítica solo carga si la persona acepta las cookies.
- Las animaciones y la nieve se desactivan si el dispositivo pide reducir el movimiento.
- Las imágenes van con `width`/`height` o `aspect-ratio`, y `loading="lazy"` salvo la del hero.

## Ramas

- `main`: producción (lo que sirve GitHub Pages).
- `dev`: desarrollo. Se revisa y se fusiona a `main` para publicar.

## Probar en local

```bash
python3 -m http.server 8080
# abrir http://localhost:8080
```
