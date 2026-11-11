import type {
  NationalTaxIdentifier,
  OrganizationId,
  PersonIdentity,
  PersonIdentityId,
  RegistrationStatus,
  VinkarPublicCode,
} from './models';
import type {
  OrganizationAdministratorAssignment,
  OrganizationRegistration,
  OrganizationRegistrationInput,
  OrganizationValidationDecision,
  OrganizationValidationStatus,
  PersonalDataAccessGrant,
  PersonalDataAttribute,
  PersonalProfile,
  PersonIdentityRegistrationInput,
  PersonIdentityUpdate,
  ProcessingPurposeRecord,
  PublicPersonRegistrationStatus,
} from './registrationModels';

export type RegistrationFailure =
  | 'INVALID_ID'
  | 'INVALID_PUBLIC_CODE'
  | 'INVALID_FULL_NAME'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_NATIONAL_TAX_IDENTIFIER'
  | 'INVALID_TIMESTAMP'
  | 'DUPLICATE_ID'
  | 'DUPLICATE_PUBLIC_CODE'
  | 'DUPLICATE_NATIONAL_TAX_IDENTIFIER'
  | 'IDENTITY_NOT_FOUND'
  | 'PROFILE_IDENTITY_MISMATCH'
  | 'PROFILE_ALREADY_ACTIVE'
  | 'ACTIVE_PERSONAL_PROFILE_EXISTS'
  | 'IDENTITY_NOT_ACTIVE'
  | 'INVALID_REGISTRATION_TRANSITION'
  | 'INVALID_VALIDATION_TRANSITION'
  | 'ORGANIZATION_NOT_UNDER_REVIEW'
  | 'VALIDATION_DECISION_REQUIRED'
  | 'RESPONSIBLE_CANNOT_VALIDATE'
  | 'RESPONSIBLE_PERSON_NOT_FOUND'
  | 'REQUESTING_PERSON_NOT_FOUND'
  | 'RESPONSIBLE_PERSON_NOT_ACTIVE'
  | 'VALIDATOR_NOT_FOUND'
  | 'VALIDATOR_NOT_ACTIVE'
  | 'ORGANIZATION_NOT_VERIFIED'
  | 'ORGANIZATION_NOT_ACTIVE'
  | 'ORGANIZATION_MISMATCH'
  | 'ACTOR_NOT_ACTIVE'
  | 'INVALID_ORGANIZATION'
  | 'ADMINISTRATOR_NOT_AUTHORIZED'
  | 'GRANT_NOT_FOUND'
  | 'PURPOSE_MISMATCH'
  | 'PROCESSING_PURPOSE_NOT_RECORDED'
  | 'CONSENT_NOT_GRANTED'
  | 'ATTRIBUTE_OUTSIDE_GRANT'
  | 'GRANT_EXPIRED';

export type RegistrationResult<T> =
  Readonly<{ success: true; value: T }> | Readonly<{ success: false; reason: RegistrationFailure }>;

function failure<T>(reason: RegistrationFailure): RegistrationResult<T> {
  return { success: false, reason };
}

function toUtcTimestamp(instant: Date): string | null {
  const timestamp = instant.getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function isUtcTimestamp(value: string): boolean {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

function isNotBefore(value: string, previousValue: string): boolean {
  const timestamp = Date.parse(value);
  const previousTimestamp = Date.parse(previousValue);
  return isUtcTimestamp(value) && isUtcTimestamp(previousValue) && timestamp >= previousTimestamp;
}

function normalizePublicCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeTaxIdentifier(identifier: NationalTaxIdentifier): NationalTaxIdentifier | null {
  const countryCode = identifier.countryCode.trim().toUpperCase();
  const value = identifier.value.trim().toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-Z]{2}$/.test(countryCode) || !/^[A-Z0-9]{3,32}$/.test(value)) {
    return null;
  }
  return Object.freeze({ countryCode, value });
}

function validPublicCode(value: string): value is VinkarPublicCode {
  return /^VK-[A-Z0-9][A-Z0-9-]{2,36}$/.test(value);
}

