import { describe, expect, it } from 'vitest';
import type {
  DemoMembershipState,
  MainCompanyMembership,
  MembershipRequestStatus,
  OrganizationConnection,
  OrganizationId,
  PersonIdentityId,
} from './models';
import {
  evaluateCampaignEligibility,
  getConsumerNetworkEligibility,
  type ConsumerNetworkEligibility,
} from './networkEligibility';
import { createEmptyDemoMembershipState } from './membershipRequests';
import { demoCompanies, demoOrganizationConnections } from '../mocks/companyNetwork';
import { demoCampaigns } from '../demoData';

const consumerId = 'person-demo-consumer-network-001' as PersonIdentityId;
const otherConsumerId = 'person-demo-consumer-network-002' as PersonIdentityId;
const academyId = 'organization-demo-network-academy' as OrganizationId;
const barbershopId = 'organization-demo-network-barbershop' as OrganizationId;
const supermarketId = 'organization-demo-network-supermarket' as OrganizationId;
const internetId = 'organization-demo-network-internet' as OrganizationId;

function membership(
  personIdentityId: PersonIdentityId,
  organizationId: OrganizationId,
  sequence: number,
): MainCompanyMembership {
  return {
    id: `main-company-membership-demo-network-${sequence}`,
    personIdentityId,
    organizationId,
    status: 'ACTIVE',
    activatedAtUtc: '2026-11-09T12:00:00.000Z',
    approvedRequestId: `membership-request-demo-network-${sequence}`,
    planAtActivation: 'FREE',
  };
}

function getNetwork(
  memberships: readonly MainCompanyMembership[],
  connections: readonly OrganizationConnection[] = demoOrganizationConnections,
  personIdentityId = consumerId,
): ConsumerNetworkEligibility {
  return getConsumerNetworkEligibility({
    personIdentityId,
    memberships,
    organizations: demoCompanies,
    connections,
  });
}

function connection(
  id: string,
  first: OrganizationId,
  second: OrganizationId,
): OrganizationConnection {
  return {
    id: `organization-connection-demo-${id}`,
    organizationIds: [first, second],
  };
}

