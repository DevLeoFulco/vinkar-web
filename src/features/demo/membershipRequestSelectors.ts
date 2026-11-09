import type { MainCompanyMembershipRequest, PersonIdentityId } from './domain/models';

export function getPendingMainCompanyRequest(
  requests: readonly MainCompanyMembershipRequest[],
  personIdentityId: PersonIdentityId,
): MainCompanyMembershipRequest | undefined {
  return requests.find(
    (request) => request.personIdentityId === personIdentityId && request.status === 'PENDING',
  );
}
