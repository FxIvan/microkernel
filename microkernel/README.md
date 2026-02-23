# Arquitectura de Microkernel - Demo Funcional

Este proyecto es una demostración práctica del patrón de arquitectura de microkernel (o plug-ins) utilizando Node.js, Express y TypeScript.

## Requisitos

- Node.js (v14 o superior)
- npm

## Cómo Empezar

1.  **Instalar dependencias:**
    Ejecuta el siguiente comando para instalar los paquetes necesarios.

    ```bash
    npm install
    ```

2.  **Iniciar el servidor:**
    Una vez instaladas las dependencias, puedes iniciar el servidor del microkernel.

    ```bash
    npm start
    ```

    Deberías ver en tu consola un mensaje indicando que el servidor está escuchando en el puerto 3000 y que los plugins base (`validator` y `notifier`) han sido cargados.

    ```
    Inicializando kernel con plugins base...
    REGISTRANDO plugin: 'validator'
    Plugin de Validación inicializado...
    REGISTRANDO plugin: 'notifier'
    Plugin de Notificaciones inicializado...
    -------------------------------------
    Servidor del Microkernel escuchando en http://localhost:3000
    Plugins actualmente cargados: [ 'validator', 'notifier' ]
    -------------------------------------
    ```

## Comandos de la API (Ejemplos con `curl`)

Abre una nueva terminal para ejecutar estos comandos y así poder interactuar con el servidor del microkernel.

### 1. Listar Plugins Registrados

Este endpoint te permite ver qué plugins están actualmente cargados en memoria.

```bash
curl http://localhost:3000/plugins
```

_Respuesta esperada (al inicio):_

```json
{
  "registered_plugins": ["validator", "notifier"]
}
```

### 2. Registrar un Nuevo Plugin Dinámicamente

Este es el comando para cargar un plugin externo en tiempo de ejecución. En este caso, cargaremos el `logger.plugin.ts` que se encuentra en la carpeta `plugins` del directorio principal.

```bash
curl -X POST -H "Content-Type: application/json" -d '{"name": "logger", "path": "ruta.ts"}' http://localhost:3000/plugins/register
```

_Respuesta esperada:_

```json
{
  "success": true,
  "message": "Plugin 'logger' registrado exitosamente."
}
```

Después de ejecutar esto, si vuelves a listar los plugins, verás que `logger` ahora está incluido.

### 3. Ejecutar un Plugin

Ahora que el plugin `logger` está registrado, puedes pedirle al núcleo que ejecute su lógica.

```bash
curl -X POST -H "Content-Type: application/json" -d '{"data": "Este es mi primer evento dinámico"}' http://localhost:3000/execute/logger
```

En la consola donde tienes corriendo el servidor, deberías ver el mensaje del log.

También puedes ejecutar los plugins base:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"data": {"user": "John"}}' http://localhost:3000/execute/validator
```

### 4. Desregistrar un Plugin

Si quieres eliminar un plugin del sistema, puedes usar este endpoint.

```bash
curl -X DELETE http://localhost:3000/plugins/unregister/logger
```

_Respuesta esperada:_

```json
{
  "success": true,
  "message": "Plugin 'logger' desregistrado."
}
```

Si intentas listar los plugins de nuevo, verás que `logger` ha desaparecido.


### Arquitectura resultante

┌──────────────────────────────────────────────────┐
│                  MICROKERNEL                     │
│   kernel.ts  +  EventBus (event-bus.ts)          │
└──────────┬───────────────────────────────────────┘
           │ register() + onEventBusReady()
     ┌─────┼──────────────┐
     ▼     ▼              ▼
┌─────────────┐  ┌──────────────────┐  ┌──────────────┐
│ArticlePlugin│  │PushNotification  │  │MetricsPlugin │
│             │  │Plugin            │  │              │
│ process()───┼─►│ 🔔 auto-notifica │  │ 📊 auto-     │
│ emit:       │  │ suscriptores por │  │ registra     │
│article:     │  │ categoría        │  │ eventos en   │
│published    │  │                  │  │ tiempo real  │
└─────────────┘  └──────────────────┘  └──────────────┘
       │                 ▲                    ▲
       └────── EventBus ─┴────────────────────┘

### Flujo al publicar un artículo

````
This is the code block that represents the suggested code change:
```markdown
POST /articles  →  ArticlePlugin.process()
                        │
                        └→ EventBus.publish('article:published')
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
         PushNotificationPlugin       MetricsPlugin
         (notifica suscriptores       (registra métrica
          interesados en la           en tiempo real)
          categoría)
```
