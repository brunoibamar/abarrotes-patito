# Abarrotes Patito

Demostración interactiva de un punto de venta para tablet, con una interfaz en español pensada para una persona sin experiencia con estos equipos.

## Abrir la demostración

Requiere Node.js 20 o posterior. No requiere instalar dependencias.

```sh
node server.js
```

Abrir http://127.0.0.1:43872 en el mismo equipo. No abrir index.html directamente: los módulos y el modo sin conexión necesitan HTTP. Para detener, usar Ctrl+C en la terminal que inició el servidor. El servidor de demostración solo acepta conexiones del propio equipo. Si hay npm instalado, también se puede usar `npm start`.

## Qué se puede probar

- Agregar productos con botones, buscar por nombre y usar códigos con lectores que emulan teclado y terminan con Enter. Códigos de prueba: `750100000001` (refresco), `750100000002` (papas), `750100000003` (cerveza). En “¿Cómo se usa?” hay simulaciones de lectura.
- Cobro en efectivo, pago exacto, teclado numérico, cálculo de cambio y confirmación.
- Correcciones antes de cobrar y devolución completa de una venta de la semana. La devolución repone toda la mercancía: solo usar el ejemplo si vuelve en condiciones de venta.
- Lácteos y jamón: leche y yogur por pieza; queso y jamón por peso. La lectura de la báscula se puede escribir en gramos o kilos. **No hay conexión automática con báscula.**
- Cigarros: recepción por cajetilla de 20 de ejemplo, venta solo por unidad. La cantidad por cajetilla deberá configurarse por presentación real.
- Productos: editar nombre, presentación, categoría, proveedor, dibujo, código, precio y piezas por caja. Las altas están exclusivamente en Proveedores: “Producto no registrado” dentro de una entrega. El proveedor se asigna automáticamente, la categoría se propone a partir del dibujo elegido y se vuelve a la misma entrega conservando lo ya contado. El producto se crea con existencia cero; solo se suma inventario al confirmar la recepción. La corrección manual de existencias está en una sección desplegable. Cambiar de unidad con existencias o ventas está bloqueado para evitar reinterpretar el inventario.
- Proveedores: elegir “Llegó Coca-Cola” y contar en una pantalla todas las presentaciones (300 ml, 600 ml, 1 litro y 3 litros). Cada renglón admite cajas y piezas sueltas simultáneamente. El tamaño de caja es configurable en Productos. La entrega completa se revisa y guarda en una sola operación; el pago desde caja se descuenta una sola vez.
- Productos y proveedores comparten el mismo catálogo: cambiar el proveedor de un artículo mueve su recepción al proveedor elegido. El inventario se recibe exclusivamente desde Proveedores.
- “Nuevo proveedor” permite registrar a cualquier repartidor; solo su nombre es obligatorio. “Editar” permite cambiar nombre, visita y nota manteniendo productos y entregas vinculados. Se rechazan nombres duplicados. Un proveedor puede entregar leche, refrescos y cualquier otro tipo de producto: el dibujo pertenece al producto, no al proveedor. El proveedor genérico previo se muestra como “Proveedor por confirmar” hasta asignarle su nombre real.
- Huevo por pieza: recibir cartones usa el número configurable de huevos por cartón. Huevo por kilo: se puede anotar el número de cartones y se debe introducir el peso total real, sin empaque. Los cartones no se convierten automáticamente a un peso supuesto. Se conserva en la entrega tanto el conteo como el peso. La misma mercancía debe registrarse una sola vez, en la modalidad elegida.
- Entradas/retiros de efectivo, cierre con diferencia y conservación del efectivo contado.
- Caja reúne en una sola vista el efectivo esperado, lo vendido hoy, el total semanal y los siete días. Debajo están los movimientos, el dinero para cambio, los gastos y el último cierre. Las devoluciones se abren en “Corregir una venta de esta semana”. El menú tiene cuatro opciones: Vender, Caja, Productos y Proveedores; no hay una sección semanal separada ni cifras repetidas en otra pantalla.
- Totales diarios de lunes a domingo; las ventas previas se eliminan al abrir/usar la aplicación en una semana nueva. El borrado no es una tarea de fondo mientras está cerrada. Inventario y saldo de caja se conservan.
- Proveedores de ejemplo, edición de su visita habitual y última recepción.

## Acabado visual e interacción

