import { describe, expect, it } from 'vitest';
import { calculateMainNetworkExitEligibleAt, getConsumerPlanPolicy } from './policies';
import { createMainCompanyMembershipRequest } from './membershipRequests';
import type { DemoSession, MainCompanyMembershipRequest } from './models';
import { getDemoScenario } from '../mocks/demoScenarios';
import { demoCompanies } from '../mocks/companyNetwork';

const consumerScenario = getDemoScenario('scenario-demo-consumer-free');
const businessScenario = getDemoScenario('scenario-demo-business-admin');
const requestedAt = new Date('2026-11-08T22:30:45.123Z');

if (!consumerScenario || consumerScenario.context !== 'CONSUMER') {
  throw new Error('Cenário demonstrativo de Consumidor não encontrado.');
}

if (!businessScenario) {
  throw new Error('Cenário demonstrativo de Empresa não encontrado.');
}

describe('solicitações demonstrativas de adesão à empresa principal', () => {
  it('cria solicitação PENDING para uma organização existente e identidade de Consumidor', () => {
    const company = demoCompanies[0];
    const result = createMainCompanyMembershipRequest({
      session: consumerScenario.session,
      organizationId: company.id,
      organizations: demoCompanies,
      pendingRequests: [],
      requestedAt,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.request).toEqual({
      id: `membership-request-demo-${consumerScenario.session.personIdentity.id}-${company.id}`,
      personIdentityId: consumerScenario.session.personIdentity.id,
      organizationId: company.id,
      status: 'PENDING',
      createdAtUtc: requestedAt.toISOString(),
    });
    expect(consumerScenario.session.organizationAffiliations).toEqual([]);
  });

  it('rejeita organização inexistente', () => {
    const result = createMainCompanyMembershipRequest({
      session: consumerScenario.session,
      organizationId: 'organization-demo-not-in-catalog',
      organizations: demoCompanies,
      pendingRequests: [],
      requestedAt,
    });

    expect(result).toEqual({ success: false, reason: 'ORGANIZATION_NOT_FOUND' });
  });

  it('rejeita contextos que não são de Consumidor', () => {
    const result = createMainCompanyMembershipRequest({
      session: businessScenario.session,
      organizationId: demoCompanies[0].id,
      organizations: demoCompanies,
      pendingRequests: [],
      requestedAt,
    });

    expect(result).toEqual({ success: false, reason: 'NOT_CONSUMER' });
  });

  it('impede outra solicitação pendente para a mesma identidade', () => {
    const existingRequest: MainCompanyMembershipRequest = {
      id: 'membership-request-demo-existing',
      personIdentityId: consumerScenario.session.personIdentity.id,
      organizationId: demoCompanies[0].id,
      status: 'PENDING',
      createdAtUtc: requestedAt.toISOString(),
    };

    const result = createMainCompanyMembershipRequest({
      session: consumerScenario.session,
      organizationId: demoCompanies[1].id,
      organizations: demoCompanies,
      pendingRequests: [existingRequest],
      requestedAt,
    });

    expect(result).toEqual({ success: false, reason: 'PENDING_REQUEST_EXISTS' });
  });

  it('não cria outra solicitação quando já existe vínculo ativo com a organização', () => {
    const activeSession: DemoSession = {
      ...consumerScenario.session,
      organizationAffiliations: [{ organizationId: demoCompanies[0].id, type: 'EMPLOYMENT' }],
    };

    const result = createMainCompanyMembershipRequest({
      session: activeSession,
      organizationId: demoCompanies[0].id,
      organizations: demoCompanies,
      pendingRequests: [],
      requestedAt,
    });

    expect(result).toEqual({ success: false, reason: 'ALREADY_AFFILIATED' });
  });

  it('associa a solicitação à identidade do cenário que a criou', () => {
    const result = createMainCompanyMembershipRequest({
      session: consumerScenario.session,
      organizationId: demoCompanies[0].id,
      organizations: demoCompanies,
      pendingRequests: [],
      requestedAt,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.request.personIdentityId).toBe(consumerScenario.session.personIdentity.id);
      expect(result.request.personIdentityId).not.toBe(businessScenario.session.personIdentity.id);
    }
  });

  it('usa o instante UTC recebido e não cria data de ativação ou vínculo', () => {
    const result = createMainCompanyMembershipRequest({
      session: consumerScenario.session,
      organizationId: demoCompanies[0].id,
      organizations: demoCompanies,
      pendingRequests: [],
      requestedAt,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.request.createdAtUtc).toBe('2026-11-08T22:30:45.123Z');
      expect(result.request).not.toHaveProperty('activatedAt');
      expect(consumerScenario.session.organizationAffiliations).toHaveLength(0);
    }
  });

  it('obtém carências de saída dos planos a partir das políticas do domínio', () => {
    expect(getConsumerPlanPolicy('FREE').mainNetworkExitGracePeriodDays).toBe(30);
    expect(getConsumerPlanPolicy('PRO').mainNetworkExitGracePeriodDays).toBe(15);
    expect(getConsumerPlanPolicy('PREMIUM').mainNetworkExitGracePeriodDays).toBe(0);
    expect(
      calculateMainNetworkExitEligibleAt('FREE', new Date('2026-11-08T22:30:45.123Z')),
    ).toEqual(new Date('2026-12-08T22:30:45.123Z'));
    expect(calculateMainNetworkExitEligibleAt('PRO', new Date('2026-11-08T22:30:45.123Z'))).toEqual(
      new Date('2026-11-23T22:30:45.123Z'),
    );
    expect(
      calculateMainNetworkExitEligibleAt('PREMIUM', new Date('2026-11-08T22:30:45.123Z')),
    ).toEqual(new Date('2026-11-08T22:30:45.123Z'));
  });

  it('rejeita instante inválido sem armazenar solicitação com timestamp incorreto', () => {
    expect(() =>
      createMainCompanyMembershipRequest({
        session: consumerScenario.session,
        organizationId: demoCompanies[0].id,
        organizations: demoCompanies,
        pendingRequests: [],
        requestedAt: new Date(Number.NaN),
      }),
    ).toThrow('requestedAt deve ser um instante válido.');
  });
});