function normalizeAndValidatePerson(input: {
  id: PersonIdentityId;
  publicRegistrationCode: string;
  fullName: string;
  nationalTaxIdentifier?: NationalTaxIdentifier;
  contacts: Readonly<{ email: string; phone?: string }>;
}):
  | Readonly<{
      id: PersonIdentityId;
      publicRegistrationCode: VinkarPublicCode;
      fullName: string;
      nationalTaxIdentifier?: NationalTaxIdentifier;
      contacts: Readonly<{ email: string; phone?: string }>;
    }>
  | RegistrationFailure {
  if (!/^person-demo-[a-zA-Z0-9-]+$/.test(input.id)) {
    return 'INVALID_ID';
  }
  const publicRegistrationCode = normalizePublicCode(input.publicRegistrationCode);
  if (!validPublicCode(publicRegistrationCode)) {
    return 'INVALID_PUBLIC_CODE';
  }
  const fullName = input.fullName.trim().replace(/\s+/g, ' ');
  if (fullName.length < 3 || fullName.length > 120) {
    return 'INVALID_FULL_NAME';
  }
  const email = input.contacts.email.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'INVALID_EMAIL';
  }
  const phone = input.contacts.phone?.trim();
  if (phone !== undefined && phone !== '' && !/^\+?[0-9 ()-]{7,24}$/.test(phone)) {
    return 'INVALID_PHONE';
  }
  const nationalTaxIdentifier = input.nationalTaxIdentifier
    ? normalizeTaxIdentifier(input.nationalTaxIdentifier)
    : undefined;
  if (input.nationalTaxIdentifier && !nationalTaxIdentifier) {
    return 'INVALID_NATIONAL_TAX_IDENTIFIER';
  }
  return Object.freeze({
    id: input.id,
    publicRegistrationCode: publicRegistrationCode as VinkarPublicCode,
    fullName,
    ...(nationalTaxIdentifier ? { nationalTaxIdentifier } : {}),
    contacts: Object.freeze({
      email,
      ...(phone ? { phone } : {}),
    }),
  });
}

export function createPersonIdentity(
  input: PersonIdentityRegistrationInput,
): RegistrationResult<PersonIdentity> {
  const createdAtUtc = toUtcTimestamp(input.createdAt);
  if (!createdAtUtc) {
    return failure('INVALID_TIMESTAMP');
  }
  const normalized = normalizeAndValidatePerson(input);
  if (typeof normalized === 'string') {
    return failure(normalized);
  }
  return {
    success: true,
    value: Object.freeze({
      ...normalized,
      registrationStatus: 'DRAFT',
      createdAtUtc,
      updatedAtUtc: createdAtUtc,
    }),
  };
}

export function updatePersonIdentity(
  identity: PersonIdentity,
  changes: PersonIdentityUpdate,
  updatedAt: Date,
): RegistrationResult<PersonIdentity> {
  const updatedAtUtc = toUtcTimestamp(updatedAt);
  if (!updatedAtUtc || !isNotBefore(updatedAtUtc, identity.createdAtUtc)) {
    return failure('INVALID_TIMESTAMP');
  }
  const normalized = normalizeAndValidatePerson({
    id: identity.id,
    publicRegistrationCode: changes.publicRegistrationCode ?? identity.publicRegistrationCode,
    fullName: changes.fullName ?? identity.fullName,
    nationalTaxIdentifier: Object.prototype.hasOwnProperty.call(changes, 'nationalTaxIdentifier')
      ? changes.nationalTaxIdentifier
      : identity.nationalTaxIdentifier,
    contacts: changes.contacts ?? identity.contacts,
  });
  if (typeof normalized === 'string') {
    return failure(normalized);
  }
  return {
    success: true,
    value: Object.freeze({
      ...normalized,
      registrationStatus: identity.registrationStatus,
      createdAtUtc: identity.createdAtUtc,
      updatedAtUtc,
    }),
  };
}

