import type { PlanPolicy, SubscriptionPlan } from './models';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const CONSUMER_PLAN_POLICIES: Readonly<Record<SubscriptionPlan, PlanPolicy>> = Object.freeze({
  FREE: Object.freeze({
    pointsValidityDays: 90,
    mainNetworkExitGracePeriodDays: 30,
    mainCompanyCapacity: 1,
  }),
  PRO: Object.freeze({
    pointsValidityDays: 180,
    mainNetworkExitGracePeriodDays: 15,
    mainCompanyCapacity: 3,
  }),
  PREMIUM: Object.freeze({
    pointsValidityDays: null,
    mainNetworkExitGracePeriodDays: 0,
    mainCompanyCapacity: 5,
  }),
});

function getUtcTimestamp(instant: Date, parameterName: string): number {
  const timestamp = instant.getTime();

  if (!Number.isFinite(timestamp)) {
    throw new RangeError(`${parameterName} deve ser uma data válida.`);
  }

  return timestamp;
}

function addUtcDays(utcTimestamp: number, numberOfDays: number): Date {
  const result = new Date(utcTimestamp + numberOfDays * DAY_IN_MILLISECONDS);

  if (!Number.isFinite(result.getTime())) {
    throw new RangeError('O resultado do cálculo excede o intervalo de datas suportado.');
  }

  return result;
}

export function getConsumerPlanPolicy(plan: SubscriptionPlan): PlanPolicy {
  return CONSUMER_PLAN_POLICIES[plan];
}

export function calculatePointsExpirationAt(plan: SubscriptionPlan, creditedAt: Date): Date | null {
  const creditedAtTimestamp = getUtcTimestamp(creditedAt, 'creditedAt');
  const { pointsValidityDays } = getConsumerPlanPolicy(plan);

  if (pointsValidityDays === null) {
    return null;
  }

  return addUtcDays(creditedAtTimestamp, pointsValidityDays);
}

export function calculateMainNetworkExitEligibleAt(
  plan: SubscriptionPlan,
  membershipActivatedAt: Date,
): Date {
  const activationTimestamp = getUtcTimestamp(membershipActivatedAt, 'membershipActivatedAt');
  const { mainNetworkExitGracePeriodDays } = getConsumerPlanPolicy(plan);

  return addUtcDays(activationTimestamp, mainNetworkExitGracePeriodDays);
}

export function canExitMainNetwork(
  plan: SubscriptionPlan,
  membershipActivatedAt: Date,
  currentAt: Date,
): boolean {
  const currentTimestamp = getUtcTimestamp(currentAt, 'currentAt');
  const eligibleAt = calculateMainNetworkExitEligibleAt(plan, membershipActivatedAt);

  return currentTimestamp >= eligibleAt.getTime();
}
