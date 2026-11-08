export type PersonIdentityId = `person-demo-${string}`;

export type OrganizationId = `organization-demo-${string}`;

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

export type OrganizationAdministration = Readonly<{
  organizationId: OrganizationId;
  role: OrganizationRole;
}>;

export type PlanPolicy = Readonly<{
  pointsValidityDays: number | null;
  mainNetworkExitGracePeriodDays: number;
}>;

export type DemoSession = Readonly<{
  personIdentity: PersonIdentity;
  activePersonalProfile: PersonalProfileType | null;
  organizationAdministrations: readonly OrganizationAdministration[];
  subscriptionPlan: SubscriptionPlan | null;
}>;
