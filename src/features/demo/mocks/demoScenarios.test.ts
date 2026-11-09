import { describe, expect, it } from 'vitest';
import { getConsumerPlanPolicy } from '../domain/policies';
import { demoScenarios, getDemoScenario, getDemoScenariosByContext } from './demoScenarios';

describe('catálogo de cenários demonstrativos', () => {
  it('contém exatamente os contextos consumidor, empresa e beneficiário', () => {
    expect(demoScenarios.map((scenario) => scenario.context)).toEqual([
      'CONSUMER',
      'BUSINESS',
      'BENEFICIARY',
    ]);
  });

  it('usa identificadores de cenário e identidade estáveis e únicos', () => {
    const scenarioIds = demoScenarios.map((scenario) => scenario.id);
    const personIdentityIds = demoScenarios.map((scenario) => scenario.session.personIdentity.id);
    const organizationIds = demoScenarios.flatMap((scenario) =>
      scenario.context === 'CONSUMER' ? [] : [scenario.organization.id],
    );

    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
    expect(new Set(personIdentityIds).size).toBe(personIdentityIds.length);
    expect(new Set(organizationIds).size).toBe(organizationIds.length);
    expect(getDemoScenario('scenario-demo-consumer-free')).toBe(demoScenarios[0]);
    expect(getDemoScenario('scenario-demo-business-admin')).toBe(demoScenarios[1]);
    expect(getDemoScenario('scenario-demo-beneficiary')).toBe(demoScenarios[2]);
  });

  it('mantém no máximo um perfil pessoal ativo e não modela empresa como perfil', () => {
    const [consumer, business, beneficiary] = demoScenarios;

    expect(consumer?.session.activePersonalProfile).toBe('CONSUMER');
    expect(business?.session.activePersonalProfile).toBeNull();
    expect(beneficiary?.session.activePersonalProfile).toBe('BENEFICIARY');
    expect(
      demoScenarios.every(
        (scenario) =>
          scenario.session.activePersonalProfile === null ||
          scenario.session.activePersonalProfile === 'CONSUMER' ||
          scenario.session.activePersonalProfile === 'BENEFICIARY',
      ),
    ).toBe(true);
  });

  it('representa empresa e administrador como identidades independentes', () => {
    const scenario = getDemoScenario('scenario-demo-business-admin');

    expect(scenario?.context).toBe('BUSINESS');
    if (scenario?.context !== 'BUSINESS') {
      throw new Error('Cenário empresarial ausente no catálogo.');
    }

    expect(scenario.session.personIdentity.id).not.toBe(scenario.organization.id);
    expect(scenario.session.organizationAdministrations).toEqual([
      {
        organizationId: scenario.organization.id,
        role: 'ADMINISTRATOR',
      },
    ]);
  });

  it('não concede perfil, plano ou benefícios pessoais à administração empresarial', () => {
    const scenario = getDemoScenario('scenario-demo-business-admin');

    expect(scenario?.context).toBe('BUSINESS');
    if (scenario?.context !== 'BUSINESS') {
      throw new Error('Cenário empresarial ausente no catálogo.');
    }

    expect(scenario.session.activePersonalProfile).toBeNull();
    expect(scenario.session.subscriptionPlan).toBeNull();
    expect(scenario.session.organizationAdministrations[0]?.role).toBe('ADMINISTRATOR');
    expect(scenario).not.toHaveProperty('personalBenefits');
  });

  it('associa beneficiário à organização sem ativar perfil de consumidor', () => {
    const scenario = getDemoScenario('scenario-demo-beneficiary');

    expect(scenario?.context).toBe('BENEFICIARY');
    if (scenario?.context !== 'BENEFICIARY') {
      throw new Error('Cenário de beneficiário ausente no catálogo.');
    }

    expect(scenario.session.activePersonalProfile).toBe('BENEFICIARY');
    expect(scenario.session.activePersonalProfile).not.toBe('CONSUMER');
    expect(scenario.session.subscriptionPlan).toBeNull();
    expect(scenario.session.organizationAffiliations).toEqual([
      {
        organizationId: scenario.organization.id,
        type: 'EMPLOYMENT',
      },
    ]);
  });

  it('não inventa política comercial para Empresa ou Beneficiário', () => {
    const business = getDemoScenario('scenario-demo-business-admin');
    const beneficiary = getDemoScenario('scenario-demo-beneficiary');

    expect(business?.session.subscriptionPlan).toBeNull();
    expect(beneficiary?.session.subscriptionPlan).toBeNull();
    expect(getConsumerPlanPolicy('FREE')).toEqual({
      pointsValidityDays: 90,
      mainNetworkExitGracePeriodDays: 30,
      mainCompanyCapacity: 1,
    });
    expect(business).not.toHaveProperty('price');
    expect(beneficiary).not.toHaveProperty('price');
    expect(beneficiary).not.toHaveProperty('pointsValidityDays');
  });

  it('mantém cenários, sessões e associações imutáveis e isolados entre si', () => {
    const [consumer, business, beneficiary] = demoScenarios;

    expect(Object.isFrozen(demoScenarios)).toBe(true);
    expect(Object.isFrozen(consumer)).toBe(true);
    expect(Object.isFrozen(consumer?.session)).toBe(true);
    expect(Object.isFrozen(consumer?.session.organizationAffiliations)).toBe(true);
    expect(Object.isFrozen(business?.session.organizationAdministrations)).toBe(true);
    expect(Object.isFrozen(beneficiary?.session.organizationAffiliations)).toBe(true);
    expect(consumer?.session).not.toBe(business?.session);
    expect(business?.session).not.toBe(beneficiary?.session);

    expect(getDemoScenariosByContext('CONSUMER')).toEqual([consumer]);
    expect(getDemoScenariosByContext('BUSINESS')).toEqual([business]);
    expect(getDemoScenariosByContext('BENEFICIARY')).toEqual([beneficiary]);
  });
});
