import { Injectable } from '@angular/core';

/**
 * Camada mais baixa de acesso ao `localStorage`. Nenhum componente ou
 * serviço de domínio deve usar `window.localStorage` diretamente — todo
 * acesso passa por aqui, o que também isola o tratamento de erros (dados
 * inválidos, `localStorage` indisponível, JSON corrompido etc.).
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  getItem<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      // Dado corrompido ou localStorage indisponível: tratamos como vazio
      // em vez de quebrar a aplicação.
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Armazenamento indisponível (ex.: modo privado sem cota). Falha
      // silenciosamente: a aplicação continua funcionável na sessão atual.
    }
  }

  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Sem ação possível se o armazenamento estiver indisponível.
    }
  }
}
