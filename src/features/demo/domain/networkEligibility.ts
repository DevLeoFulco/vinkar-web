import type {
  MainCompanyMembership,
  Organization,
  OrganizationConnection,
  OrganizationId,
  PersonIdentityId,
} from './models';

export type OrganizationNetworkRelationship = 'PRINCIPAL' | 'CONNECTED' | 'NONE';
export type OfferCategory = 'GENERAL_CAMPAIGN' | 'NETWORK_BENEFIT' | 'MAIN_COMPANY_EXCLUSIVE';
export type CampaignOfferType = OfferCategory;
export type OfferAccessStatus = 'POTENTIAL' | 'UNAVAILABLE';
export type OfferEligibilityStatus = 'POTENTIAL' | 'UNAVAILABLE';
export type OfferAccessReason =
  | 'NO_ACTIVE_PRIMARY_COMPANY'
  | 'OUTSIDE_ACTIVE_NETWORK'
  | 'EXCLUSIVE_REQUIRES_PRIMARY_COMPANY'
  | 'OFFER_NOT_ACTIVE';
export type PendingOfferRequirement =
  'OFFER_RULES_NOT_EVALUATED' | 'BALANCE_NOT_VERIFIED' | 'REDEMPTION_RULES_NOT_EVALUATED';
export type OfferParticipationStatus = 'NOT_STARTED' | 'NOT_APPLICABLE';
export type PointsCreditStatus = 'NOT_CREDITED';
export type RedemptionAuthorizationStatus = 'NOT_AUTHORIZED' | 'NOT_APPLICABLE';
export type OfferEligibilityResult = Readonly<{
  organizationId: OrganizationId;
  relationship: OrganizationNetworkRelationship;
  originatingMainCompanyIds: readonly OrganizationId[];
  offerCategory: OfferCategory;
  networkStatus: 'ELIGIBLE' | 'INELIGIBLE';
  offerEligibilityStatus: OfferEligibilityStatus;
  accessStatus: OfferAccessStatus;
  participationStatus: OfferParticipationStatus;
  pointsCreditStatus: PointsCreditStatus;
  redemptionStatus: RedemptionAuthorizationStatus;
  pendingRequirements: readonly PendingOfferRequirement[];
  reason?: OfferAccessReason;
}>;
export type CampaignEligibilityResult = OfferEligibilityResult;

export type EligibleOrganization = Readonly<{
  organization: Organization;
  relationship: Exclude<OrganizationNetworkRelationship, 'NONE'>;
  originatingMainCompanyIds: readonly OrganizationId[];
}>;

export type ConsumerNetworkEligibility = Readonly<{
  personIdentityId: PersonIdentityId;
  mainCompanies: readonly Organization[];
  connectedCompanies: readonly EligibleOrganization[];
  organizations: readonly EligibleOrganization[];
}>;

export function getConsumerNetworkEligibility(input: {
  personIdentityId: PersonIdentityId;
  memberships: readonly MainCompanyMembership[];
  organizations: readonly Organization[];
  connections: readonly OrganizationConnection[];
}): ConsumerNetworkEligibility {
  const { personIdentityId, memberships, organizations, connections } = input;
  const organizationsById = new Map(
    organizations.map((organization) => [organization.id, organization]),
  );
  const mainCompaniesById = new Map<OrganizationId, Organization>();

  for (const membership of memberships) {
    if (membership.personIdentityId !== personIdentityId || membership.status !== 'ACTIVE') {
      continue;
    }
    const organization = organizationsById.get(membership.organizationId);
    if (organization) {
      mainCompaniesById.set(organization.id, organization);
    }
  }

  const connectedById = new Map<OrganizationId, Set<OrganizationId>>();
  for (const connection of connections) {
    const [firstId, secondId] = connection.organizationIds;
    const firstIsMain = mainCompaniesById.has(firstId);
    const secondIsMain = mainCompaniesById.has(secondId);

    if (firstIsMain && organizationsById.has(secondId) && !mainCompaniesById.has(secondId)) {
      const origins = connectedById.get(secondId) ?? new Set<OrganizationId>();
      origins.add(firstId);
      connectedById.set(secondId, origins);
    }
    if (secondIsMain && organizationsById.has(firstId) && !mainCompaniesById.has(firstId)) {
      const origins = connectedById.get(firstId) ?? new Set<OrganizationId>();
      origins.add(secondId);
      connectedById.set(firstId, origins);
    }
  }

  const mainCompanies = Object.freeze([...mainCompaniesById.values()]);
  const mainCompanyIds = new Set(mainCompaniesById.keys());
  const connectedCompanies = Object.freeze(
    [...connectedById.entries()].flatMap(([organizationId, originIds]) => {
      if (mainCompanyIds.has(organizationId)) {
        return [];
      }
      const organization = organizationsById.get(organizationId);
      if (!organization) {
        return [];
      }
      return [
        Object.freeze({
          organization,
          relationship: 'CONNECTED' as const,
          originatingMainCompanyIds: Object.freeze([...originIds]),
        }),
      ];
    }),
  );
  const mainOrganizations = mainCompanies.map((organization) =>
    Object.freeze({
      organization,
      relationship: 'PRINCIPAL' as const,
      originatingMainCompanyIds: Object.freeze([organization.id]),
    }),
  );

  return Object.freeze({
    personIdentityId,
    mainCompanies,
    connectedCompanies,
    organizations: Object.freeze([...mainOrganizations, ...connectedCompanies]),
  });
}

