import { EventBus } from './event-bus';

export interface Plugin {
    name: string;
    initialize(): void;
    process(data: any): void;
    /**
     * Hook opcional. El Kernel lo llama después de registrar el plugin,
     * permitiéndole suscribirse a eventos o publicar en el EventBus.
     */
    onEventBusReady?(eventBus: EventBus): void;
}