describe('elegibilidade demonstrativa por redes de conexões', () => {
  it('associa campanhas demonstrativas somente a organizações do catálogo compartilhado', () => {
    const organizationIds = new Set(demoCompanies.map(({ id }) => id));

    expect(demoCampaigns.every(({ organizationId }) => organizationIds.has(organizationId))).toBe(
      true,
    );
  });

  it('retorna rede vazia quando o consumidor não possui vínculos ativos', () => {
    const network = getNetwork([]);

    expect(network.mainCompanies).toEqual([]);
    expect(network.connectedCompanies).toEqual([]);
    expect(network.organizations).toEqual([]);
    expect(
      evaluateCampaignEligibility(
        { organizationId: academyId, offerCategory: 'GENERAL_CAMPAIGN', isActive: true },
        network,
      ),
    ).toMatchObject({
      relationship: 'NONE',
      networkStatus: 'INELIGIBLE',
      accessStatus: 'UNAVAILABLE',
      reason: 'NO_ACTIVE_PRIMARY_COMPANY',
    });
  });

  it('inclui empresa principal e conexões diretas, sem tratar conectadas como principais', () => {
    const network = getNetwork([membership(consumerId, academyId, 1)]);

    expect(network.mainCompanies.map(({ id }) => id)).toEqual([academyId]);
    expect(network.connectedCompanies.map(({ organization }) => organization.id)).toEqual([
      barbershopId,
      supermarketId,
    ]);
    expect(network.organizations.map(({ relationship }) => relationship)).toEqual([
      'PRINCIPAL',
      'CONNECTED',
      'CONNECTED',
    ]);
    expect(
      network.connectedCompanies.every(({ relationship }) => relationship === 'CONNECTED'),
    ).toBe(true);
  });

  it('mantém como PRINCIPAL uma empresa que também aparece como conexão de outra principal', () => {
    const network = getNetwork(
      [membership(consumerId, academyId, 20), membership(consumerId, barbershopId, 21)],
      [connection('academy-barbershop', academyId, barbershopId)],
    );

    expect(network.mainCompanies.map(({ id }) => id)).toEqual([academyId, barbershopId]);
    expect(network.connectedCompanies).toEqual([]);
    expect(
      network.organizations.map(({ organization, relationship }) => [
        organization.id,
        relationship,
      ]),
    ).toEqual([
      [academyId, 'PRINCIPAL'],
      [barbershopId, 'PRINCIPAL'],
    ]);
  });

  it('une múltiplas redes, mantém origens distintas e deduplica organizações compartilhadas', () => {
    const links = [
      ...demoOrganizationConnections,
      connection('barbershop-supermarket', barbershopId, supermarketId),
    ];
    const network = getNetwork(
      [membership(consumerId, academyId, 2), membership(consumerId, barbershopId, 3)],
      links,
    );
    const supermarket = network.connectedCompanies.find(
      ({ organization }) => organization.id === supermarketId,
    );

    expect(network.mainCompanies.map(({ id }) => id)).toEqual([academyId, barbershopId]);
    expect(
      network.connectedCompanies.filter(({ organization }) => organization.id === supermarketId),
    ).toHaveLength(1);
    expect(supermarket?.originatingMainCompanyIds).toEqual([academyId, barbershopId]);
    expect(
      network.organizations.filter(({ organization }) => organization.id === supermarketId),
    ).toHaveLength(1);
  });

  it('não infere conexões transitivas', () => {
    const network = getNetwork(
      [membership(consumerId, academyId, 4)],
      [
        connection('academy-supermarket', academyId, supermarketId),
        connection('supermarket-internet', supermarketId, internetId),
      ],
    );

    expect(network.connectedCompanies.map(({ organization }) => organization.id)).toEqual([
      supermarketId,
    ]);
    expect(network.organizations.some(({ organization }) => organization.id === internetId)).toBe(
      false,
    );
    expect(
      evaluateCampaignEligibility(
        { organizationId: internetId, offerCategory: 'NETWORK_BENEFIT', isActive: true },
        network,
      ),
    ).toMatchObject({
      relationship: 'NONE',
      networkStatus: 'INELIGIBLE',
      accessStatus: 'UNAVAILABLE',
      reason: 'OUTSIDE_ACTIVE_NETWORK',
    });
  });

  it('isola vínculos de outras identidades e não altera as entradas', () => {
    const memberships = [
      membership(consumerId, academyId, 5),
      membership(otherConsumerId, barbershopId, 6),
    ];
    const originalMemberships = structuredClone(memberships);
    const originalOrganizations = structuredClone(demoCompanies);
    const originalConnections = structuredClone(demoOrganizationConnections);

    const network = getNetwork(memberships);

    expect(network.mainCompanies.map(({ id }) => id)).toEqual([academyId]);
    expect(memberships).toEqual(originalMemberships);
    expect(demoCompanies).toEqual(originalOrganizations);
    expect(demoOrganizationConnections).toEqual(originalConnections);
  });

  it.each(['PENDING', 'RETURNED', 'REJECTED'] as const)(
    'não concede acesso por solicitação em estado %s',
    (status: MembershipRequestStatus) => {
      const state: DemoMembershipState = {
        ...createEmptyDemoMembershipState(),
        requests: [
          {
            id: `membership-request-demo-${status.toLowerCase()}`,
            personIdentityId: consumerId,
            organizationId: academyId,
            applicantProfile: {
              id: 'consumer-profile-demo-network-001',
              publicRegistrationCode: 'VK-DEMO-NETWORK-001',
              fullName: 'Consumidor Demonstrativo',
              email: 'consumer@example.com',
              phone: '11900000000',
              city: 'São Paulo',
              state: 'SP',
            },
            planAtSubmission: 'FREE',
            status,
            createdAtUtc: '2026-11-09T12:00:00.000Z',
          },
        ],
      };
      const network = getNetwork(state.memberships);

      expect(network.mainCompanies).toEqual([]);
      expect(network.connectedCompanies).toEqual([]);
      expect(
        evaluateCampaignEligibility(
          { organizationId: academyId, offerCategory: 'GENERAL_CAMPAIGN', isActive: true },
          network,
        ).accessStatus,
      ).toBe('UNAVAILABLE');
    },
  );

  it('não usa solicitação APPROVED como substituta do vínculo ACTIVE', () => {
    const state: DemoMembershipState = {
      ...createEmptyDemoMembershipState(),
      requests: [
        {
          id: 'membership-request-demo-approved-without-membership',
          personIdentityId: consumerId,
          organizationId: academyId,
          applicantProfile: {
            id: 'consumer-profile-demo-approved-without-membership',
            publicRegistrationCode: 'VK-DEMO-APPROVED-001',
            fullName: 'Consumidor Demonstrativo',
            email: 'consumer@example.com',
            phone: '11900000000',
            city: 'São Paulo',
            state: 'SP',
          },
          planAtSubmission: 'FREE',
          status: 'APPROVED',
          createdAtUtc: '2026-11-09T12:00:00.000Z',
        },
      ],
    };

    const network = getNetwork(state.memberships);

    expect(network.mainCompanies).toEqual([]);
    expect(
      evaluateCampaignEligibility(
        { organizationId: academyId, offerCategory: 'GENERAL_CAMPAIGN', isActive: true },
        network,
      ),
    ).toMatchObject({
      relationship: 'NONE',
      networkStatus: 'INELIGIBLE',
      accessStatus: 'UNAVAILABLE',
      reason: 'NO_ACTIVE_PRIMARY_COMPANY',
    });
  });

  it('permite acesso potencial a campanhas gerais principal e diretamente conectada', () => {
    const network = getNetwork([membership(consumerId, academyId, 7)]);

    expect(
      evaluateCampaignEligibility(
        { organizationId: academyId, offerCategory: 'GENERAL_CAMPAIGN', isActive: true },
        network,
      ),
    ).toMatchObject({
      relationship: 'PRINCIPAL',
      originatingMainCompanyIds: [academyId],
      networkStatus: 'ELIGIBLE',
      accessStatus: 'POTENTIAL',
      participationStatus: 'NOT_STARTED',
      pointsCreditStatus: 'NOT_CREDITED',
      redemptionStatus: 'NOT_APPLICABLE',
    });
    expect(
      evaluateCampaignEligibility(
        { organizationId: supermarketId, offerCategory: 'GENERAL_CAMPAIGN', isActive: true },
        network,
      ),
    ).toMatchObject({
      relationship: 'CONNECTED',
      originatingMainCompanyIds: [academyId],
      networkStatus: 'ELIGIBLE',
      accessStatus: 'POTENTIAL',
    });
  });

  it('indica indisponibilidade fora da rede e respeita status não ativo da campanha', () => {
    const network = getNetwork([membership(consumerId, academyId, 8)]);

    expect(
      evaluateCampaignEligibility(
        { organizationId: internetId, offerCategory: 'GENERAL_CAMPAIGN', isActive: true },
        network,
      ),
    ).toMatchObject({ relationship: 'NONE', reason: 'OUTSIDE_ACTIVE_NETWORK' });
    expect(
      evaluateCampaignEligibility(
        { organizationId: academyId, offerCategory: 'GENERAL_CAMPAIGN', isActive: false },
        network,
      ),
    ).toMatchObject({
      relationship: 'PRINCIPAL',
      networkStatus: 'ELIGIBLE',
      accessStatus: 'UNAVAILABLE',
      reason: 'OFFER_NOT_ACTIVE',
    });
  });

  it('restringe benefícios exclusivos à própria empresa principal', () => {
    const network = getNetwork([membership(consumerId, academyId, 9)]);

    expect(
      evaluateCampaignEligibility(
        { organizationId: academyId, offerCategory: 'MAIN_COMPANY_EXCLUSIVE', isActive: true },
        network,
      ),
    ).toMatchObject({
      relationship: 'PRINCIPAL',
      accessStatus: 'POTENTIAL',
      redemptionStatus: 'NOT_AUTHORIZED',
      pendingRequirements: [
        'OFFER_RULES_NOT_EVALUATED',
        'BALANCE_NOT_VERIFIED',
        'REDEMPTION_RULES_NOT_EVALUATED',
      ],
    });
    expect(
      evaluateCampaignEligibility(
        { organizationId: barbershopId, offerCategory: 'MAIN_COMPANY_EXCLUSIVE', isActive: true },
        network,
      ),
    ).toMatchObject({
      relationship: 'CONNECTED',
      networkStatus: 'ELIGIBLE',
      accessStatus: 'UNAVAILABLE',
      reason: 'EXCLUSIVE_REQUIRES_PRIMARY_COMPANY',
    });
  });

  it('mantém campanhas gerais potencialmente acessíveis sem compra recente ou saldo', () => {
    const network = getNetwork([membership(consumerId, academyId, 10)]);
    const result = evaluateCampaignEligibility(
      { organizationId: supermarketId, offerCategory: 'GENERAL_CAMPAIGN', isActive: true },
      network,
    );

    expect(result).toMatchObject({
      accessStatus: 'POTENTIAL',
      participationStatus: 'NOT_STARTED',
      pointsCreditStatus: 'NOT_CREDITED',
      redemptionStatus: 'NOT_APPLICABLE',
      pendingRequirements: ['OFFER_RULES_NOT_EVALUATED'],
    });
    expect(result.pendingRequirements).not.toContain('BALANCE_NOT_VERIFIED');
  });

  it('permite acesso potencial a benefício de rede conectada, sem autorizar resgate', () => {
    const network = getNetwork([membership(consumerId, academyId, 11)]);
    const result = evaluateCampaignEligibility(
      { organizationId: supermarketId, offerCategory: 'NETWORK_BENEFIT', isActive: true },
      network,
    );

    expect(result).toMatchObject({
      relationship: 'CONNECTED',
      accessStatus: 'POTENTIAL',
      redemptionStatus: 'NOT_AUTHORIZED',
      pointsCreditStatus: 'NOT_CREDITED',
      pendingRequirements: expect.arrayContaining([
        'BALANCE_NOT_VERIFIED',
        'REDEMPTION_RULES_NOT_EVALUATED',
      ]),
    });
  });

  it('não concede acesso exclusivo a conexão direta e exige vínculo principal ativo', () => {
    const network = getNetwork([membership(consumerId, academyId, 12)]);
    const connectedExclusive = evaluateCampaignEligibility(
      {
        organizationId: barbershopId,
        offerCategory: 'MAIN_COMPANY_EXCLUSIVE',
        isActive: true,
      },
      network,
    );

    expect(connectedExclusive.accessStatus).toBe('UNAVAILABLE');
    expect(connectedExclusive.reason).toBe('EXCLUSIVE_REQUIRES_PRIMARY_COMPANY');
    expect(
      evaluateCampaignEligibility(
        {
          organizationId: academyId,
          offerCategory: 'MAIN_COMPANY_EXCLUSIVE',
          isActive: true,
        },
        network,
      ).accessStatus,
    ).toBe('POTENTIAL');
  });

  it('não deduplica ofertas ao unir redes nem converte elegibilidade em participação ou crédito', () => {
    const sharedConnections = [
      ...demoOrganizationConnections,
      connection('barbershop-supermarket', barbershopId, supermarketId),
    ];
    const network = getNetwork(
      [membership(consumerId, academyId, 13), membership(consumerId, barbershopId, 14)],
      sharedConnections,
    );
    const supermarketOrigin = network.connectedCompanies.find(
      ({ organization }) => organization.id === supermarketId,
    );
    const result = evaluateCampaignEligibility(
      { organizationId: supermarketId, offerCategory: 'NETWORK_BENEFIT', isActive: true },
      network,
    );

    expect(supermarketOrigin?.originatingMainCompanyIds).toEqual([academyId, barbershopId]);
    expect(
      network.organizations.filter(({ organization }) => organization.id === supermarketId),
    ).toHaveLength(1);
    expect(result.originatingMainCompanyIds).toEqual([academyId, barbershopId]);
    expect(result.participationStatus).toBe('NOT_APPLICABLE');
    expect(result.pointsCreditStatus).toBe('NOT_CREDITED');
    expect(result.redemptionStatus).toBe('NOT_AUTHORIZED');
  });

  it('trata organização promotora ausente do catálogo como indisponível', () => {
    const unknownOrganizationId = 'organization-demo-network-missing' as OrganizationId;
    const network = getNetwork([membership(consumerId, academyId, 22)]);

    expect(
      evaluateCampaignEligibility(
        {
          organizationId: unknownOrganizationId,
          offerCategory: 'NETWORK_BENEFIT',
          isActive: true,
        },
        network,
      ),
    ).toMatchObject({
      organizationId: unknownOrganizationId,
      relationship: 'NONE',
      networkStatus: 'INELIGIBLE',
      accessStatus: 'UNAVAILABLE',
      reason: 'OUTSIDE_ACTIVE_NETWORK',
    });
  });
});
