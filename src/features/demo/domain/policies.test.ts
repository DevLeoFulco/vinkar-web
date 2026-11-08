import { describe, expect, it } from 'vitest';
import {
  calculateMainNetworkExitEligibleAt,
  calculatePointsExpirationAt,
  canExitMainNetwork,
  getConsumerPlanPolicy,
} from './policies';
import type { DemoSession, Organization, PersonalProfileType, SubscriptionPlan } from './models';

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000;
const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS;

const personIdentity = {
  id: 'person-demo-001',
  displayName: 'Pessoa demonstrativa',
} as const satisfies DemoSession['personIdentity'];

const organization = {
  id: 'organization-demo-001',
  displayName: 'Organização demonstrativa',
} as const satisfies Organization;

describe('modelos do domínio demonstrativo', () => {
  it('representa no máximo um perfil pessoal ativo para uma identidade', () => {
    function createSession(activePersonalProfile: PersonalProfileType): DemoSession {
      return {
        personIdentity,
        activePersonalProfile,
        organizationAdministrations: [],
        subscriptionPlan: null,
      };
    }

    const consumerSession = createSession('CONSUMER');
    const beneficiarySession = createSession('BENEFICIARY');

    expect(consumerSession.activePersonalProfile).toBe('CONSUMER');
    expect(beneficiarySession.activePersonalProfile).toBe('BENEFICIARY');
    expect(consumerSession.personIdentity).toBe(beneficiarySession.personIdentity);
  });

  it('mantém administração empresarial e plano independentes do perfil pessoal', () => {
    const session: DemoSession = {
      personIdentity,
      activePersonalProfile: 'CONSUMER',
      organizationAdministrations: [
        {
          organizationId: organization.id,
          role: 'ADMINISTRATOR',
        },
      ],
      subscriptionPlan: 'FREE',
    };

    expect(session.organizationAdministrations[0]).toEqual({
      organizationId: 'organization-demo-001',
      role: 'ADMINISTRATOR',
    });
    expect(session.activePersonalProfile).toBe('CONSUMER');
    expect(session.subscriptionPlan).toBe('FREE');
  });
});

describe('políticas dos planos de consumidor', () => {
  const creditedAt = new Date('2026-01-15T10:30:00.000Z');
  const membershipActivatedAt = new Date('2026-02-01T08:00:00.000Z');

  it.each([
    ['FREE', 90],
    ['PRO', 180],
  ] as const satisfies readonly (readonly [SubscriptionPlan, number])[])(
    'expira pontos do plano %s após %s dias corridos exatos',
    (plan, validityDays) => {
      const expirationAt = calculatePointsExpirationAt(plan, creditedAt);

      expect(expirationAt?.getTime()).toBe(
        creditedAt.getTime() + validityDays * DAY_IN_MILLISECONDS,
      );
    },
  );

  it('não define expiração para pontos do plano PREMIUM', () => {
    expect(calculatePointsExpirationAt('PREMIUM', creditedAt)).toBeNull();
    expect(getConsumerPlanPolicy('PREMIUM').pointsValidityDays).toBeNull();
  });

  it('calcula a validade de cada lote a partir do seu próprio instante de crédito', () => {
    const firstCreditAt = new Date('2026-01-15T10:30:00.000Z');
    const secondCreditAt = new Date('2026-01-16T10:30:00.000Z');

    expect(calculatePointsExpirationAt('FREE', firstCreditAt)?.getTime()).toBe(
      firstCreditAt.getTime() + 90 * DAY_IN_MILLISECONDS,
    );
    expect(calculatePointsExpirationAt('FREE', secondCreditAt)?.getTime()).toBe(
      secondCreditAt.getTime() + 90 * DAY_IN_MILLISECONDS,
    );
  });

  it.each([
    ['FREE', 30],
    ['PRO', 15],
  ] as const satisfies readonly (readonly [SubscriptionPlan, number])[])(
    'calcula a saída do plano %s após %s dias corridos exatos',
    (plan, gracePeriodDays) => {
      const eligibleAt = calculateMainNetworkExitEligibleAt(plan, membershipActivatedAt);

      expect(eligibleAt.getTime()).toBe(
        membershipActivatedAt.getTime() + gracePeriodDays * DAY_IN_MILLISECONDS,
      );
    },
  );

  it('permite a saída imediata para PREMIUM', () => {
    expect(calculateMainNetworkExitEligibleAt('PREMIUM', membershipActivatedAt)).toEqual(
      membershipActivatedAt,
    );
    expect(canExitMainNetwork('PREMIUM', membershipActivatedAt, membershipActivatedAt)).toBe(true);
  });

  it.each([
    ['FREE', 30],
    ['PRO', 15],
  ] as const satisfies readonly (readonly [SubscriptionPlan, number])[])(
    'não permite saída um milissegundo antes do limite do plano %s e permite no limite',
    (plan, gracePeriodDays) => {
      const eligibleTimestamp =
        membershipActivatedAt.getTime() + gracePeriodDays * DAY_IN_MILLISECONDS;

      expect(canExitMainNetwork(plan, membershipActivatedAt, new Date(eligibleTimestamp - 1))).toBe(
        false,
      );
      expect(canExitMainNetwork(plan, membershipActivatedAt, new Date(eligibleTimestamp))).toBe(
        true,
      );
      expect(canExitMainNetwork(plan, membershipActivatedAt, new Date(eligibleTimestamp + 1))).toBe(
        true,
      );
    },
  );

  it('usa o instante exato do limite de expiração calculado para cada lote', () => {
    const expirationAt = calculatePointsExpirationAt('FREE', creditedAt);

    expect(expirationAt).not.toBeNull();
    expect(expirationAt?.getTime()).toBe(creditedAt.getTime() + 90 * DAY_IN_MILLISECONDS);
  });

  it('calcula durações em tempo UTC mesmo atravessando uma mudança de fuso sazonal', () => {
    const creditedAtWithOffset = new Date('2026-03-07T12:00:00.000-05:00');
    const creditedAtUtc = new Date('2026-03-07T17:00:00.000Z');
    const offsetExpiration = calculatePointsExpirationAt('FREE', creditedAtWithOffset);
    const utcExpiration = calculatePointsExpirationAt('FREE', creditedAtUtc);

    expect(offsetExpiration?.getTime()).toBe(utcExpiration?.getTime());
    expect(offsetExpiration?.toISOString()).toBe(
      new Date(creditedAtUtc.getTime() + 90 * DAY_IN_MILLISECONDS).toISOString(),
    );
  });

  it('rejeita instantes inválidos em vez de produzir uma data ou decisão silenciosa', () => {
    const invalidInstant = new Date(Number.NaN);
    const instantNearDateLimit = new Date(8.64e15);

    expect(() => calculatePointsExpirationAt('FREE', invalidInstant)).toThrow(RangeError);
    expect(() => canExitMainNetwork('FREE', membershipActivatedAt, invalidInstant)).toThrow(
      RangeError,
    );
    expect(() => calculatePointsExpirationAt('FREE', instantNearDateLimit)).toThrow(RangeError);
  });
});