export interface PersonIdentityRepository {
  findById(id: PersonIdentityId): PersonIdentity | undefined;
  create(input: PersonIdentityRegistrationInput): RegistrationResult<PersonIdentity>;
  update(
    id: PersonIdentityId,
    changes: PersonIdentityUpdate,
    updatedAt: Date,
  ): RegistrationResult<PersonIdentity>;
}

export class InMemoryPersonIdentityRepository implements PersonIdentityRepository {
  private readonly identities = new Map<PersonIdentityId, PersonIdentity>();

  findById(id: PersonIdentityId): PersonIdentity | undefined {
    return this.identities.get(id);
  }

  create(input: PersonIdentityRegistrationInput): RegistrationResult<PersonIdentity> {
    const result = createPersonIdentity(input);
    if (!result.success) {
      return result;
    }
    const duplicate = this.findDuplicate(result.value);
    if (duplicate) {
      return failure(duplicate);
    }
    this.identities.set(result.value.id, result.value);
    return result;
  }

  update(
    id: PersonIdentityId,
    changes: PersonIdentityUpdate,
    updatedAt: Date,
  ): RegistrationResult<PersonIdentity> {
    const current = this.identities.get(id);
    if (!current) {
      return failure('IDENTITY_NOT_FOUND');
    }
    const result = updatePersonIdentity(current, changes, updatedAt);
    if (!result.success) {
      return result;
    }
    const duplicate = this.findDuplicate(result.value, id);
    if (duplicate) {
      return failure(duplicate);
    }
    this.identities.set(id, result.value);
    return result;
  }

  private findDuplicate(
    candidate: PersonIdentity,
    excludingId?: PersonIdentityId,
  ): RegistrationFailure | null {
    for (const existing of this.identities.values()) {
      if (existing.id === excludingId) {
        continue;
      }
      if (existing.id === candidate.id) {
        return 'DUPLICATE_ID';
      }
      if (
        existing.publicRegistrationCode.toUpperCase() ===
        candidate.publicRegistrationCode.toUpperCase()
      ) {
        return 'DUPLICATE_PUBLIC_CODE';
      }
      if (
        existing.nationalTaxIdentifier &&
        candidate.nationalTaxIdentifier &&
        taxIdentifierKey(existing.nationalTaxIdentifier) ===
          taxIdentifierKey(candidate.nationalTaxIdentifier)
      ) {
        return 'DUPLICATE_NATIONAL_TAX_IDENTIFIER';
      }
    }
    return null;
  }
}

function taxIdentifierKey(identifier: NationalTaxIdentifier): string {
  return `${identifier.countryCode.toUpperCase()}:${identifier.value
    .toUpperCase()
    .replace(/[\s-]/g, '')}`;
}

export function transitionPersonRegistration(
  identity: PersonIdentity,
  target: RegistrationStatus,
  changedAt: Date,
): RegistrationResult<PersonIdentity> {
  const allowed: Readonly<Record<RegistrationStatus, readonly RegistrationStatus[]>> = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['ACTIVE', 'REJECTED'],
    UNDER_REVIEW: [],
    ACTIVE: ['BLOCKED'],
    BLOCKED: ['ACTIVE'],
    REJECTED: [],
  };
  if (!allowed[identity.registrationStatus].includes(target)) {
    return failure('INVALID_REGISTRATION_TRANSITION');
  }
  const updatedAtUtc = toUtcTimestamp(changedAt);
  if (!updatedAtUtc || !isNotBefore(updatedAtUtc, identity.updatedAtUtc)) {
    return failure('INVALID_TIMESTAMP');
  }
  return {
    success: true,
    value: Object.freeze({ ...identity, registrationStatus: target, updatedAtUtc }),
  };
}

