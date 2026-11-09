import { getConsumerPlanPolicy } from './policies';
import type {
  DemoMembershipState,
  DemoSession,
  MainCompanyMembership,
  MainCompanyMembershipRequest,
  MembershipApplicantProfile,
  MembershipCommandId,
  MembershipRequestId,
  MembershipRequestReview,
  MembershipRequestReviewAction,
  Organization,
  OrganizationId,
  PersonIdentityId,
  SubscriptionPlan,
} from './models';

export type MembershipOperationFailureReason =
  | 'NOT_CONSUMER'
  | 'ORGANIZATION_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_IDENTITY_MISMATCH'
  | 'INVALID_PROFILE'
  | 'OPEN_REQUEST_EXISTS'
  | 'ALREADY_AFFILIATED'
  | 'CAPACITY_REACHED'
  | 'REQUEST_NOT_FOUND'
  | 'REQUEST_NOT_PENDING'
  | 'REQUEST_NOT_RETURNED'
  | 'UNAUTHORIZED_ORGANIZATION'
  | 'ORGANIZATION_MISMATCH'
  | 'RETURN_REASON_REQUIRED'
  | 'RETURN_REASON_TOO_SHORT'
  | 'RETURN_REASON_TOO_LONG'
  | 'COMMAND_ID_CONFLICT';

export type MembershipOperationResult<T> =
  | Readonly<{ success: true; state: DemoMembershipState; value: T }>
  | Readonly<{
      success: false;
      state: DemoMembershipState;
      reason: MembershipOperationFailureReason;
    }>;

export type MembershipCapacity = Readonly<{
  used: number;
  limit: number;
  available: number;
}>;

const initialState: DemoMembershipState = Object.freeze({
  requests: Object.freeze([]),
  memberships: Object.freeze([]),
  reviews: Object.freeze([]),
  processedCommands: Object.freeze([]),
});

export function createEmptyDemoMembershipState(): DemoMembershipState {
  return initialState;
}

function getUtcTimestamp(instant: Date, parameterName: string): string {
  const timestamp = instant.getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError(`${parameterName} deve ser um instante válido.`);
  }
  return new Date(timestamp).toISOString();
}

function failure<T>(
  state: DemoMembershipState,
  reason: MembershipOperationFailureReason,
): MembershipOperationResult<T> {
  return { success: false, state, reason };
}

function createReview(input: {
  commandId: MembershipCommandId;
  requestId: MembershipRequestId;
  action: MembershipRequestReviewAction;
  actorPersonIdentityId: PersonIdentityId;
  organizationId?: OrganizationId;
  createdAtUtc: string;
  reason?: string;
}): MembershipRequestReview {
  return Object.freeze({
    id: `membership-review-demo-${input.commandId.slice('membership-command-demo-'.length)}`,
    ...input,
  });
}

function findProcessedCommand(
  state: DemoMembershipState,
  commandId: MembershipCommandId,
  action: MembershipRequestReviewAction | 'CREATED',
  targetId: string,
  fingerprint: string,
): MembershipOperationFailureReason | MainCompanyMembershipRequest | undefined {
  const processed = state.processedCommands.find((command) => command.id === commandId);
  if (!processed) {
    return undefined;
  }
  if (
    processed.action !== action ||
    processed.targetId !== targetId ||
    processed.fingerprint !== fingerprint
  ) {
    return 'COMMAND_ID_CONFLICT';
  }
  return (
    state.requests.find((request) => request.id === processed.requestId) ?? 'REQUEST_NOT_FOUND'
  );
}

function addProcessedCommand(
  state: DemoMembershipState,
  commandId: MembershipCommandId,
  action: MembershipRequestReviewAction | 'CREATED',
  requestId: MembershipRequestId,
  targetId: string,
  fingerprint: string,
): DemoMembershipState['processedCommands'] {
  return Object.freeze([
    ...state.processedCommands,
    Object.freeze({ id: commandId, action, requestId, targetId, fingerprint }),
  ]);
}

function getRequestId(commandId: MembershipCommandId): MembershipRequestId {
  return `membership-request-demo-${commandId.slice('membership-command-demo-'.length)}`;
}

