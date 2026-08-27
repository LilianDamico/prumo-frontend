/**
 * Erro de validação de um campo específico, retornado pelo backend em
 * requisições que falham por dados inválidos (HTTP 400).
 */
export interface ApiFieldError {
  field: string;
  message: string;
}

/**
 * Formato padrão de erro retornado pela API Spring Boot (Prumo) para
 * respostas não-2xx. Usado pelo interceptor HTTP central para traduzir
 * falhas em mensagens úteis, sem expor JSON cru ou stack traces na UI.
 */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: ApiFieldError[];
}
