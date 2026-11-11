import type {
  NationalTaxIdentifier,
  Organization,
  OrganizationId,
  OrganizationRole,
  PersonIdentityId,
  PersonalProfileType,
  RegistrationStatus,
  VinkarPublicCode,
} from './models';

export type PersonalProfileId = `personal-profile-demo-${string}`;
export type OrganizationRegistrationId = `organization-registration-demo-${string}`;
export type OrganizationValidationStatus = 'NOT_STARTED' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
export type OrganizationAdministratorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export type PersonalProfile = Readonly<{
  id: PersonalProfileId;
  personIdentityId: PersonIdentityId;
  type: PersonalProfileType;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}>;

export type ConsumerInterestCategory =
  | 'FOOD'
  | 'HEALTH'
  | 'BEAUTY'
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'SERVICES'
  | 'SPORTS'
  | 'TRANSPORT';
export type DeclaredConsumptionFrequency = 'WEEKLY' | 'MONTHLY' | 'OCCASIONAL';
export type DeclaredSpendRange = 'UP_TO_100' | '100_TO_500' | '500_TO_1500' | 'OVER_1500';
export type PreferredBenefitType = 'DISCOUNT' | 'CASHBACK' | 'POINTS' | 'EXPERIENCE' | 'SERVICE';
export type CommunicationChannel = 'EMAIL' | 'SMS' | 'PUSH';

export type ConsumerPreferences = Readonly<{
  interestCategories?: readonly ConsumerInterestCategory[];
  declaredFrequency?: DeclaredConsumptionFrequency;
  declaredSpendRange?: DeclaredSpendRange;
  preferredBenefitTypes?: readonly PreferredBenefitType[];
  communicationChannels?: readonly CommunicationChannel[];
  personalizationEnabled?: boolean;
}>;

export type DeclaredConsumptionData = Readonly<{
  source: 'DECLARED';
  frequency?: DeclaredConsumptionFrequency;
  spendRange?: DeclaredSpendRange;
}>;

export type ObservedConsumptionData = Readonly<{
  source: 'OBSERVED';
  evidenceReference: string;
  observedAtUtc: string;
}>;

export type ConsumerProfileData = Readonly<{
  preferences?: ConsumerPreferences;
  declaredConsumption?: DeclaredConsumptionData;
  observedConsumption?: ObservedConsumptionData;
}>;

export type OrganizationContactDetails = Readonly<{
  email?: string;
  phone?: string;
}>;

export type OrganizationRegistration = Readonly<{
  id: OrganizationRegistrationId;
  organization: Organization &
    Readonly<{
      publicRegistrationCode?: VinkarPublicCode;
      nationalTaxIdentifier?: NationalTaxIdentifier;
      contacts: OrganizationContactDetails;
    }>;
  requestedByPersonIdentityId: PersonIdentityId;
  responsiblePersonIdentityId: PersonIdentityId;
  registrationStatus: RegistrationStatus;
  validationStatus: OrganizationValidationStatus;
  validationDecision?: OrganizationValidationDecision;
  administrators: readonly OrganizationAdministratorAssignment[];
  createdAtUtc: string;
  updatedAtUtc: string;
}>;

export type OrganizationValidationDecision = Readonly<{
  decidedByPersonIdentityId: PersonIdentityId;
  evidenceReference: string;
  reason?: string;
}>;

export type OrganizationAdministratorAssignment = Readonly<{
  personIdentityId: PersonIdentityId;
  organizationId: OrganizationId;
  role: OrganizationRole;
  status: OrganizationAdministratorStatus;
}>;

export type ProcessingLegalBasis =
  'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'LEGITIMATE_INTEREST' | 'OTHER';

export type ProcessingPurposeRecord = Readonly<{
  personIdentityId: PersonIdentityId;
  purposeId: string;
  description: string;
  legalBasis: ProcessingLegalBasis;
  consentChoice: 'GRANTED' | 'WITHDRAWN' | 'NOT_REQUIRED';
  policyVersion: string;
  recordedAtUtc: string;
}>;

export type PersonalDataAttribute = 'FULL_NAME' | 'CONTACTS' | 'NATIONAL_TAX_IDENTIFIER';

export type PersonalDataAccessGrant = Readonly<{
  personIdentityId: PersonIdentityId;
  organizationId: OrganizationId;
  processingPurpose: ProcessingPurposeRecord;
  allowedAttributes: readonly PersonalDataAttribute[];
  expiresAtUtc: string;
}>;

export type RegistrationAuditAction =
  | 'PERSON_CREATED'
  | 'PERSON_UPDATED'
  | 'PERSON_STATUS_CHANGED'
  | 'PROFILE_ACTIVATED'
  | 'ORGANIZATION_SUBMITTED'
  | 'ORGANIZATION_STATUS_CHANGED'
  | 'ORGANIZATION_VALIDATION_CHANGED'
  | 'ADMINISTRATOR_ASSIGNED'
  | 'PERSONAL_DATA_ACCESS_GRANTED'
  | 'CORRECTION_REQUESTED';

export type RegistrationAuditEvent = Readonly<{
  action: RegistrationAuditAction;
  subjectId: PersonIdentityId | OrganizationRegistrationId;
  actorPersonIdentityId?: PersonIdentityId;
  occurredAtUtc: string;
  correlationId?: string;
}>;

export type IdentityCorrectionRequest = Readonly<{
  personIdentityId: PersonIdentityId;
  requestedFields: readonly ('FULL_NAME' | 'CONTACTS' | 'NATIONAL_TAX_IDENTIFIER')[];
  requestedAtUtc: string;
  status: 'OPEN' | 'COMPLETED' | 'REJECTED';
}>;

export type PublicPersonRegistrationStatus = Readonly<{
  registrationStatus: RegistrationStatus;
}>;

export type PersonIdentityRegistrationInput = Readonly<{
  id: PersonIdentityId;
  publicRegistrationCode: string;
  fullName: string;
  nationalTaxIdentifier?: NationalTaxIdentifier;
  contacts: Readonly<{ email: string; phone?: string }>;
  createdAt: Date;
}>;

export type PersonIdentityUpdate = Readonly<{
  publicRegistrationCode?: string;
  fullName?: string;
  nationalTaxIdentifier?: NationalTaxIdentifier;
  contacts?: Readonly<{ email: string; phone?: string }>;
}>;

export type OrganizationRegistrationInput = Readonly<{
  id: OrganizationRegistrationId;
  organization: Organization &
    Readonly<{
      publicRegistrationCode?: string;
      nationalTaxIdentifier?: NationalTaxIdentifier;
      contacts: OrganizationContactDetails;
    }>;
  requestedByPersonIdentityId: PersonIdentityId;
  responsiblePersonIdentityId: PersonIdentityId;
  createdAt: Date;
}>;
