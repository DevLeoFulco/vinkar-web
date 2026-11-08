import { getConsumerPlanPolicy } from './domain/policies';
import type { PlanPolicy, SubscriptionPlan } from './domain/models';

const planNames: Readonly<Record<SubscriptionPlan, string>> = {
  FREE: 'Gratuito',
  PRO: 'Pro',
  PREMIUM: 'Premium',
};

export type ConsumerPlanPresentation = Readonly<{
  plan: SubscriptionPlan;
  name: string;
  policy: PlanPolicy;
  pointsValidity: string;
  networkExit: string;
}>;

function formatPointsValidity(policy: PlanPolicy): string {
  if (policy.pointsValidityDays === null) {
    return 'Pontos sem expiração.';
  }

  return `Pontos válidos por ${policy.pointsValidityDays} dias corridos após o crédito.`;
}

function formatNetworkExit(policy: PlanPolicy): string {
  if (policy.mainNetworkExitGracePeriodDays === 0) {
    return 'Saída imediata da rede principal.';
  }

  return `Carência de ${policy.mainNetworkExitGracePeriodDays} dias corridos após a ativação.`;
}

export function getConsumerPlanPresentations(): readonly ConsumerPlanPresentation[] {
  const plans: readonly SubscriptionPlan[] = ['FREE', 'PRO', 'PREMIUM'];

  return plans.map((plan) => {
    const policy = getConsumerPlanPolicy(plan);

    return {
      plan,
      name: planNames[plan],
      policy,
      pointsValidity: formatPointsValidity(policy),
      networkExit: formatNetworkExit(policy),
    };
  });
}
