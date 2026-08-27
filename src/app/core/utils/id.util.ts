/**
 * Gera um identificador único para novos registros criados localmente.
 * Centralizado aqui para que a futura substituição por IDs gerados pelo
 * backend (Spring Boot) exija alterar apenas este ponto.
 */
export function generateId(): string {
  return crypto.randomUUID();
}
