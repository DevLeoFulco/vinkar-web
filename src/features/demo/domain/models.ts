export type PersonIdentityId = `person-demo-${string}`;

export type VinkarPublicCode = `VK-${string}`;

export type OrganizationId = `organization-demo-${string}`;

export type OrganizationConnectionId = `organization-connection-demo-${string}`;

export type PersonalProfileType = 'CONSUMER' | 'BENEFICIARY';

export type OrganizationRole = 'ADMINISTRATOR';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'PREMIUM';

export type RegistrationStatus =
  'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACTIVE' | 'BLOCKED' | 'REJECTED';

export type NationalTaxIdentifier = Readonly<{
  countryCode: string;
  value: string;
}>;

export type PersonContactDetails = Readonly<{
  email: string;
  phone?: string;
}>;

export type PersonIdentity = Readonly<{
  id: PersonIdentityId;
  publicRegistrationCode: VinkarPublicCode;
  fullName: string;
  nationalTaxIdentifier?: NationalTaxIdentifier;
  contacts: PersonContactDetails;
  registrationStatus: RegistrationStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
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

export type MembershipCommandId = `membership-command-demo-${string}`;

export type ConsumerProfileId = `consumer-profile-demo-${string}`;

export type MembershipApplicantProfile = Readonly<{
  id: ConsumerProfileId;
  publicRegistrationCode: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}>;

export type DemoConsumerProfile = Readonly<
  MembershipApplicantProfile & {
    personIdentityId: PersonIdentityId;
  }
>;

export type MembershipRequestStatus = 'PENDING' | 'RETURNED' | 'APPROVED' | 'REJECTED';

export type MainCompanyMembershipRequest = Readonly<{
  id: MembershipRequestId;
  personIdentityId: PersonIdentityId;
  organizationId: OrganizationId;
  applicantProfile: MembershipApplicantProfile;
  planAtSubmission: SubscriptionPlan;
  status: MembershipRequestStatus;
  createdAtUtc: string;
}>;

export type MainCompanyMembershipId = `main-company-membership-demo-${string}`;

export type MainCompanyMembership = Readonly<{
  id: MainCompanyMembershipId;
  personIdentityId: PersonIdentityId;
  organizationId: OrganizationId;
  status: 'ACTIVE';
  activatedAtUtc: string;
  approvedRequestId: MembershipRequestId;
  planAtActivation: SubscriptionPlan;
}>;

export type MembershipRequestReviewId = `membership-review-demo-${string}`;

export type MembershipRequestReviewAction =
  'SUBMITTED' | 'RETURNED' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';

export type MembershipRequestReview = Readonly<{
  id: MembershipRequestReviewId;
  commandId: MembershipCommandId;
  requestId: MembershipRequestId;
  action: MembershipRequestReviewAction;
  actorPersonIdentityId: PersonIdentityId;
  organizationId?: OrganizationId;
  createdAtUtc: string;
  reason?: string;
}>;

export type ProcessedMembershipCommand = Readonly<{
  id: MembershipCommandId;
  action: MembershipRequestReviewAction | 'CREATED';
  requestId: MembershipRequestId;
  targetId: string;
  fingerprint: string;
}>;

export type DemoMembershipState = Readonly<{
  requests: readonly MainCompanyMembershipRequest[];
  memberships: readonly MainCompanyMembership[];
  reviews: readonly MembershipRequestReview[];
  processedCommands: readonly ProcessedMembershipCommand[];
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
  mainCompanyCapacity: number;
}>;

export type DemoSession = Readonly<{
  personIdentity: PersonIdentity;
  activePersonalProfile: PersonalProfileType | null;
  organizationAdministrations: readonly OrganizationAdministration[];
  organizationAffiliations: readonly OrganizationAffiliation[];
  subscriptionPlan: SubscriptionPlan | null;
}>;
