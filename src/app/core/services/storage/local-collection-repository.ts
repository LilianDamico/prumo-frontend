import { LocalStorageService } from './local-storage.service';

/** Entidade mínima que todo item guardado localmente precisa ter. */
export interface Identifiable {
  readonly id: string;
}

/**
 * Repositório genérico para coleções de entidades persistidas no
 * `localStorage`. Cada serviço de domínio (contas, receitas, despesas...)
 * usa uma instância deste repositório apontando para sua própria chave.
 *
 * Esta é a camada que futuramente será substituída por chamadas HTTP, sem
 * que os serviços de domínio (e muito menos os componentes) precisem mudar
 * sua forma de uso.
 */
export class LocalCollectionRepository<T extends Identifiable> {
  constructor(
    private readonly storage: LocalStorageService,
    private readonly storageKey: string,
    private readonly seedFactory?: () => T[],
  ) {}

  getAll(): T[] {
    const stored = this.storage.getItem<T[]>(this.storageKey);
    if (!Array.isArray(stored)) {
      const seed = this.seedFactory ? this.seedFactory() : [];
      this.storage.setItem(this.storageKey, seed);
      return seed;
    }
    return stored;
  }

  getById(id: string): T | undefined {
    return this.getAll().find((item) => item.id === id);
  }

  save(item: T): T {
    const items = this.getAll();
    const index = items.findIndex((existing) => existing.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    this.storage.setItem(this.storageKey, items);
    return item;
  }

  remove(id: string): void {
    const items = this.getAll().filter((item) => item.id !== id);
    this.storage.setItem(this.storageKey, items);
  }
}