function getMembershipId(requestId: MembershipRequestId): MainCompanyMembership['id'] {
  return `main-company-membership-demo-${requestId.slice('membership-request-demo-'.length)}`;
}

function isConsumer(session: DemoSession): session is DemoSession & {
  activePersonalProfile: 'CONSUMER';
  subscriptionPlan: SubscriptionPlan;
} {
  return session.activePersonalProfile === 'CONSUMER' && session.subscriptionPlan !== null;
}

function isAuthorizedForOrganization(
  session: DemoSession,
  organizationId: OrganizationId,
): boolean {
  return session.organizationAdministrations.some(
    (administration) =>
      administration.organizationId === organizationId && administration.role === 'ADMINISTRATOR',
  );
}

function getOpenRequestCount(
  state: DemoMembershipState,
  personIdentityId: PersonIdentityId,
  excludingRequestId?: MembershipRequestId,
): number {
  return state.requests.filter(
    (request) =>
      request.personIdentityId === personIdentityId &&
      request.id !== excludingRequestId &&
      (request.status === 'PENDING' || request.status === 'RETURNED'),
  ).length;
}

export function getMembershipCapacity(
  state: DemoMembershipState,
  personIdentityId: PersonIdentityId,
  plan: SubscriptionPlan,
): MembershipCapacity {
  const activeMembershipCount = state.memberships.filter(
    (membership) =>
      membership.personIdentityId === personIdentityId && membership.status === 'ACTIVE',
  ).length;
  const used = activeMembershipCount + getOpenRequestCount(state, personIdentityId);
  const limit = getConsumerPlanPolicy(plan).mainCompanyCapacity;
  return Object.freeze({ used, limit, available: Math.max(0, limit - used) });
}

export function normalizeApplicantProfile(
  profile: MembershipApplicantProfile,
): MembershipApplicantProfile {
  return Object.freeze({
    ...profile,
    publicRegistrationCode: profile.publicRegistrationCode.trim(),
    fullName: profile.fullName.trim().replace(/\s+/g, ' '),
    email: profile.email.trim().toLowerCase(),
    phone: profile.phone.replace(/\D/g, ''),
    city: profile.city.trim().replace(/\s+/g, ' '),
    state: profile.state.trim().toUpperCase(),
  });
}

export function validateApplicantProfile(
  profile: MembershipApplicantProfile,
): MembershipOperationFailureReason | null {
  const normalized = normalizeApplicantProfile(profile);
  if (
    normalized.publicRegistrationCode.length === 0 ||
    normalized.fullName.length < 3 ||
    normalized.fullName.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) ||
    normalized.email.length > 254 ||
    !/^\d{10,11}$/.test(normalized.phone) ||
    normalized.city.length < 2 ||
    normalized.city.length > 100 ||
    !/^[A-Z]{2}$/.test(normalized.state)
  ) {
    return 'INVALID_PROFILE';
  }
  return null;
}

function replaceRequest(
  state: DemoMembershipState,
  updatedRequest: MainCompanyMembershipRequest,
): DemoMembershipState['requests'] {
  return Object.freeze(
    state.requests.map((request) => (request.id === updatedRequest.id ? updatedRequest : request)),
  );
}

function getCurrentCommandResult(
  state: DemoMembershipState,
  commandId: MembershipCommandId,
  action: MembershipRequestReviewAction | 'CREATED',
  targetId: string,
  fingerprint: string,
): MembershipOperationResult<MainCompanyMembershipRequest> | undefined {
  const existing = findProcessedCommand(state, commandId, action, targetId, fingerprint);
  if (existing === undefined) {
    return undefined;
  }
  if (typeof existing === 'string') {
    return failure(state, existing);
  }
  return { success: true, state, value: existing };
}

