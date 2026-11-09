import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BenefitsPage } from './DemoPages';
import { DemoMembershipRequestContext } from './DemoMembershipRequestState';
import { DemoScenarioContext } from './DemoScenarioState';
import { createEmptyDemoMembershipState } from './domain/membershipRequests';
import type { MainCompanyMembership } from './domain/models';
import { getDemoScenario } from './mocks/demoScenarios';
import type { DemoScenario } from './mocks/demoScenarios';

function getConsumerScenario(): Extract<DemoScenario, { context: 'CONSUMER' }> {
  const scenario = getDemoScenario('scenario-demo-consumer-free');
  if (!scenario || scenario.context !== 'CONSUMER') {
    throw new Error('Cenário demonstrativo de Consumidor não encontrado.');
  }
  return scenario;
}

const activeScenario = getConsumerScenario();

function membership(
  organizationId: MainCompanyMembership['organizationId'],
  sequence: number,
): MainCompanyMembership {
  return {
    id: `main-company-membership-demo-offers-${sequence}`,
    personIdentityId: activeScenario.session.personIdentity.id,
    organizationId,
    status: 'ACTIVE',
    activatedAtUtc: '2026-11-09T12:00:00.000Z',
    approvedRequestId: `membership-request-demo-offers-${sequence}`,
    planAtActivation: 'FREE',
  };
}

function renderBenefitsPage(organizationIds: MainCompanyMembership['organizationId'][]) {
  const state = {
    ...createEmptyDemoMembershipState(),
    memberships: organizationIds.map((organizationId, index) =>
      membership(organizationId, index + 1),
    ),
  };
  const operationNotUsed = (): never => {
    throw new Error('Operação não esperada durante consulta de elegibilidade.');
  };

  return render(
    <MemoryRouter initialEntries={['/demo/beneficios']}>
      <DemoScenarioContext.Provider value={{ activeScenario }}>
        <DemoMembershipRequestContext.Provider
          value={{
            state,
            submitRequest: operationNotUsed,
            approveRequest: operationNotUsed,
            rejectRequest: operationNotUsed,
            returnRequest: operationNotUsed,
            resubmitRequest: operationNotUsed,
          }}
        >
          <BenefitsPage />
        </DemoMembershipRequestContext.Provider>
      </DemoScenarioContext.Provider>
    </MemoryRouter>,
  );
}

describe('apresentação das ofertas conforme a rede do Consumidor', () => {
  it('identifica promotora, origem direta e limitação de benefícios exclusivos', () => {
    renderBenefitsPage(['organization-demo-network-academy']);

    const barbershopOffer = screen
      .getByRole('heading', { name: 'Sua próxima visita vale mais' })
      .closest('article');
    expect(barbershopOffer).not.toBeNull();
    const exclusiveOffer = within(barbershopOffer as HTMLElement);
    expect(exclusiveOffer.getByText('Empresa promotora')).toBeInTheDocument();
    expect(exclusiveOffer.getByText('Barbearia Ponto Zero Demo')).toBeInTheDocument();
    expect(exclusiveOffer.getByText('Benefício exclusivo')).toBeInTheDocument();
    expect(exclusiveOffer.getByText('Empresa conectada à rede de')).toBeInTheDocument();
    expect(exclusiveOffer.getByText('Academia Horizonte Demo')).toBeInTheDocument();
    expect(
      exclusiveOffer.getByText(/conexão direta não libera um benefício exclusivo/i),
    ).toBeInTheDocument();
    expect(exclusiveOffer.getByText('Indisponível')).toBeInTheDocument();

    const generalOffer = screen
      .getByRole('heading', { name: 'Ofertas do bairro' })
      .closest('article');
    expect(generalOffer).not.toBeNull();
    const connectedGeneralOffer = within(generalOffer as HTMLElement);
    expect(connectedGeneralOffer.getByText('Mercado Raiz Demo')).toBeInTheDocument();
    expect(connectedGeneralOffer.getByText('Benefício de rede')).toBeInTheDocument();
    expect(connectedGeneralOffer.getByText('Acesso potencial')).toBeInTheDocument();
    expect(
      connectedGeneralOffer.getByText(
        /saldo necessário para eventual resgate ainda não verificado/i,
      ),
    ).toBeInTheDocument();

    const generalCampaign = screen
      .getByRole('heading', { name: 'Semana do bem-estar' })
      .closest('article');
    expect(generalCampaign).not.toBeNull();
    expect(
      within(generalCampaign as HTMLElement).getByText(/participação ainda não foi iniciada/i),
    ).toBeInTheDocument();
    expect(
      within(generalCampaign as HTMLElement).queryByText(/saldo.*não verificado/i),
    ).not.toBeInTheDocument();
  });

  it('não anuncia campanhas inativas como acessíveis nem concede pontos ou resgates', () => {
    renderBenefitsPage(['organization-demo-network-academy']);

    const inactiveOffer = screen
      .getByRole('heading', { name: 'Conexão que aproxima' })
      .closest('article');
    expect(inactiveOffer).not.toBeNull();
    expect(within(inactiveOffer as HTMLElement).getByText('Rascunho')).toBeInTheDocument();
    expect(
      within(inactiveOffer as HTMLElement).getByText('Esta oferta não está ativa.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/não concede ou movimenta pontos/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /resgatar|receber pontos/i }),
    ).not.toBeInTheDocument();
  });

  it('apresenta benefício exclusivo potencial somente para a empresa principal ativa', () => {
    renderBenefitsPage(['organization-demo-network-barbershop']);

    const exclusiveOffer = screen
      .getByRole('heading', { name: 'Sua próxima visita vale mais' })
      .closest('article');
    expect(exclusiveOffer).not.toBeNull();
    expect(
      within(exclusiveOffer as HTMLElement).getByText('Empresa principal'),
    ).toBeInTheDocument();
    expect(within(exclusiveOffer as HTMLElement).getByText('Acesso potencial')).toBeInTheDocument();
    expect(
      within(exclusiveOffer as HTMLElement).getByText(/nenhum resgate está autorizado/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resgatar/i })).not.toBeInTheDocument();
  });

  it('não replica ofertas ao avaliar mais de uma empresa principal', () => {
    renderBenefitsPage([
      'organization-demo-network-academy',
      'organization-demo-network-barbershop',
    ]);

    const networkBenefit = screen
      .getByRole('heading', { name: 'Ofertas do bairro' })
      .closest('article');
    expect(networkBenefit).not.toBeNull();
    expect(screen.getAllByRole('heading', { name: 'Ofertas do bairro' })).toHaveLength(1);
    expect(
      within(networkBenefit as HTMLElement).getByText('Academia Horizonte Demo'),
    ).toBeInTheDocument();
  });
});