export function activatePersonalProfile(
  profile: PersonalProfile,
  identity: PersonIdentity,
  existingProfiles: readonly PersonalProfile[],
): RegistrationResult<PersonalProfile> {
  if (profile.status === 'ACTIVE') {
    return failure('PROFILE_ALREADY_ACTIVE');
  }
  if (identity.id !== profile.personIdentityId) {
    return failure('PROFILE_IDENTITY_MISMATCH');
  }
  if (identity.registrationStatus !== 'ACTIVE') {
    return failure('IDENTITY_NOT_ACTIVE');
  }
  const activeProfile = existingProfiles.find(
    (existing) =>
      existing.personIdentityId === profile.personIdentityId &&
      existing.status === 'ACTIVE' &&
      existing.id !== profile.id,
  );
  if (activeProfile) {
    return failure('ACTIVE_PERSONAL_PROFILE_EXISTS');
  }
  if (existingProfiles.some((existing) => existing.id === profile.id)) {
    return failure('PROFILE_ALREADY_ACTIVE');
  }
  return { success: true, value: Object.freeze({ ...profile, status: 'ACTIVE' }) };
}

export function createOrganizationRegistration(
  input: OrganizationRegistrationInput,
  people: readonly PersonIdentity[],
): RegistrationResult<OrganizationRegistration> {
  const timestamp = toUtcTimestamp(input.createdAt);
  if (!timestamp) {
    return failure('INVALID_TIMESTAMP');
  }
  if (!/^organization-registration-demo-[a-zA-Z0-9-]+$/.test(input.id)) {
    return failure('INVALID_ID');
  }
  const responsible = people.find((person) => person.id === input.responsiblePersonIdentityId);
  if (!responsible) {
    return failure('RESPONSIBLE_PERSON_NOT_FOUND');
  }
  if (!people.some((person) => person.id === input.requestedByPersonIdentityId)) {
    return failure('REQUESTING_PERSON_NOT_FOUND');
  }
  const name = input.organization.displayName.trim().replace(/\s+/g, ' ');
  const publicRegistrationCode = input.organization.publicRegistrationCode
    ? (normalizePublicCode(input.organization.publicRegistrationCode) as VinkarPublicCode)
    : undefined;
  const nationalTaxIdentifier = input.organization.nationalTaxIdentifier
    ? normalizeTaxIdentifier(input.organization.nationalTaxIdentifier)
    : undefined;
  const contactEmail = input.organization.contacts.email?.trim().toLowerCase();
  const contactPhone = input.organization.contacts.phone?.trim();
  if (
    !/^organization-demo-[a-zA-Z0-9-]+$/.test(input.organization.id) ||
    name.length < 2 ||
    name.length > 160 ||
    (input.organization.publicRegistrationCode && !validPublicCode(publicRegistrationCode ?? '')) ||
    (input.organization.nationalTaxIdentifier && !nationalTaxIdentifier) ||
    (contactEmail !== undefined &&
      (contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))) ||
    (contactPhone !== undefined &&
      contactPhone !== '' &&
      !/^\+?[0-9 ()-]{7,24}$/.test(contactPhone))
  ) {
    return failure('INVALID_ORGANIZATION');
  }
  const organization = Object.freeze({
    id: input.organization.id,
    displayName: name,
    contacts: Object.freeze({
      ...(contactEmail ? { email: contactEmail } : {}),
      ...(contactPhone ? { phone: contactPhone } : {}),
    }),
    ...(publicRegistrationCode ? { publicRegistrationCode } : {}),
    ...(nationalTaxIdentifier ? { nationalTaxIdentifier } : {}),
  });
  const administrator: OrganizationAdministratorAssignment = Object.freeze({
    personIdentityId: responsible.id,
    organizationId: organization.id,
    role: 'ADMINISTRATOR',
    status: 'PENDING',
  });
  return {
    success: true,
    value: Object.freeze({
      id: input.id,
      organization,
      requestedByPersonIdentityId: input.requestedByPersonIdentityId,
      responsiblePersonIdentityId: responsible.id,
      registrationStatus: 'DRAFT',
      validationStatus: 'NOT_STARTED',
      administrators: Object.freeze([administrator]),
      createdAtUtc: timestamp,
      updatedAtUtc: timestamp,
    }),
  };
}