export function createMainCompanyMembershipRequest(input: {
  state: DemoMembershipState;
  session: DemoSession;
  organizationId: OrganizationId;
  organizations: readonly Organization[];
  applicantProfile: MembershipApplicantProfile & { personIdentityId: PersonIdentityId };
  commandId: MembershipCommandId;
  requestedAt: Date;
}): MembershipOperationResult<MainCompanyMembershipRequest> {
  const {
    state,
    session,
    organizationId,
    organizations,
    applicantProfile,
    commandId,
    requestedAt,
  } = input;
  const normalizedProfile = normalizeApplicantProfile(applicantProfile);
  const fingerprint = JSON.stringify({
    organizationId,
    personIdentityId: applicantProfile.personIdentityId,
    plan: session.subscriptionPlan,
    applicantProfile: normalizedProfile,
    requestedAt: requestedAt.getTime(),
  });
  if (!isConsumer(session)) {
    return failure(state, 'NOT_CONSUMER');
  }
  if (applicantProfile.personIdentityId !== session.personIdentity.id) {
    return failure(state, 'PROFILE_IDENTITY_MISMATCH');
  }
  if (!organizations.some((organization) => organization.id === organizationId)) {
    return failure(state, 'ORGANIZATION_NOT_FOUND');
  }
  const profileError = validateApplicantProfile(applicantProfile);
  if (profileError) {
    return failure(state, profileError);
  }
  const idempotentResult = getCurrentCommandResult(
    state,
    commandId,
    'CREATED',
    organizationId,
    fingerprint,
  );
  if (idempotentResult) {
    return idempotentResult;
  }
  if (
    state.memberships.some(
      (membership) =>
        membership.personIdentityId === session.personIdentity.id &&
        membership.organizationId === organizationId &&
        membership.status === 'ACTIVE',
    )
  ) {
    return failure(state, 'ALREADY_AFFILIATED');
  }
  if (
    state.requests.some(
      (request) =>
        request.personIdentityId === session.personIdentity.id &&
        request.organizationId === organizationId &&
        (request.status === 'PENDING' || request.status === 'RETURNED'),
    )
  ) {
    return failure(state, 'OPEN_REQUEST_EXISTS');
  }
  const capacity = getMembershipCapacity(
    state,
    session.personIdentity.id,
    session.subscriptionPlan,
  );
  if (capacity.available === 0) {
    return failure(state, 'CAPACITY_REACHED');
  }

  const createdAtUtc = getUtcTimestamp(requestedAt, 'requestedAt');
  const request: MainCompanyMembershipRequest = Object.freeze({
    id: getRequestId(commandId),
    personIdentityId: session.personIdentity.id,
    organizationId,
    applicantProfile: normalizedProfile,
    planAtSubmission: session.subscriptionPlan,
    status: 'PENDING',
    createdAtUtc,
  });
  const review = createReview({
    commandId,
    requestId: request.id,
    action: 'SUBMITTED',
    actorPersonIdentityId: session.personIdentity.id,
    createdAtUtc,
  });
  const nextState: DemoMembershipState = Object.freeze({
    ...state,
    requests: Object.freeze([...state.requests, request]),
    reviews: Object.freeze([...state.reviews, review]),
    processedCommands: addProcessedCommand(
      state,
      commandId,
      'CREATED',
      request.id,
      organizationId,
      fingerprint,
    ),
  });
  return { success: true, state: nextState, value: request };
}

type BusinessDecisionInput = Readonly<{
  state: DemoMembershipState;
  session: DemoSession;
  organizationId: OrganizationId;
  requestId: MembershipRequestId;
  commandId: MembershipCommandId;
  decidedAt: Date;
}>;

function getDecisionRequest(
  input: BusinessDecisionInput,
  action: 'APPROVED' | 'REJECTED' | 'RETURNED',
  fingerprint: string,
): MembershipOperationResult<MainCompanyMembershipRequest> | MainCompanyMembershipRequest {
  const { state, session, organizationId, requestId, commandId } = input;
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) {
    return failure(state, 'REQUEST_NOT_FOUND');
  }
  if (request.organizationId !== organizationId) {
    return failure(state, 'ORGANIZATION_MISMATCH');
  }
  if (!isAuthorizedForOrganization(session, organizationId)) {
    return failure(state, 'UNAUTHORIZED_ORGANIZATION');
  }
  const idempotentResult = getCurrentCommandResult(
    state,
    commandId,
    action,
    requestId,
    fingerprint,
  );
  if (idempotentResult) {
    return idempotentResult;
  }
  if (request.status !== 'PENDING') {
    return failure(state, 'REQUEST_NOT_PENDING');
  }
  return request;
}

