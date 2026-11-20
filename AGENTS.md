# Abarrotes Patito

## Ramas y operación

- El repositorio del proyecto es https://github.com/brunoibamar/abarrotes-patito.git.
- Trabajar en `develop` o en una rama de trabajo creada desde `develop`. `main` es la referencia estable revisada.
- Antes de editar, revisar la rama y el estado de Git. Conservar cambios del usuario.
- La carpeta local `.stable/` es un checkout separado de `main`. No editar archivos allí ni cambiar esa instalación mientras la caja esté en uso. Consultar `docs/ACTUALIZACIONES.md`.
- Las revisiones automáticas de GitHub solo comprueban código; no deben publicar ni actualizar producción automáticamente.
- Promover cambios futuros a `main` e instalarlos según la autorización del usuario y la ventana acordada después del corte. La publicación inicial de `main` y `develop` fue solicitada expresamente.

## Datos y accesibilidad

- Es una demostración y aún no está lista para operar con inventario real. No presentar ramas o service worker como respaldo, bloqueo de caja o protección automática de datos.
- Productos, inventario, proveedores y caja de una instalación nunca se guardan en Git. No subir respaldos, archivos de datos ni credenciales.
- Conservar la clave de almacenamiento y probar migraciones compatibles antes de cambiar el formato. Nunca reemplazar información de una instalación por el catálogo de ejemplo al actualizarla.
- Mantener texto grande, acciones claras, paleta salvia/marfil, contraste y respeto por la preferencia de reducir movimiento.
- La recepción y el alta de productos están en Proveedores. El menú es Vender, Caja, Productos y Proveedores. Caja incluye el resumen semanal.

## Verificación

- Iniciar la demo con `node server.js`. No requiere instalar dependencias.
- Ejecutar `node --test` para cambios de comportamiento o datos y comprobar sintaxis de los archivos modificados.
- Para cambios visuales, revisar las pantallas y el funcionamiento afectado en la vista de tablet. No añadir pruebas que solo repliquen estilos.