export function transitionOrganizationValidation(
  registration: OrganizationRegistration,
  target: OrganizationValidationStatus,
  changedAt: Date,
  decision?: OrganizationValidationDecision,
  people: readonly PersonIdentity[] = [],
): RegistrationResult<OrganizationRegistration> {
  if (registration.registrationStatus !== 'UNDER_REVIEW') {
    return failure('ORGANIZATION_NOT_UNDER_REVIEW');
  }
  const allowed: Readonly<
    Record<OrganizationValidationStatus, readonly OrganizationValidationStatus[]>
  > = {
    NOT_STARTED: ['IN_REVIEW'],
    IN_REVIEW: ['VERIFIED', 'REJECTED'],
    VERIFIED: [],
    REJECTED: [],
  };
  if (!allowed[registration.validationStatus].includes(target)) {
    return failure('INVALID_VALIDATION_TRANSITION');
  }
  if (target === 'VERIFIED' || target === 'REJECTED') {
    if (!decision || !decision.evidenceReference.trim()) {
      return failure('VALIDATION_DECISION_REQUIRED');
    }
    if (decision.decidedByPersonIdentityId === registration.responsiblePersonIdentityId) {
      return failure('RESPONSIBLE_CANNOT_VALIDATE');
    }
    const validator = people.find((person) => person.id === decision.decidedByPersonIdentityId);
    if (!validator) {
      return failure('VALIDATOR_NOT_FOUND');
    }
    if (validator.registrationStatus !== 'ACTIVE') {
      return failure('VALIDATOR_NOT_ACTIVE');
    }
    if (target === 'REJECTED' && !decision.reason?.trim()) {
      return failure('VALIDATION_DECISION_REQUIRED');
    }
  }
  const updatedAtUtc = toUtcTimestamp(changedAt);
  if (!updatedAtUtc || !isNotBefore(updatedAtUtc, registration.updatedAtUtc)) {
    return failure('INVALID_TIMESTAMP');
  }
  return {
    success: true,
    value: Object.freeze({
      ...registration,
      validationStatus: target,
      updatedAtUtc,
      ...(decision ? { validationDecision: Object.freeze({ ...decision }) } : {}),
    }),
  };
}

export function transitionOrganizationRegistration(
  registration: OrganizationRegistration,
  target: RegistrationStatus,
  responsible: PersonIdentity,
  changedAt: Date,
): RegistrationResult<OrganizationRegistration> {
  const allowed: Readonly<Record<RegistrationStatus, readonly RegistrationStatus[]>> = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['ACTIVE', 'REJECTED'],
    ACTIVE: ['BLOCKED'],
    BLOCKED: ['ACTIVE'],
    REJECTED: [],
  };
  if (!allowed[registration.registrationStatus].includes(target)) {
    return failure('INVALID_REGISTRATION_TRANSITION');
  }
  if (responsible.id !== registration.responsiblePersonIdentityId) {
    return failure('RESPONSIBLE_PERSON_NOT_FOUND');
  }
  if (target === 'ACTIVE') {
    if (registration.validationStatus !== 'VERIFIED') {
      return failure('ORGANIZATION_NOT_VERIFIED');
    }
    if (responsible.registrationStatus !== 'ACTIVE') {
      return failure('RESPONSIBLE_PERSON_NOT_ACTIVE');
    }
  }
  const updatedAtUtc = toUtcTimestamp(changedAt);
  if (!updatedAtUtc || !isNotBefore(updatedAtUtc, registration.updatedAtUtc)) {
    return failure('INVALID_TIMESTAMP');
  }
  const administratorStatus =
    target === 'ACTIVE' ? 'ACTIVE' : target === 'BLOCKED' ? 'SUSPENDED' : undefined;
  return {
    success: true,
    value: Object.freeze({
      ...registration,
      registrationStatus: target,
      updatedAtUtc,
      ...(administratorStatus
        ? {
            administrators: Object.freeze(
              registration.administrators.map((administrator) =>
                Object.freeze({ ...administrator, status: administratorStatus }),
              ),
            ),
          }
        : {}),
    }),
  };
}

