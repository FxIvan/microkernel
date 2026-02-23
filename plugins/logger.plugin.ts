interface Plugin {
    name: string;
    initialize(): void;
    process(data: any): void;
}

export default class DataLoggerPlugin implements Plugin {
    name = 'DataLogger';

    initialize(): void {
        console.log('Plugin de Logger DINÁMICO inicializado...');
    }

    process(data: any): void {
        const logMessage = `[LOG] - ${new Date().toISOString()} - Datos procesados: ${JSON.stringify(data)}`;
        console.log(logMessage);
    }
}
