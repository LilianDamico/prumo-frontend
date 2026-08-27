import { TestBed } from '@angular/core/testing';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  it('should return null when the key does not exist', () => {
    expect(service.getItem('inexistente')).toBeNull();
  });

  it('should store and retrieve a value', () => {
    service.setItem('chave', { a: 1 });
    expect(service.getItem<{ a: number }>('chave')).toEqual({ a: 1 });
  });

  it('should remove a value', () => {
    service.setItem('chave', 'valor');
    service.removeItem('chave');
    expect(service.getItem('chave')).toBeNull();
  });

  it('should return null instead of throwing when stored data is invalid JSON', () => {
    window.localStorage.setItem('corrompido', '{ invalido');
    expect(service.getItem('corrompido')).toBeNull();
  });
});
