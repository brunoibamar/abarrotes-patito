# Trabajo separado de la versión estable

## Ramas

| Rama | Uso |
| --- | --- |
| `main` | Código revisado que sirve como referencia estable. La primera publicación sigue siendo una demostración. |
| `develop` | Trabajo cotidiano y pruebas de funciones nuevas. Es la rama de este espacio de trabajo. |

Se usa `develop` porque las siguientes tareas pueden ser funciones nuevas, arreglos o cambios de diseño; no solo reorganizaciones de código, que suelen llamarse refactorizaciones.

Los cambios se preparan en `develop` y se revisan mediante una solicitud de cambios hacia `main`. Las comprobaciones de GitHub ejecutan las pruebas sin desplegar el sistema. Ambas ramas comienzan con la misma versión.

## Dos carpetas locales

El espacio de trabajo normal contiene `develop`. La carpeta `.stable/` contiene un checkout independiente de `main`, creado con Git worktree. Está excluida de los archivos publicados, igual que `preview/` y los respaldos.

**No ejecutar la instalación que use una clienta desde la carpeta donde se editan archivos de develop.** Cambiar una rama no mantiene fijos los archivos que sirve un proceso iniciado en esa misma carpeta.

Desde la raíz del proyecto, si aún no existe el checkout estable:

```powershell
git worktree add .stable main
```

Para probar el código estable localmente, abrir otra terminal en `.stable/` y usar un puerto distinto:

```powershell
$env:PORT = '43873'
node server.js
```

La demo de trabajo usa http://127.0.0.1:43872 y la prueba estable usa http://127.0.0.1:43873. Son direcciones distintas: sus datos de navegador también están separados. El servidor solo escucha en el propio equipo; estas direcciones todavía no distribuyen la aplicación a una tablet.

**No cambiar la dirección de la instalación de una tienda para actualizarla.** Los datos actuales del navegador están asociados a su dirección y perfil. Cambiar el puerto, dominio, navegador o perfil puede hacer que aparezca un inventario nuevo, aunque los datos anteriores sigan en la dirección original.

## Después de un corte de caja

Antes de operar con datos reales se necesitan el almacenamiento final, respaldo externo, restauración probada e instalación de tablet. Cuando esos elementos existan, el procedimiento será:

1. Probar el cambio en `develop`, especialmente recepción, existencias, cobro, devoluciones y actualización de datos existentes.
2. Revisar la solicitud de cambios hacia `main` y confirmar que las comprobaciones pasaron.
3. Acordar la ventana de actualización. Terminar la compra en curso, realizar el corte y dejar de usar la caja.
4. Guardar un respaldo externo y comprobar que se pueda recuperar. Un corte de caja no es un respaldo del inventario.
5. Integrar la versión revisada a `main`, anotar el commit o versión que se instalará y actualizar únicamente la copia estable. No copiar el inventario usado en las pruebas.
6. Abrir la versión instalada en la misma dirección/perfil de siempre y comprobar que productos, precios, existencias y saldo de caja siguen correctos antes de volver a vender.

No integrar ni reemplazar archivos de `.stable/` mientras una instalación servida desde allí esté operando. Después del corte, con esa instalación detenida, se puede actualizar su copia con `git -C .stable pull --ff-only origin main`. Conservar la versión previa del código y un respaldo compatible de datos para poder recuperar la instalación si la actualización falla. Volver a un commit anterior no revierte automáticamente las migraciones de datos.

## Límites actuales

Las ramas separan el código; **no contienen el inventario de la clienta ni programan la actualización de la tablet**. El prototipo usa almacenamiento del navegador, todavía no tiene respaldo/restauración externos y su service worker puede incorporar cambios al volver a cargar los archivos publicados. No hay todavía un bloqueo que compruebe el corte antes de actualizar.

Por eso no se configura despliegue automático: desarrollar en una copia separada es el primer paso. El mecanismo de actualización controlada, con detección de caja abierta y migraciones recuperables, debe implementarse y probarse antes de usarlo en una tienda real.
