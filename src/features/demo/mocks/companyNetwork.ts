import type { Organization, OrganizationConnection, OrganizationId } from '../domain/models';

export type DemoCompanySegment = 'ACADEMY' | 'BARBERSHOP' | 'SUPERMARKET' | 'INTERNET';

export type DemoCompany = Readonly<
  Organization & {
    segment: DemoCompanySegment;
    segmentLabel: string;
    symbol: string;
    description: string;
  }
>;

const barbershop: DemoCompany = Object.freeze({
  id: 'organization-demo-network-barbershop',
  displayName: 'Barbearia Ponto Zero Demo',
  segment: 'BARBERSHOP',
  segmentLabel: 'Barbearia',
  symbol: '✂️',
  description: 'Estabelecimento fictício de cuidados pessoais.',
});

const supermarket: DemoCompany = Object.freeze({
  id: 'organization-demo-network-supermarket',
  displayName: 'Mercado Raiz Demo',
  segment: 'SUPERMARKET',
  segmentLabel: 'Supermercado',
  symbol: '🛒',
  description: 'Mercado fictício para demonstração de segmentos da rede.',
});

const academy: DemoCompany = Object.freeze({
  id: 'organization-demo-network-academy',
  displayName: 'Academia Horizonte Demo',
  segment: 'ACADEMY',
  segmentLabel: 'Academia',
  symbol: '🏋️',
  description: 'Espaço demonstrativo para atividades físicas e bem-estar.',
});

const internetProvider: DemoCompany = Object.freeze({
  id: 'organization-demo-network-internet',
  displayName: 'Provedor Nuvem Azul Demo',
  segment: 'INTERNET',
  segmentLabel: 'Internet',
  symbol: '🌐',
  description: 'Provedor fictício de serviços de internet.',
});

export const demoCompanies: readonly DemoCompany[] = Object.freeze([
  barbershop,
  supermarket,
  academy,
  internetProvider,
]);

export const demoOrganizationConnections: readonly OrganizationConnection[] = Object.freeze([
  Object.freeze({
    id: 'organization-connection-demo-academy-barbershop',
    organizationIds: Object.freeze([academy.id, barbershop.id] as const),
  }),
  Object.freeze({
    id: 'organization-connection-demo-academy-supermarket',
    organizationIds: Object.freeze([academy.id, supermarket.id] as const),
  }),
]);

export function getDemoCompanies(): readonly DemoCompany[] {
  return demoCompanies;
}

export function getDemoCompany(id: OrganizationId): DemoCompany | undefined {
  return demoCompanies.find((company) => company.id === id);
}

export function getDirectCompanyConnections(
  organizationId: OrganizationId,
): readonly DemoCompany[] {
  const connectedOrganizationIds = demoOrganizationConnections.flatMap((connection) => {
    if (!connection.organizationIds.includes(organizationId)) {
      return [];
    }

    return connection.organizationIds.filter((connectedId) => connectedId !== organizationId);
  });

  return Object.freeze(
    connectedOrganizationIds.flatMap((connectedId) => {
      const company = getDemoCompany(connectedId);
      return company ? [company] : [];
    }),
  );
}
