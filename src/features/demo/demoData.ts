export type CampaignStatus = 'Ativa' | 'Rascunho' | 'Encerrada';

export type Campaign = {
  id: number;
  title: string;
  business: string;
  segment: string;
  description: string;
  status: CampaignStatus;
};

export const demoCampaigns: Campaign[] = [
  {
    id: 1,
    title: 'Sua próxima visita vale mais',
    business: 'Barbearia do Matuto',
    segment: 'Barbearia',
    description: 'Benefício especial na próxima visita, sujeito às condições.',
    status: 'Ativa',
  },
  {
    id: 2,
    title: 'Semana do bem-estar',
    business: 'Academia Hangar Fit',
    segment: 'Academia',
    description: 'Conheça as vantagens para novos alunos.',
    status: 'Ativa',
  },
  {
    id: 3,
    title: 'Ofertas do bairro',
    business: 'Varejão Econômico',
    segment: 'Supermercado',
    description: 'Seleção de vantagens para clientes cadastrados.',
    status: 'Ativa',
  },
  {
    id: 4,
    title: 'Conexão que aproxima',
    business: 'Powertec',
    segment: 'Internet',
    description: 'Condições especiais para novos assinantes.',
    status: 'Rascunho',
  },
];
