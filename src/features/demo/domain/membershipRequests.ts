import type {
  DemoSession,
  MainCompanyMembershipRequest,
  Organization,
  OrganizationId,
} from './models';

export type CreateMembershipRequestResult =
  | Readonly<{ success: true; request: MainCompanyMembershipRequest }>
  | Readonly<{
      success: false;
      reason:
        'NOT_CONSUMER' | 'ORGANIZATION_NOT_FOUND' | 'PENDING_REQUEST_EXISTS' | 'ALREADY_AFFILIATED';
    }>;

export function createMainCompanyMembershipRequest(input: {
  session: DemoSession;
  organizationId: OrganizationId;
  organizations: readonly Organization[];
  pendingRequests: readonly MainCompanyMembershipRequest[];
  requestedAt: Date;
}): CreateMembershipRequestResult {
  const { session, organizationId, organizations, pendingRequests, requestedAt } = input;

  if (session.activePersonalProfile !== 'CONSUMER') {
    return { success: false, reason: 'NOT_CONSUMER' };
  }

  const organization = organizations.find(({ id }) => id === organizationId);
  if (!organization) {
    return { success: false, reason: 'ORGANIZATION_NOT_FOUND' };
  }

  if (
    session.organizationAffiliations.some(
      ({ organizationId: affiliatedOrganizationId }) => affiliatedOrganizationId === organizationId,
    )
  ) {
    return { success: false, reason: 'ALREADY_AFFILIATED' };
  }

  if (
    pendingRequests.some(
      (request) =>
        request.personIdentityId === session.personIdentity.id && request.status === 'PENDING',
    )
  ) {
    return { success: false, reason: 'PENDING_REQUEST_EXISTS' };
  }

  const requestedAtTimestamp = requestedAt.getTime();
  if (!Number.isFinite(requestedAtTimestamp)) {
    throw new RangeError('requestedAt deve ser um instante válido.');
  }

  const request: MainCompanyMembershipRequest = Object.freeze({
    id: `membership-request-demo-${session.personIdentity.id}-${organization.id}`,
    personIdentityId: session.personIdentity.id,
    organizationId: organization.id,
    status: 'PENDING',
    createdAtUtc: new Date(requestedAtTimestamp).toISOString(),
  });

  return { success: true, request };
}