export function approveMainCompanyMembershipRequest(
  input: BusinessDecisionInput & { plan: SubscriptionPlan },
): MembershipOperationResult<MainCompanyMembership> {
  const { state, session, organizationId, requestId, commandId, decidedAt, plan } = input;
  const fingerprint = JSON.stringify({
    requestId,
    organizationId,
    plan,
    actorPersonIdentityId: session.personIdentity.id,
    decidedAt: input.decidedAt.getTime(),
  });
  const checked = getDecisionRequest(input, 'APPROVED', fingerprint);
  if ('success' in checked) {
    if (!checked.success) {
      return checked;
    }
    const existingMembership = checked.state.memberships.find(
      (membership) => membership.approvedRequestId === checked.value.id,
    );
    if (!existingMembership) {
      return failure(state, 'REQUEST_NOT_FOUND');
    }
    return { success: true, state: checked.state, value: existingMembership };
  }
  const request = checked;
  if (
    state.memberships.some(
      (membership) =>
        membership.personIdentityId === request.personIdentityId &&
        membership.organizationId === request.organizationId &&
        membership.status === 'ACTIVE',
    )
  ) {
    return failure(state, 'ALREADY_AFFILIATED');
  }
  const capacity = getMembershipCapacity(state, request.personIdentityId, plan);
  if (capacity.used - 1 >= capacity.limit) {
    return failure(state, 'CAPACITY_REACHED');
  }

  const activatedAtUtc = getUtcTimestamp(decidedAt, 'decidedAt');
  const updatedRequest = Object.freeze({ ...request, status: 'APPROVED' as const });
  const membership: MainCompanyMembership = Object.freeze({
    id: getMembershipId(request.id),
    personIdentityId: request.personIdentityId,
    organizationId: request.organizationId,
    status: 'ACTIVE',
    activatedAtUtc,
    approvedRequestId: request.id,
    planAtActivation: plan,
  });
  const review = createReview({
    commandId,
    requestId: request.id,
    action: 'APPROVED',
    actorPersonIdentityId: session.personIdentity.id,
    organizationId,
    createdAtUtc: activatedAtUtc,
  });
  const nextState: DemoMembershipState = Object.freeze({
    ...state,
    requests: replaceRequest(state, updatedRequest),
    memberships: Object.freeze([...state.memberships, membership]),
    reviews: Object.freeze([...state.reviews, review]),
    processedCommands: addProcessedCommand(
      state,
      commandId,
      'APPROVED',
      request.id,
      request.id,
      fingerprint,
    ),
  });
  return { success: true, state: nextState, value: membership };
}

export function rejectMainCompanyMembershipRequest(
  input: BusinessDecisionInput & { reason?: string },
): MembershipOperationResult<MainCompanyMembershipRequest> {
  return decideWithoutMembership(input, 'REJECTED');
}

export function returnMainCompanyMembershipRequest(
  input: BusinessDecisionInput & { reason: string },
): MembershipOperationResult<MainCompanyMembershipRequest> {
  const normalizedReason = input.reason.trim().replace(/\s+/g, ' ');
  if (!normalizedReason) {
    return failure(input.state, 'RETURN_REASON_REQUIRED');
  }
  if (normalizedReason.length < 10) {
    return failure(input.state, 'RETURN_REASON_TOO_SHORT');
  }
  if (normalizedReason.length > 500) {
    return failure(input.state, 'RETURN_REASON_TOO_LONG');
  }
  return decideWithoutMembership({ ...input, reason: normalizedReason }, 'RETURNED');
}

