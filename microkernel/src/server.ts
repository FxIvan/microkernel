import express from 'express';
import { DataValidatorPlugin, NotificationSenderPlugin } from './initial.plugins';
import { Microkernel } from './kernel';
import ArticlePlugin from '../../plugins/article.plugin';
import PushNotificationPlugin from '../../plugins/push-notification.plugin';
import MetricsPlugin from '../../plugins/metrics.plugin';

const app = express();
const port = 3000;
const kernel = new Microkernel();

app.use(express.json());

console.log('=== Inicializando Microkernel — Medio Digital ===');

// --- Plugins base del sistema ---
kernel.register('validator', new DataValidatorPlugin());
kernel.register('notifier', new NotificationSenderPlugin());

// --- Plugins del medio digital (conectados vía EventBus) ---
kernel.register('articles', new ArticlePlugin());
kernel.register('push-notifications', new PushNotificationPlugin());
kernel.register('metrics', new MetricsPlugin());

console.log('=================================================\n');

// ─────────────────────────────────────────────────────
// RUTAS GENÉRICAS DEL KERNEL
// ─────────────────────────────────────────────────────

app.get('/plugins', (req, res) => {
    res.json({ registered_plugins: kernel.getRegisteredPlugins() });
});

app.post('/execute/:pluginName', (req, res) => {
    const { pluginName } = req.params;
    const { data } = req.body;
    const result = kernel.execute(pluginName, data);
    res.status(result.success ? 200 : 404).json(result);
});

app.post('/plugins/register', async (req, res) => {
    const { name, path } = req.body;
    if (!name || !path) {
        return res.status(400).json({ success: false, message: 'Se requiere nombre (name) y ruta (path) del plugin.' });
    }
    const success = await kernel.loadAndRegister({ name, path });
    res.status(success ? 201 : 500).json({
        success,
        message: success ? `Plugin '${name}' registrado exitosamente.` : `Fallo al registrar el plugin '${name}'.`,
    });
});

app.delete('/plugins/unregister/:pluginName', (req, res) => {
    const { pluginName } = req.params;
    kernel.unregister(pluginName);
    res.status(200).json({ success: true, message: `Plugin '${pluginName}' desregistrado.` });
});

// ─────────────────────────────────────────────────────
// RUTAS DEL MEDIO DIGITAL
// Cuando se publica un artículo, el EventBus notifica automáticamente
// a PushNotificationPlugin y MetricsPlugin sin acoplamiento directo.
// ─────────────────────────────────────────────────────

// POST /articles — Publicar un artículo
// Dispara automáticamente: notificaciones push + registro de métricas
app.post('/articles', (req, res) => {
    const articlePlugin = kernel.getPlugin<ArticlePlugin>('articles');
    if (!articlePlugin) return res.status(503).json({ error: 'Plugin de artículos no disponible.' });

    const { id, title, author, content, category } = req.body;
    if (!id || !title || !author || !content || !category) {
        return res.status(400).json({ error: 'Faltan campos: id, title, author, content, category.' });
    }

    articlePlugin.process({ id, title, author, content, category });
    res.status(201).json({ success: true, message: `Artículo "${title}" publicado. Notificaciones y métricas actualizadas automáticamente.` });
});

// GET /articles — Listar todos los artículos
app.get('/articles', (req, res) => {
    const articlePlugin = kernel.getPlugin<ArticlePlugin>('articles');
    if (!articlePlugin) return res.status(503).json({ error: 'Plugin de artículos no disponible.' });

    const { category } = req.query;
    const articles = category
        ? articlePlugin.getByCategory(category as string)
        : articlePlugin.getAll();

    res.json({ total: articles.length, articles });
});

// POST /articles/:id/view — Registrar vista de un artículo
app.post('/articles/:id/view', (req, res) => {
    const { id } = req.params;
    const { category } = req.body;
    // El EventBus propaga el evento a ArticlePlugin y MetricsPlugin
    kernel.getEventBus().publish('article:viewed', { id, category });
    res.json({ success: true, message: `Vista registrada para artículo ${id}.` });
});

// GET /metrics — Panel de métricas en tiempo real
app.get('/metrics', (req, res) => {
    const metricsPlugin = kernel.getPlugin<MetricsPlugin>('metrics');
    if (!metricsPlugin) return res.status(503).json({ error: 'Plugin de métricas no disponible.' });

    res.json(metricsPlugin.getSummary());
});

// GET /events — Ver historial del EventBus (auditoría)
app.get('/events', (req, res) => {
    res.json({ eventLog: kernel.getEventBus().getEventLog() });
});

// ─────────────────────────────────────────────────────

app.listen(port, () => {
    console.log(`Servidor del Microkernel escuchando en http://localhost:${port}`);
    console.log('Plugins activos:', kernel.getRegisteredPlugins());
    console.log('\nRutas disponibles:');
    console.log('  POST   /articles              → Publicar artículo (dispara eventos)');
    console.log('  GET    /articles?category=X   → Listar artículos');
    console.log('  POST   /articles/:id/view     → Registrar vista');
    console.log('  GET    /metrics               → Panel de métricas en tiempo real');
    console.log('  GET    /events                → Historial del EventBus');
    console.log('  GET    /plugins               → Plugins registrados');
    console.log('─────────────────────────────────────────────────');
});

