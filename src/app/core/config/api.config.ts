import { InjectionToken } from '@angular/core';

/**
 * URL base da API REST do backend Spring Boot (Prumo). Centraliza o
 * endereço para que nenhum service espalhe `http://localhost:8080/...`
 * pelo código. Os services de infraestrutura (ex.: `HttpCategoryService`)
 * devem sempre injetar este token e montar seus endpoints a partir dele,
 * nunca construir URLs absolutas em componentes.
 *
 * Valor de desenvolvimento aponta para o backend local. Quando o projeto
 * adotar `environment.ts`/`environment.prod.ts`, o `factory` abaixo deve
 * passar a ler de lá em vez do literal fixo.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:8080/api/v1',
});
