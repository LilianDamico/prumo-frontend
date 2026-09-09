import { HttpContextToken } from '@angular/common/http';

/**
 * Contexto usado para sinalizar ao `httpErrorInterceptor` que um 404 é
 * esperado nesta requisição (ex.: `HttpBudgetService.getByMonth`, onde a
 * ausência de orçamento no mês é um resultado normal, não um erro). Quando
 * `true`, o interceptor não dispara a notificação global de erro para
 * respostas 404 — o erro continua sendo propagado normalmente para que o
 * service possa tratá-lo (`catchError`).
 *
 * Não usar para suprimir 400/409/500: esses continuam sempre notificados
 * globalmente.
 */
export const SKIP_NOT_FOUND_NOTIFICATION = new HttpContextToken<boolean>(() => false);
