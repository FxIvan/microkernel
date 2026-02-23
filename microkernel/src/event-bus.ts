import { EventEmitter } from 'events';

export type EventHandler = (payload: any) => void;

/**
 * EventBus: Canal central de comunicación entre plugins.
 * Permite que los plugins se comuniquen sin acoplarse directamente entre sí.
 * Esto es clave para alta concurrencia: los plugins emiten eventos y reaccionan
 * de forma asíncrona sin bloquearse mutuamente.
 */
export class EventBus {
    private emitter: EventEmitter;
    private eventLog: { event: string; timestamp: string }[] = [];

    constructor() {
        this.emitter = new EventEmitter();
        // Aumentamos el límite para soportar muchos suscriptores (alta concurrencia)
        this.emitter.setMaxListeners(100);
    }

    /**
     * Publica un evento en el bus. Todos los suscriptores reaccionan de inmediato.
     */
    publish(event: string, payload: any): void {
        console.log(`[EventBus] 📢 Publicando evento: '${event}'`);
        this.eventLog.push({ event, timestamp: new Date().toISOString() });
        this.emitter.emit(event, payload);
    }

    /**
     * Suscribe un handler a un evento específico.
     */
    subscribe(event: string, handler: EventHandler): void {
        console.log(`[EventBus] 🔗 Nueva suscripción al evento: '${event}'`);
        this.emitter.on(event, handler);
    }

    /**
     * Cancela la suscripción de un handler a un evento.
     */
    unsubscribe(event: string, handler: EventHandler): void {
        this.emitter.off(event, handler);
    }

    /**
     * Devuelve el historial de eventos publicados (útil para debugging y auditoría).
     */
    getEventLog(): { event: string; timestamp: string }[] {
        return this.eventLog;
    }
}
