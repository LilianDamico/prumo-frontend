import { Account } from '../models';
import { CrudService } from './crud.service';

/** Contrato de criação alinhado ao backend: name, institution, type, currentBalance, active. */
export type CreateAccountInput = Pick<
  Account,
  'name' | 'institution' | 'type' | 'currentBalance' | 'active'
>;

/** Contrato de atualização: os mesmos campos editáveis, parciais para permitir chamadas parciais da UI. */
export type UpdateAccountInput = Partial<CreateAccountInput>;

/**
 * Contrato de acesso às contas do usuário. A implementação atual usa
 * `HttpAccountService` (backend Spring Boot); `LocalAccountService`
 * permanece disponível como implementação alternativa baseada em
 * `localStorage`.
 */
export abstract class AccountService extends CrudService<
  Account,
  CreateAccountInput,
  UpdateAccountInput
> {}
