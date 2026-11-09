import type {
  DemoMembershipState,
  MainCompanyMembershipRequest,
  MembershipRequestId,
  OrganizationId,
  PersonIdentityId,
} from './domain/models';

export function getMembershipRequestsForConsumer(
  state: DemoMembershipState,
  personIdentityId: PersonIdentityId,
): readonly MainCompanyMembershipRequest[] {
  return state.requests.filter((request) => request.personIdentityId === personIdentityId);
}

export function getMembershipRequestsForOrganization(
  state: DemoMembershipState,
  organizationId: OrganizationId,
): readonly MainCompanyMembershipRequest[] {
  return state.requests.filter((request) => request.organizationId === organizationId);
}

export function getOpenMembershipRequestForOrganization(
  state: DemoMembershipState,
  personIdentityId: PersonIdentityId,
  organizationId: OrganizationId,
): MainCompanyMembershipRequest | undefined {
  return state.requests.find(
    (request) =>
      request.personIdentityId === personIdentityId &&
      request.organizationId === organizationId &&
      (request.status === 'PENDING' || request.status === 'RETURNED'),
  );
}

export function getMainCompanyMembership(
  state: DemoMembershipState,
  requestId: MembershipRequestId,
) {
  return state.memberships.find((membership) => membership.approvedRequestId === requestId);
}