export function authorizeOrganizationPersonalDataAccess(input: {
  actorPersonIdentityId: PersonIdentityId;
  organizationId: OrganizationId;
  organization: OrganizationRegistration;
  subjectPersonIdentityId: PersonIdentityId;
  purposeId: string;
  requestedAttributes: readonly PersonalDataAttribute[];
  administrators: readonly OrganizationAdministratorAssignment[];
  people: readonly PersonIdentity[];
  grant: PersonalDataAccessGrant | undefined;
  at: Date;
}): RegistrationResult<Readonly<{ authorizedAttributes: readonly PersonalDataAttribute[] }>> {
  if (input.organization.organization.id !== input.organizationId) {
    return failure('ORGANIZATION_MISMATCH');
  }
  if (input.organization.registrationStatus !== 'ACTIVE') {
    return failure('ORGANIZATION_NOT_ACTIVE');
  }
  const actor = input.people.find((person) => person.id === input.actorPersonIdentityId);
  if (!actor || actor.registrationStatus !== 'ACTIVE') {
    return failure('ACTOR_NOT_ACTIVE');
  }
  const isAdministrator = hasOrganizationAdministratorRole(
    input.administrators,
    input.actorPersonIdentityId,
    input.organizationId,
    input.people,
  );
  if (!isAdministrator) {
    return failure('ADMINISTRATOR_NOT_AUTHORIZED');
  }
  const grant = input.grant;
  if (
    !grant ||
    grant.personIdentityId !== input.subjectPersonIdentityId ||
    grant.organizationId !== input.organizationId
  ) {
    return failure('GRANT_NOT_FOUND');
  }
  if (grant.processingPurpose.purposeId !== input.purposeId) {
    return failure('PURPOSE_MISMATCH');
  }
  if (
    !isPurposeRecordComplete(grant.processingPurpose) ||
    grant.processingPurpose.personIdentityId !== input.subjectPersonIdentityId
  ) {
    return failure('PROCESSING_PURPOSE_NOT_RECORDED');
  }
  if (
    grant.processingPurpose.legalBasis === 'CONSENT' &&
    grant.processingPurpose.consentChoice !== 'GRANTED'
  ) {
    return failure('CONSENT_NOT_GRANTED');
  }
  const now = input.at.getTime();
  const expiresAt = Date.parse(grant.expiresAtUtc);
  if (
    !Number.isFinite(now) ||
    !isUtcTimestamp(grant.expiresAtUtc) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= now
  ) {
    return failure('GRANT_EXPIRED');
  }
  if (input.requestedAttributes.some((attribute) => !grant.allowedAttributes.includes(attribute))) {
    return failure('ATTRIBUTE_OUTSIDE_GRANT');
  }
  return {
    success: true,
    value: Object.freeze({
      authorizedAttributes: Object.freeze([...input.requestedAttributes]),
    }),
  };
}

export function toPublicPersonRegistrationStatus(
  identity: PersonIdentity,
): PublicPersonRegistrationStatus {
  return Object.freeze({
    registrationStatus: identity.registrationStatus,
  });
}

export function hasOrganizationAdministratorRole(
  assignments: readonly OrganizationAdministratorAssignment[],
  personIdentityId: PersonIdentityId,
  organizationId: OrganizationId,
  people: readonly PersonIdentity[],
): boolean {
  const person = people.find((candidate) => candidate.id === personIdentityId);
  if (!person || person.registrationStatus !== 'ACTIVE') {
    return false;
  }
  return assignments.some(
    (assignment) =>
      assignment.personIdentityId === personIdentityId &&
      assignment.organizationId === organizationId &&
      assignment.role === 'ADMINISTRATOR' &&
      assignment.status === 'ACTIVE',
  );
}

export function isPurposeRecordComplete(record: ProcessingPurposeRecord): boolean {
  return Boolean(
    record.personIdentityId &&
    record.purposeId.trim() &&
    record.description.trim() &&
    record.policyVersion.trim() &&
    isUtcTimestamp(record.recordedAtUtc),
  );
}

export type { PersonalDataAttribute };
