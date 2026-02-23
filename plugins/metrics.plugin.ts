import { Plugin } from '../microkernel/src/plugin.interface';
import { EventBus } from '../microkernel/src/event-bus';

interface MetricRecord {
    event: string;
    timestamp: string;
    category?: string;
    details: any;
}

interface CategoryStats {
    [category: string]: number;
}

/**
 * MetricsPlugin: Escucha todos los eventos del dominio y registra estadísticas.
 * Fundamental en un medio de alta concurrencia para entender el comportamiento
 * de los usuarios en tiempo real sin afectar a los otros plugins.
 */
export default class MetricsPlugin implements Plugin {
    name = 'MetricsPlugin';
    private records: MetricRecord[] = [];
    private categoryStats: CategoryStats = {};

    initialize(): void {
        console.log('[MetricsPlugin] Plugin de Métricas en tiempo real inicializado.');
    }

    onEventBusReady(eventBus: EventBus): void {
        // Escucha publicaciones de artículos
        eventBus.subscribe('article:published', (article) => {
            this.record('article:published', article.category, article);
            this.categoryStats[article.category] = (this.categoryStats[article.category] ?? 0) + 1;
        });

        // Escucha vistas de artículos
        eventBus.subscribe('article:viewed', (data) => {
            this.record('article:viewed', data.category, data);
        });
    }

    /**
     * Permite registrar métricas personalizadas manualmente.
     */
    process(data: { event: string; category?: string; details?: any }): void {
        this.record(data.event, data.category, data.details ?? {});
    }

    private record(event: string, category: string | undefined, details: any): void {
        const metric: MetricRecord = {
            event,
            timestamp: new Date().toISOString(),
            category,
            details,
        };
        this.records.push(metric);
        console.log(`[MetricsPlugin] 📊 Métrica registrada: '${event}' | categoría: '${category ?? 'N/A'}'`);
    }

    /**
     * Resumen ejecutivo del medio digital.
     */
    getSummary(): {
        totalEvents: number;
        byEvent: { [event: string]: number };
        byCategory: CategoryStats;
        lastRecords: MetricRecord[];
    } {
        const byEvent: { [event: string]: number } = {};
        this.records.forEach(r => {
            byEvent[r.event] = (byEvent[r.event] ?? 0) + 1;
        });

        return {
            totalEvents: this.records.length,
            byEvent,
            byCategory: this.categoryStats,
            // Últimas 5 métricas registradas
            lastRecords: this.records.slice(-5),
        };
    }

    getAllRecords(): MetricRecord[] {
        return this.records;
    }
}
