export type PersonIdentityId = `person-demo-${string}`;

export type OrganizationId = `organization-demo-${string}`;

export type OrganizationConnectionId = `organization-connection-demo-${string}`;

export type PersonalProfileType = 'CONSUMER' | 'BENEFICIARY';

export type OrganizationRole = 'ADMINISTRATOR';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'PREMIUM';

export type PersonIdentity = Readonly<{
  id: PersonIdentityId;
  displayName: string;
}>;

export type Organization = Readonly<{
  id: OrganizationId;
  displayName: string;
}>;

export type OrganizationConnection = Readonly<{
  id: OrganizationConnectionId;
  organizationIds: readonly [OrganizationId, OrganizationId];
}>;

export type MembershipRequestId = `membership-request-demo-${string}`;

export type MainCompanyMembershipRequest = Readonly<{
  id: MembershipRequestId;
  personIdentityId: PersonIdentityId;
  organizationId: OrganizationId;
  status: 'PENDING';
  createdAtUtc: string;
}>;

export type OrganizationAdministration = Readonly<{
  organizationId: OrganizationId;
  role: OrganizationRole;
}>;

export type OrganizationAffiliationType = 'EMPLOYMENT';

export type OrganizationAffiliation = Readonly<{
  organizationId: OrganizationId;
  type: OrganizationAffiliationType;
}>;

export type PlanPolicy = Readonly<{
  pointsValidityDays: number | null;
  mainNetworkExitGracePeriodDays: number;
}>;

export type DemoSession = Readonly<{
  personIdentity: PersonIdentity;
  activePersonalProfile: PersonalProfileType | null;
  organizationAdministrations: readonly OrganizationAdministration[];
  organizationAffiliations: readonly OrganizationAffiliation[];
  subscriptionPlan: SubscriptionPlan | null;
}>;
