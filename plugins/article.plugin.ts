import { Plugin } from '../microkernel/src/plugin.interface';
import { EventBus } from '../microkernel/src/event-bus';

export interface Article {
    id: string;
    title: string;
    author: string;
    content: string;
    category: 'noticias' | 'deportes' | 'tecnologia' | 'cultura';
    publishedAt?: string;
    views?: number;
}

/**
 * ArticlePlugin: Gestiona la publicación de artículos del medio digital.
 * Al publicar un artículo, emite el evento 'article:published' para que
 * otros plugins reaccionen (notificaciones, métricas, etc.) sin acoplamiento.
 */
export default class ArticlePlugin implements Plugin {
    name = 'ArticlePlugin';
    private eventBus?: EventBus;
    private articles: Article[] = [];

    initialize(): void {
        console.log('[ArticlePlugin] Plugin de Artículos inicializado.');
    }

    onEventBusReady(eventBus: EventBus): void {
        this.eventBus = eventBus;

        // También escucha un evento para registrar vistas de artículos
        eventBus.subscribe('article:viewed', ({ id }: { id: string }) => {
            const article = this.articles.find(a => a.id === id);
            if (article) {
                article.views = (article.views ?? 0) + 1;
                console.log(`[ArticlePlugin] 👁️  Artículo "${article.title}" tiene ahora ${article.views} vista(s).`);
            }
        });
    }

    /**
     * data: Article — publica un nuevo artículo y dispara el evento.
     */
    process(data: Article): void {
        console.log(`[ArticlePlugin] Recibiendo solicitud para publicar artículo: "${data.title}"`);
        const article: Article = {
            ...data,
            publishedAt: new Date().toISOString(),
            views: 0,
        };
        this.articles.push(article);
        console.log(`[ArticlePlugin] 📰 Artículo publicado: "${article.title}" (${article.category})`);

        // Disparar evento → otros plugins reaccionan sin que ArticlePlugin los conozca
        this.eventBus?.publish('article:published', article);
    }

    getAll(): Article[] {
        return this.articles;
    }

    getByCategory(category: string): Article[] {
        return this.articles.filter(a => a.category === category);
    }
}
