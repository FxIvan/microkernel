import path from 'path';
import { Plugin } from './plugin.interface';
import { EventBus } from './event-bus';

export class Microkernel {
    private plugins: Map<string, Plugin> = new Map();
    // El EventBus es parte del núcleo: canal de comunicación entre plugins
    private eventBus: EventBus = new EventBus();

    register(name: string, plugin: Plugin): void {
        if (this.plugins.has(name)) {
            console.warn(`ADVERTENCIA: El plugin '${name}' ya estaba registrado. Se sobreescribirá.`);
        }
        console.log(`REGISTRANDO plugin: '${name}'`);
        this.plugins.set(name, plugin);
        plugin.initialize();
        // Si el plugin soporta eventos, lo conectamos al EventBus
        if (plugin.onEventBusReady) {
            plugin.onEventBusReady(this.eventBus);
        }
    }

    getEventBus(): EventBus {
        return this.eventBus;
    }

    unregister(name: string): void {
        if (this.plugins.has(name)) {
            console.log(`DESREGISTRANDO plugin: '${name}'`);
            this.plugins.delete(name);
        } else {
            console.warn(`ADVERTENCIA: Se intentó desregistrar el plugin '${name}', pero no fue encontrado.`);
        }
    }

    getRegisteredPlugins(): string[] {
        return Array.from(this.plugins.keys());
    }

    async loadAndRegister(pluginInfo: { name: string, path: string }): Promise<boolean> {
        try {
            const modulePath = path.resolve(process.cwd(), pluginInfo.path);
            delete require.cache[require.resolve(modulePath)];

            const module = await import(modulePath);
            const PluginClass = module.default;
            const pluginInstance: Plugin = new PluginClass();

            // register() ya conecta el plugin al EventBus si lo soporta
            this.register(pluginInfo.name, pluginInstance);
            return true;
        } catch (error) {
            console.error(`ERROR: No se pudo cargar el plugin '${pluginInfo.name}' desde ${pluginInfo.path}`, error);
            return false;
        }
    }


    execute(name: string, data: any): { success: boolean; message: string } {
        console.log(`EJECUTANDO plugin: '${name}' con datos:`, data);
        if (this.plugins.has(name)) {
            const plugin = this.plugins.get(name)!;
            plugin.process(data);
            return { success: true, message: `Plugin '${name}' ejecutado.` };
        } else {
            const errorMessage = `ERROR: El plugin '${name}' no se encuentra registrado.`;
            console.error(errorMessage);
            return { success: false, message: errorMessage };
        }
    }

    /**
     * Permite obtener un plugin con su tipo completo para acceder a métodos específicos.
     * Útil cuando un plugin expone métodos propios además de process().
     */
    getPlugin<T extends Plugin>(name: string): T | undefined {
        return this.plugins.get(name) as T | undefined;
    }

}