function decideWithoutMembership(
  input: BusinessDecisionInput & { reason?: string },
  action: 'REJECTED' | 'RETURNED',
): MembershipOperationResult<MainCompanyMembershipRequest> {
  const { state, session, organizationId, commandId, decidedAt } = input;
  const reason = input.reason?.trim().replace(/\s+/g, ' ');
  const fingerprint = JSON.stringify({
    requestId: input.requestId,
    organizationId,
    actorPersonIdentityId: session.personIdentity.id,
    decidedAt: decidedAt.getTime(),
    reason,
  });
  const checked = getDecisionRequest(input, action, fingerprint);
  if ('success' in checked) {
    return checked;
  }
  const request = checked;
  const createdAtUtc = getUtcTimestamp(decidedAt, 'decidedAt');
  const updatedRequest = Object.freeze({ ...request, status: action });
  const review = createReview({
    commandId,
    requestId: request.id,
    action,
    actorPersonIdentityId: session.personIdentity.id,
    organizationId,
    createdAtUtc,
    reason,
  });
  const nextState: DemoMembershipState = Object.freeze({
    ...state,
    requests: replaceRequest(state, updatedRequest),
    reviews: Object.freeze([...state.reviews, review]),
    processedCommands: addProcessedCommand(
      state,
      commandId,
      action,
      request.id,
      request.id,
      fingerprint,
    ),
  });
  return { success: true, state: nextState, value: updatedRequest };
}

export function resubmitReturnedMainCompanyMembershipRequest(input: {
  state: DemoMembershipState;
  session: DemoSession;
  requestId: MembershipRequestId;
  applicantProfile: MembershipApplicantProfile & { personIdentityId: PersonIdentityId };
  commandId: MembershipCommandId;
  resubmittedAt: Date;
}): MembershipOperationResult<MainCompanyMembershipRequest> {
  const { state, session, requestId, applicantProfile, commandId, resubmittedAt } = input;
  const normalizedProfile = normalizeApplicantProfile(applicantProfile);
  const fingerprint = JSON.stringify({
    requestId,
    applicantProfile: normalizedProfile,
    resubmittedAt: resubmittedAt.getTime(),
  });
  if (!isConsumer(session)) {
    return failure(state, 'NOT_CONSUMER');
  }
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) {
    return failure(state, 'REQUEST_NOT_FOUND');
  }
  if (request.personIdentityId !== session.personIdentity.id) {
    return failure(state, 'PROFILE_IDENTITY_MISMATCH');
  }
  if (
    applicantProfile.personIdentityId !== request.personIdentityId ||
    applicantProfile.id !== request.applicantProfile.id ||
    applicantProfile.publicRegistrationCode !== request.applicantProfile.publicRegistrationCode
  ) {
    return failure(state, 'PROFILE_IDENTITY_MISMATCH');
  }
  const profileError = validateApplicantProfile(applicantProfile);
  if (profileError) {
    return failure(state, profileError);
  }
  const idempotentResult = getCurrentCommandResult(
    state,
    commandId,
    'RESUBMITTED',
    requestId,
    fingerprint,
  );
  if (idempotentResult) {
    return idempotentResult;
  }
  if (request.status !== 'RETURNED') {
    return failure(state, 'REQUEST_NOT_RETURNED');
  }
  const createdAtUtc = getUtcTimestamp(resubmittedAt, 'resubmittedAt');
  const updatedRequest: MainCompanyMembershipRequest = Object.freeze({
    ...request,
    applicantProfile: normalizedProfile,
    planAtSubmission: session.subscriptionPlan,
    status: 'PENDING',
  });
  const review = createReview({
    commandId,
    requestId,
    action: 'RESUBMITTED',
    actorPersonIdentityId: session.personIdentity.id,
    organizationId: request.organizationId,
    createdAtUtc,
  });
  const nextState: DemoMembershipState = Object.freeze({
    ...state,
    requests: replaceRequest(state, updatedRequest),
    reviews: Object.freeze([...state.reviews, review]),
    processedCommands: addProcessedCommand(
      state,
      commandId,
      'RESUBMITTED',
      requestId,
      requestId,
      fingerprint,
    ),
  });
  return { success: true, state: nextState, value: updatedRequest };
}

export function getLatestReturnReview(
  state: DemoMembershipState,
  requestId: MembershipRequestId,
): MembershipRequestReview | undefined {
  for (let index = state.reviews.length - 1; index >= 0; index -= 1) {
    const review = state.reviews[index];
    if (review.requestId === requestId && review.action === 'RETURNED') {
      return review;
    }
  }
  return undefined;
}
