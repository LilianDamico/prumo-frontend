import { Observable } from 'rxjs';

/**
 * Contrato genérico de CRUD implementado por todos os serviços de domínio.
 * Cada serviço concreto (ex.: `AccountService`) estende esta base com os
 * tipos específicos de sua entidade. Usar `Observable` (em vez de valores
 * síncronos) já prepara o contrato para a futura implementação via
 * `HttpClient`, sem exigir mudanças nos componentes.
 */
export abstract class CrudService<TEntity, TCreateInput, TUpdateInput> {
  abstract getAll(): Observable<TEntity[]>;
  abstract getById(id: string): Observable<TEntity | undefined>;
  abstract create(input: TCreateInput): Observable<TEntity>;
  abstract update(id: string, changes: TUpdateInput): Observable<TEntity>;
  abstract remove(id: string): Observable<void>;
}
