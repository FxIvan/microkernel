# Arquitectura de Microkernel — Demo Funcional

Demostración práctica del patrón de arquitectura microkernel usando Node.js, Express y TypeScript. El caso de uso es un **medio digital**: al publicar un artículo, el sistema automáticamente envía notificaciones push y registra métricas, sin que los plugins se conozcan entre sí.

## Plugins activos al iniciar

| Nombre               | Responsabilidad                                       |
|----------------------|-------------------------------------------------------|
| `validator`          | Valida que los datos no sean nulos                    |
| `notifier`           | Envía notificaciones genéricas                        |
| `articles`           | Gestiona publicación y listado de artículos           |
| `push-notifications` | Notifica suscriptores por categoría vía el EventBus   |
| `metrics`            | Registra estadísticas de eventos en tiempo real       |

## Requisitos

- Node.js v14 o superior
- npm

## Cómo Empezar

1. **Instalar dependencias:**

   ```bash
   npm install
   ```

2. **Iniciar el servidor:**

   ```bash
   npm start
   ```

   Salida esperada en consola:

   ```
   === Inicializando Microkernel — Medio Digital ===
   REGISTRANDO plugin: 'validator'
   REGISTRANDO plugin: 'notifier'
   REGISTRANDO plugin: 'articles'
   REGISTRANDO plugin: 'push-notifications'
   REGISTRANDO plugin: 'metrics'
   =================================================

   Servidor del Microkernel escuchando en http://localhost:3000
   Plugins activos: [ 'validator', 'notifier', 'articles', 'push-notifications', 'metrics' ]
   ```

---

## API Reference

Abre una nueva terminal para ejecutar los comandos mientras el servidor corre.

---

### Rutas del Medio Digital

---

#### `POST /articles` — Publicar un artículo

Publica un nuevo artículo. Dispara automáticamente el evento `article:published` en el EventBus, lo que provoca que `PushNotificationPlugin` notifique suscriptores y `MetricsPlugin` registre la métrica, sin ninguna llamada directa entre plugins.

**Body (JSON):**

| Campo      | Tipo     | Requerido | Descripción                                                    |
|------------|----------|-----------|----------------------------------------------------------------|
| `id`       | `string` | ✅        | Identificador único del artículo                               |
| `title`    | `string` | ✅        | Título del artículo                                            |
| `author`   | `string` | ✅        | Nombre del autor                                               |
| `content`  | `string` | ✅        | Cuerpo del artículo                                            |
| `category` | `string` | ✅        | Una de: `noticias`, `deportes`, `tecnologia`, `cultura`        |

```bash
curl -X POST http://localhost:3000/articles \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "title": "Node.js 22 ya está en LTS",
    "author": "Ana García",
    "content": "Contenido completo del artículo...",
    "category": "tecnologia"
  }'
```

**Respuesta `201`:**

```json
{
  "success": true,
  "message": "Artículo \"Node.js 22 ya está en LTS\" publicado. Notificaciones y métricas actualizadas automáticamente."
}
```

---

#### `GET /articles` — Listar artículos

Devuelve todos los artículos publicados. Opcionalmente filtra por categoría.

**Query params:**

| Parámetro  | Tipo     | Requerido | Descripción                                           |
|------------|----------|-----------|-------------------------------------------------------|
| `category` | `string` | ❌        | Filtra por categoría: `noticias`, `deportes`, etc.    |

```bash
# Todos los artículos
curl http://localhost:3000/articles

# Solo tecnología
curl "http://localhost:3000/articles?category=tecnologia"
```

**Respuesta `200`:**

```json
{
  "total": 1,
  "articles": [
    {
      "id": "1",
      "title": "Node.js 22 ya está en LTS",
      "author": "Ana García",
      "content": "Contenido completo del artículo...",
      "category": "tecnologia",
      "publishedAt": "2026-02-23T10:00:00.000Z",
      "views": 0
    }
  ]
}
```

---

#### `POST /articles/:id/view` — Registrar vista de un artículo

Publica el evento `article:viewed` en el EventBus. `ArticlePlugin` incrementa el contador de vistas y `MetricsPlugin` registra la métrica, sin que el endpoint llame a ningún plugin directamente.

**Params:**

| Parámetro | Tipo     | Descripción                          |
|-----------|----------|--------------------------------------|
| `id`      | `string` | ID del artículo al que se registra la vista |

**Body (JSON):**

| Campo      | Tipo     | Requerido | Descripción                              |
|------------|----------|-----------|------------------------------------------|
| `category` | `string` | ✅        | Categoría del artículo (para métricas)   |

```bash
curl -X POST http://localhost:3000/articles/1/view \
  -H "Content-Type: application/json" \
  -d '{ "category": "tecnologia" }'
```

**Respuesta `200`:**

```json
{
  "success": true,
  "message": "Vista registrada para artículo 1."
}
```

---

#### `GET /metrics` — Panel de métricas en tiempo real