La paleta clara usa fondo verde salvia, tarjetas marfil, campos en verde suave y texto oscuro. El blanco puro se reserva a pequeños detalles de las ilustraciones. Los botones principales conservan un verde profundo para destacarse. Los colores están centralizados en `public/theme.css`; la paleta se aplica también a caja, proveedores, tablas, formularios y ventanas de cobro.

La interfaz incluye degradados suaves, sombras, botones con relieve, respuesta al presionar con mouse, teclado o pantalla táctil, onda breve de toque, confirmación visual de producto agregado, entrada suave de tarjetas y ventanas, actualización resaltada del carrito y dibujo animado de la marca de confirmación. Los importes correctos se muestran de inmediato: no se cuentan progresivamente ni se retrasa el cobro para esperar una animación.

Los efectos están en `public/effects.css` y `public/effects.js`, sin dependencias ni recursos externos. Se detienen con la preferencia del dispositivo de reducir movimiento. No hay animaciones decorativas continuas. Los controles deshabilitados conservan su estado inactivo. El service worker incluye estos recursos para el modo sin conexión de la demo.

## Límites de esta primera versión

**Es un prototipo, no un sistema listo para operar la tienda.** Productos, precios, piezas por caja y visitas son ficticios. No contiene fiado, deudas de proveedores, devoluciones parciales, permisos, exportación/restauración de respaldo ni sincronización en la nube. “Solo registrar lo que llegó” no crea una cuenta por pagar: permite probar inventario sin registrar un pago.

Los datos se guardan en `localStorage` del navegador bajo `patito-demo-v1`, mediante una sola escritura por operación. Los errores al guardar impiden completar la operación. Este almacenamiento sirve para evaluar la demo: no equivale a una base de datos local transaccional ni a un respaldo externo. Borrar datos del navegador o perder el equipo puede perder toda la demo. Usar una sola ventana; no está diseñada para operaciones concurrentes.

El huevo por pieza y por kilo tiene existencias separadas de ejemplo. Antes de implementar la operación real hay que definir el conteo y conversión con la tienda. La actualización agrega los nuevos productos de demostración una sola vez, conservando precios, inventario y ventas existentes.

Un service worker almacena la interfaz después de la primera carga correcta en localhost o HTTPS. Una vez activado, permite volver a abrirla sin servidor/conexión en el mismo navegador. No provee respaldo. En un dispositivo nuevo se requiere una primera carga; la instalación/distribución final en Android está pendiente. Cambios locales se obtienen con el servidor activo y recargando la página.

Las ventas se limitan a la semana actual, los cierres se depuran al guardar uno nuevo, los movimientos de caja se compactan al cerrar caja y las recepciones conservan la semana y referencias de proveedores. La política final de retención deberá aplicarse uniformemente también a los futuros respaldos.

## Validación

```sh
node --test
```

Pruebas de importes en centavos, existencias, ventas por peso, entregas con varios tamaños, cajas y piezas, pago único al proveedor, rechazo completo de entregas inválidas, edición y vinculación de productos, altas y renombrado de proveedores, dibujos independientes del proveedor, cartones con peso real obligatorio, actualización del catálogo sin pérdida de datos, devoluciones, confirmaciones duplicadas y cambio de semana.

## Siguientes etapas

1. Probar diseño con la encargada y validar tablet, lector y báscula.
2. Definir manejo real de productos vendidos por pieza y peso, cierre y correcciones.
3. Sustituir el almacenamiento de demostración por una base de datos local transaccional y recuperación ante interrupciones.
4. Incorporar las funciones restantes acordadas de proveedores/fiado y validar los tamaños de caja reales.
5. Implementar respaldos externos automáticos al conectarse, con restauración probada y política de retención semanal.
6. Empaquetar y validar la aplicación en el equipo elegido antes de usar datos reales.

## GitHub

Repositorio: [brunoibamar/abarrotes-patito](https://github.com/brunoibamar/abarrotes-patito).

- `main`: referencia estable revisada; esta primera versión sigue siendo una demostración.
- `develop`: cambios en preparación. El trabajo habitual se realiza aquí.
- GitHub revisa sintaxis y pruebas en ambas ramas. No hay despliegue automático.
- `.stable/`: checkout local separado de `main` para mantener su código independiente del trabajo en `develop`.

Ver [el procedimiento de actualización después del corte](docs/ACTUALIZACIONES.md). Las ramas guardan código, no el inventario de la tienda. El respaldo externo y el mecanismo que impida actualizar una tablet con la caja abierta siguen pendientes de implementación.