export function evaluateOfferEligibility(
  input: {
    organizationId: OrganizationId;
    offerCategory: OfferCategory;
    isActive: boolean;
  },
  network: ConsumerNetworkEligibility,
): OfferEligibilityResult {
  const principal = network.mainCompanies.find(({ id }) => id === input.organizationId);
  const connected = network.connectedCompanies.find(
    ({ organization }) => organization.id === input.organizationId,
  );
  const relationship: OrganizationNetworkRelationship = principal
    ? 'PRINCIPAL'
    : connected
      ? 'CONNECTED'
      : 'NONE';
  const originatingMainCompanyIds = principal
    ? [principal.id]
    : (connected?.originatingMainCompanyIds ?? []);
  const networkStatus = relationship === 'NONE' ? 'INELIGIBLE' : 'ELIGIBLE';

  let reason: OfferAccessReason | undefined;
  if (!input.isActive) {
    reason = 'OFFER_NOT_ACTIVE';
  } else if (relationship === 'NONE') {
    reason =
      network.mainCompanies.length === 0 ? 'NO_ACTIVE_PRIMARY_COMPANY' : 'OUTSIDE_ACTIVE_NETWORK';
  } else if (input.offerCategory === 'MAIN_COMPANY_EXCLUSIVE' && relationship !== 'PRINCIPAL') {
    reason = 'EXCLUSIVE_REQUIRES_PRIMARY_COMPANY';
  }

  const offerEligibilityStatus: OfferEligibilityStatus = reason ? 'UNAVAILABLE' : 'POTENTIAL';
  const isBenefit = input.offerCategory !== 'GENERAL_CAMPAIGN';
  const pendingRequirements: PendingOfferRequirement[] =
    offerEligibilityStatus === 'UNAVAILABLE'
      ? []
      : isBenefit
        ? ['OFFER_RULES_NOT_EVALUATED', 'BALANCE_NOT_VERIFIED', 'REDEMPTION_RULES_NOT_EVALUATED']
        : ['OFFER_RULES_NOT_EVALUATED'];

  return Object.freeze({
    organizationId: input.organizationId,
    relationship,
    originatingMainCompanyIds: Object.freeze(originatingMainCompanyIds),
    offerCategory: input.offerCategory,
    networkStatus,
    offerEligibilityStatus,
    accessStatus: offerEligibilityStatus,
    participationStatus:
      input.offerCategory === 'GENERAL_CAMPAIGN' ? 'NOT_STARTED' : 'NOT_APPLICABLE',
    pointsCreditStatus: 'NOT_CREDITED',
    redemptionStatus: isBenefit ? 'NOT_AUTHORIZED' : 'NOT_APPLICABLE',
    pendingRequirements: Object.freeze(pendingRequirements),
    ...(reason ? { reason } : {}),
  });
}

export const evaluateCampaignEligibility = evaluateOfferEligibility;