Devuelve el resumen generado por `MetricsPlugin`: total de eventos, conteo por tipo de evento, conteo por categoría y los últimos 5 registros.

```bash
curl http://localhost:3000/metrics
```

**Respuesta `200`:**

```json
{
  "totalEvents": 3,
  "byEvent": {
    "article:published": 1,
    "article:viewed": 2
  },
  "byCategory": {
    "tecnologia": 1
  },
  "lastRecords": [
    {
      "event": "article:published",
      "timestamp": "2026-02-23T10:00:00.000Z",
      "category": "tecnologia",
      "details": {}
    }
  ]
}
```

---

#### `GET /events` — Historial del EventBus

Devuelve el log de todos los eventos publicados en el EventBus. Útil para auditoría y debugging.

```bash
curl http://localhost:3000/events
```

**Respuesta `200`:**

```json
{
  "eventLog": [
    { "event": "article:published", "timestamp": "2026-02-23T10:00:00.000Z" },
    { "event": "article:viewed",    "timestamp": "2026-02-23T10:01:00.000Z" }
  ]
}
```

---

### Rutas del Kernel (Gestión de Plugins)

---

#### `GET /plugins` — Listar plugins registrados

```bash
curl http://localhost:3000/plugins
```

**Respuesta `200`:**

```json
{
  "registered_plugins": ["validator", "notifier", "articles", "push-notifications", "metrics"]
}
```

---

#### `POST /execute/:pluginName` — Ejecutar un plugin por nombre

Invoca el método `process()` del plugin indicado con el payload `data`.

**Params:**

| Parámetro    | Tipo     | Descripción                   |
|--------------|----------|-------------------------------|
| `pluginName` | `string` | Nombre del plugin a ejecutar  |

**Body (JSON):**

| Campo  | Tipo  | Requerido | Descripción                               |
|--------|-------|-----------|-------------------------------------------|
| `data` | `any` | ✅        | Payload que se pasa al método `process()` |

```bash
# Ejecutar el validador
curl -X POST http://localhost:3000/execute/validator \
  -H "Content-Type: application/json" \
  -d '{ "data": { "user": "Ana", "email": "ana@ejemplo.com" } }'

# Ejecutar el notifier manualmente
curl -X POST http://localhost:3000/execute/notifier \
  -H "Content-Type: application/json" \
  -d '{ "data": "Mensaje de prueba" }'
```

**Respuesta `200`:**

```json
{
  "success": true,
  "message": "Plugin 'validator' ejecutado."
}
```

**Respuesta `404` (plugin no registrado):**

```json
{
  "success": false,
  "message": "ERROR: El plugin 'validator' no se encuentra registrado."
}
```

---

#### `POST /plugins/register` — Registrar un plugin dinámicamente

Carga un plugin externo desde el disco en tiempo de ejecución sin reiniciar el servidor. El archivo debe exportar una clase por defecto que implemente la interfaz `Plugin`.

**Body (JSON):**

| Campo  | Tipo     | Requerido | Descripción                                                                   |
|--------|----------|-----------|-------------------------------------------------------------------------------|
| `name` | `string` | ✅        | Nombre con el que se identificará el plugin en el kernel                      |
| `path` | `string` | ✅        | Ruta relativa al directorio de trabajo (`process.cwd()`) del archivo del plugin |

```bash
curl -X POST http://localhost:3000/plugins/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "logger",
    "path": "plugins/logger.plugin.ts"
  }'
```

**Respuesta `201`:**

```json
{
  "success": true,
  "message": "Plugin 'logger' registrado exitosamente."
}
```

**Respuesta `500` (fallo al cargar):**

```json
{
  "success": false,
  "message": "Fallo al registrar el plugin 'logger'."
}
```

---

#### `DELETE /plugins/unregister/:pluginName` — Desregistrar un plugin

Elimina el plugin del kernel. Sus suscripciones al EventBus persisten si el plugin no las limpió con `unsubscribe` antes de ser removido.

**Params:**

| Parámetro    | Tipo     | Descripción                   |
|--------------|----------|-------------------------------|
| `pluginName` | `string` | Nombre del plugin a eliminar  |

```bash
curl -X DELETE http://localhost:3000/plugins/unregister/logger
```

**Respuesta `200`:**

```json
{
  "success": true,
  "message": "Plugin 'logger' desregistrado."
}
```

---

## Flujo de eventos

```
POST /articles
      │
      ▼
ArticlePlugin.process()
      │  guarda artículo en memoria
      └─► EventBus.publish('article:published')
                │
      ┌─────────┴──────────┐
      ▼                    ▼
PushNotificationPlugin   MetricsPlugin
(filtra suscriptores     (registra evento
 por categoría y          en tiempo real)
 notifica)


POST /articles/:id/view
      │
      ▼
EventBus.publish('article:viewed')
      │
      ├─► ArticlePlugin   → incrementa article.views
      └─► MetricsPlugin   → registra métrica de vista
```
