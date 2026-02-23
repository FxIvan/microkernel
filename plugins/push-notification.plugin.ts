import { Plugin } from '../microkernel/src/plugin.interface';
import { EventBus } from '../microkernel/src/event-bus';

interface Subscriber {
    id: string;
    name: string;
    categories: string[];
}

/**
 * PushNotificationPlugin: Escucha eventos del bus y envía notificaciones push.
 * NO conoce a ArticlePlugin directamente — reacciona al evento 'article:published'.
 * Esto es la clave del desacoplamiento en alta concurrencia:
 * si este plugin cae o se actualiza, el resto del sistema sigue funcionando.
 */
export default class PushNotificationPlugin implements Plugin {
    name = 'PushNotificationPlugin';

    // Simulación de suscriptores del medio digital
    private subscribers: Subscriber[] = [
        { id: '1', name: 'Ana García', categories: ['tecnologia', 'noticias'] },
        { id: '2', name: 'Carlos López', categories: ['deportes'] },
        { id: '3', name: 'María Ruiz', categories: ['noticias', 'cultura', 'tecnologia'] },
    ];

    initialize(): void {
        console.log('[PushNotificationPlugin] Plugin de Notificaciones Push inicializado.');
        console.log(`[PushNotificationPlugin] ${this.subscribers.length} suscriptores registrados.`);
    }

    onEventBusReady(eventBus: EventBus): void {
        // Reacciona automáticamente cuando se publica un artículo
        eventBus.subscribe('article:published', (article) => {
            this.notifySubscribers(article);
        });
    }

    /**
     * También permite enviar notificaciones manuales.
     */
    process(data: { title: string; message: string; targetAll?: boolean }): void {
        console.log(`[PushNotificationPlugin] 🔔 Notificación manual: "${data.message}"`);
    }

    private notifySubscribers(article: { title: string; category: string; author: string }): void {
        const interested = this.subscribers.filter(s =>
            s.categories.includes(article.category)
        );

        if (interested.length === 0) {
            console.log(`[PushNotificationPlugin] Sin suscriptores para la categoría '${article.category}'.`);
            return;
        }

        interested.forEach(subscriber => {
            // En producción: llamada a FCM, APNs, OneSignal, etc.
            console.log(
                `[PushNotificationPlugin] 🔔 Push → ${subscriber.name}: ` +
                `"Nuevo artículo: ${article.title}" (${article.category})`
            );
        });
    }

    addSubscriber(subscriber: Subscriber): void {
        this.subscribers.push(subscriber);
        console.log(`[PushNotificationPlugin] Nuevo suscriptor registrado: ${subscriber.name}`);
    }

    getSubscribers(): Subscriber[] {
        return this.subscribers;
    }
}
