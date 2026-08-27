import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ApiErrorResponse } from '../models';
import { NotificationService } from '../services/notification.service';

/**
 * Traduz erros HTTP em mensagens curtas e úteis para o usuário, sem expor
 * JSON cru ou stack traces. Não trata autenticação/token — apenas os casos
 * previstos nesta etapa (400/404/409/rede/500).
 *
 * O erro original continua sendo propagado (via `throwError`) para que os
 * services/componentes possam reagir caso precisem (ex.: manter o form
 * aberto após um 409).
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        notification.error(resolveMessage(error));
      }
      return throwError(() => error);
    }),
  );
};

function resolveMessage(error: HttpErrorResponse): string {
  const apiError = isApiErrorResponse(error.error) ? error.error : undefined;

  switch (error.status) {
    case 400:
      return apiError?.fieldErrors?.length
        ? apiError.fieldErrors.map((fieldError) => fieldError.message).join(' ')
        : (apiError?.message ?? 'Dados inválidos. Verifique os campos e tente novamente.');
    case 404:
      return apiError?.message ?? 'Recurso não encontrado.';
    case 409:
      return apiError?.message ?? 'Conflito ao processar a solicitação.';
    case 0:
      return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    default:
      return apiError?.message ?? 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'status' in value
  );
}
