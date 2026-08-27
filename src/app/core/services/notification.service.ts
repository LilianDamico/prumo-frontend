import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Ponto único de exibição de mensagens curtas para o usuário (erros de
 * rede/API, confirmações simples). Reutilizado pelo interceptor HTTP de
 * erros para não espalhar `MatSnackBar` por vários services/componentes.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 6000, panelClass: 'notification-error' });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 4000 });
  }
}
