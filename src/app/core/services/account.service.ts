import { Account } from '../models';
import { CrudService } from './crud.service';

export type CreateAccountInput = Omit<Account, 'id'>;
export type UpdateAccountInput = Partial<CreateAccountInput>;

/**
 * Contrato de acesso às contas do usuário. A implementação atual usa
 * `localStorage` (`LocalAccountService`); no futuro poderá ser trocada por
 * uma implementação com `HttpClient` sem alterar quem depende deste token.
 */
export abstract class AccountService extends CrudService<
  Account,
  CreateAccountInput,
  UpdateAccountInput
> {}
