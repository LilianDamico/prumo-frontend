import { Observable } from 'rxjs';
import { Category, CategoryType } from '../models';
import { CrudService } from './crud.service';

/**
 * Contrato de criação alinhado ao backend: `name`, `type`, `essential`.
 */
export type CreateCategoryInput = Pick<Category, 'name' | 'type' | 'essential'>;

/**
 * Contrato de atualização alinhado ao backend: `name`, `type`, `active`,
 * `essential`.
 */
export type UpdateCategoryInput = Partial<
  Pick<Category, 'name' | 'type' | 'active' | 'essential'>
>;

/**
 * Contrato de acesso às categorias de receitas e despesas. A implementação
 * local (`LocalCategoryService`) garante que exista sempre um conjunto
 * inicial de categorias sugeridas.
 */
export abstract class CategoryService extends CrudService<
  Category,
  CreateCategoryInput,
  UpdateCategoryInput
> {
  abstract getByType(type: CategoryType): Observable<Category[]>;
}
