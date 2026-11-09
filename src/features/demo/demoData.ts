import type { OfferCategory } from './domain/networkEligibility';
import type { OrganizationId } from './domain/models';

export type CampaignStatus = 'Ativa' | 'Rascunho' | 'Encerrada';

export type Campaign = {
  id: number;
  title: string;
  organizationId: OrganizationId;
  offerCategory: OfferCategory;
  business: string;
  segment: string;
  description: string;
  status: CampaignStatus;
};

export const demoCampaigns: Campaign[] = [
  {
    id: 1,
    title: 'Sua próxima visita vale mais',
    organizationId: 'organization-demo-network-barbershop',
    offerCategory: 'MAIN_COMPANY_EXCLUSIVE',
    business: 'Barbearia do Matuto',
    segment: 'Barbearia',
    description: 'Benefício especial na próxima visita, sujeito às condições.',
    status: 'Ativa',
  },
  {
    id: 2,
    title: 'Semana do bem-estar',
    organizationId: 'organization-demo-network-academy',
    offerCategory: 'GENERAL_CAMPAIGN',
    business: 'Academia Hangar Fit',
    segment: 'Academia',
    description: 'Conheça as vantagens para novos alunos.',
    status: 'Ativa',
  },
  {
    id: 3,
    title: 'Ofertas do bairro',
    organizationId: 'organization-demo-network-supermarket',
    offerCategory: 'NETWORK_BENEFIT',
    business: 'Varejão Econômico',
    segment: 'Supermercado',
    description: 'Seleção de vantagens para clientes cadastrados.',
    status: 'Ativa',
  },
  {
    id: 4,
    title: 'Conexão que aproxima',
    organizationId: 'organization-demo-network-internet',
    offerCategory: 'GENERAL_CAMPAIGN',
    business: 'Powertec',
    segment: 'Internet',
    description: 'Condições especiais para novos assinantes.',
    status: 'Rascunho',
  },
];
