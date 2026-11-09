import { describe, expect, it } from 'vitest';
import {
  demoCompanies,
  demoOrganizationConnections,
  getDemoCompanies,
  getDirectCompanyConnections,
} from './companyNetwork';

describe('catálogo demonstrativo de empresas e conexões diretas', () => {
  it('define empresas e conexões com identificadores estáveis e únicos', () => {
    expect(getDemoCompanies()).toHaveLength(5);
    expect(new Set(demoCompanies.map(({ id }) => id)).size).toBe(demoCompanies.length);
    expect(new Set(demoOrganizationConnections.map(({ id }) => id)).size).toBe(
      demoOrganizationConnections.length,
    );
  });

  it('mantém integridade referencial entre as conexões e o catálogo de empresas', () => {
    const companyIds = new Set(demoCompanies.map(({ id }) => id));

    for (const connection of demoOrganizationConnections) {
      expect(connection.organizationIds).toHaveLength(2);
      expect(connection.organizationIds[0]).not.toBe(connection.organizationIds[1]);
      for (const organizationId of connection.organizationIds) {
        expect(companyIds.has(organizationId)).toBe(true);
      }
    }
  });

  it('consulta somente conexões diretas, sem inferir conexões transitivas', () => {
    const academy = demoCompanies.find(({ segment }) => segment === 'ACADEMY');
    const barbershop = demoCompanies.find(({ segment }) => segment === 'BARBERSHOP');
    const supermarket = demoCompanies.find(({ segment }) => segment === 'SUPERMARKET');

    expect(academy).toBeDefined();
    expect(barbershop).toBeDefined();
    expect(supermarket).toBeDefined();
    if (!academy || !barbershop || !supermarket) {
      throw new Error('Empresas esperadas não encontradas no catálogo demonstrativo.');
    }

    expect(getDirectCompanyConnections(academy.id).map(({ id }) => id)).toEqual([
      barbershop.id,
      supermarket.id,
    ]);
    expect(getDirectCompanyConnections(barbershop.id).map(({ id }) => id)).toEqual([academy.id]);
    expect(getDirectCompanyConnections(barbershop.id)).not.toContainEqual(supermarket);
  });

  it('retorna uma lista vazia para uma empresa sem conexões', () => {
    const internetProvider = demoCompanies.find(({ segment }) => segment === 'INTERNET');

    expect(internetProvider).toBeDefined();
    if (!internetProvider) {
      throw new Error('Provedor demonstrativo não encontrado no catálogo.');
    }

    expect(getDirectCompanyConnections(internetProvider.id)).toEqual([]);
  });

  it('expõe coleções imutáveis e não associa conexões a identidades pessoais', () => {
    expect(Object.isFrozen(demoCompanies)).toBe(true);
    expect(Object.isFrozen(demoOrganizationConnections)).toBe(true);
    expect(demoOrganizationConnections).not.toHaveProperty('personIdentity');
  });
});
