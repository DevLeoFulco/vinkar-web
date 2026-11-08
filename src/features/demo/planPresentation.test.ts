import { describe, expect, it } from 'vitest';
import { getConsumerPlanPolicy } from './domain/policies';
import { getConsumerPlanPresentations } from './planPresentation';

describe('apresentação das políticas dos planos de consumidor', () => {
  it('apresenta os três planos com as políticas definidas no domínio', () => {
    const plans = getConsumerPlanPresentations();

    expect(plans.map(({ plan }) => plan)).toEqual(['FREE', 'PRO', 'PREMIUM']);
    for (const presentation of plans) {
      expect(presentation.policy).toEqual(getConsumerPlanPolicy(presentation.plan));
    }
  });

  it('formata a validade e a carência sem repetir regras no componente', () => {
    expect(getConsumerPlanPresentations()).toEqual([
      {
        plan: 'FREE',
        name: 'Gratuito',
        policy: getConsumerPlanPolicy('FREE'),
        pointsValidity: 'Pontos válidos por 90 dias corridos após o crédito.',
        networkExit: 'Carência de 30 dias corridos após a ativação.',
      },
      {
        plan: 'PRO',
        name: 'Pro',
        policy: getConsumerPlanPolicy('PRO'),
        pointsValidity: 'Pontos válidos por 180 dias corridos após o crédito.',
        networkExit: 'Carência de 15 dias corridos após a ativação.',
      },
      {
        plan: 'PREMIUM',
        name: 'Premium',
        policy: getConsumerPlanPolicy('PREMIUM'),
        pointsValidity: 'Pontos sem expiração.',
        networkExit: 'Saída imediata da rede principal.',
      },
    ]);
  });
});
