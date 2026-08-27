import { LocalStorageService } from './local-storage.service';
import { LocalCollectionRepository } from './local-collection-repository';

interface Item {
  readonly id: string;
  name: string;
}

describe('LocalCollectionRepository', () => {
  let storage: LocalStorageService;
  let repository: LocalCollectionRepository<Item>;

  beforeEach(() => {
    window.localStorage.clear();
    storage = new LocalStorageService();
    repository = new LocalCollectionRepository<Item>(storage, 'itens-teste');
  });

  it('should return an empty list when there is nothing stored and no seed', () => {
    expect(repository.getAll()).toEqual([]);
  });

  it('should seed initial data on first access when storage is empty', () => {
    const seeded = new LocalCollectionRepository<Item>(storage, 'itens-com-seed', () => [
      { id: '1', name: 'Primeiro' },
    ]);
    expect(seeded.getAll()).toEqual([{ id: '1', name: 'Primeiro' }]);
    // A próxima leitura deve vir do storage, não gerar novo seed.
    expect(storage.getItem('itens-com-seed')).toEqual([{ id: '1', name: 'Primeiro' }]);
  });

  it('should treat corrupted (non-array) stored data as empty and reseed', () => {
    storage.setItem('itens-teste', { not: 'an array' });
    expect(repository.getAll()).toEqual([]);
  });

  it('should create and find an item by id', () => {
    repository.save({ id: '1', name: 'Conta corrente' });
    expect(repository.getById('1')).toEqual({ id: '1', name: 'Conta corrente' });
  });

  it('should update an existing item instead of duplicating it', () => {
    repository.save({ id: '1', name: 'Conta corrente' });
    repository.save({ id: '1', name: 'Conta corrente renomeada' });
    expect(repository.getAll()).toEqual([{ id: '1', name: 'Conta corrente renomeada' }]);
  });

  it('should remove an item by id', () => {
    repository.save({ id: '1', name: 'Conta corrente' });
    repository.save({ id: '2', name: 'Poupança' });
    repository.remove('1');
    expect(repository.getAll()).toEqual([{ id: '2', name: 'Poupança' }]);
  });
});
