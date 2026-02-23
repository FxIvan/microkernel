import { Plugin } from './plugin.interface';

export class DataValidatorPlugin implements Plugin {
    name = 'DataValidator';

    initialize(): void {
        console.log('Plugin de Validación inicializado...');
    }

    process(data: any): void {
        if (data) {
            console.log(`VALIDANDO: Los datos son correctos.`);
        } else {
            console.error('VALIDANDO: Los datos no pueden ser nulos.');
        }
    }
}

export class NotificationSenderPlugin implements Plugin {
    name = 'NotificationSender';

    initialize(): void {
        console.log('Plugin de Notificaciones inicializado...');
    }

    process(data: any): void {
        console.log(`NOTIFICANDO: Se ha procesado la información: ${JSON.stringify(data)}.`);
    }
}
