import { createContext } from 'react';
import type {
  DemoMembershipState,
  MainCompanyMembership,
  MainCompanyMembershipRequest,
  MembershipApplicantProfile,
  MembershipRequestId,
  OrganizationId,
} from './domain/models';
import type { DemoScenario } from './mocks/demoScenarios';
import type { MembershipOperationResult } from './domain/membershipRequests';

export type RequestSubmission = Readonly<{
  scenario: DemoScenario;
  organizationId: OrganizationId;
  requestedAt: Date;
}>;

export type RequestDecision = Readonly<{
  scenario: DemoScenario;
  requestId: MembershipRequestId;
  decidedAt: Date;
  reason?: string;
}>;

export type RequestResubmission = Readonly<{
  scenario: DemoScenario;
  requestId: MembershipRequestId;
  applicantProfile: MembershipApplicantProfile & {
    personIdentityId: MainCompanyMembershipRequest['personIdentityId'];
  };
  resubmittedAt: Date;
}>;

export type DemoMembershipRequestContextValue = Readonly<{
  state: DemoMembershipState;
  submitRequest: (
    submission: RequestSubmission,
  ) => MembershipOperationResult<MainCompanyMembershipRequest>;
  approveRequest: (decision: RequestDecision) => MembershipOperationResult<MainCompanyMembership>;
  rejectRequest: (
    decision: RequestDecision,
  ) => MembershipOperationResult<MainCompanyMembershipRequest>;
  returnRequest: (
    decision: RequestDecision & { reason: string },
  ) => MembershipOperationResult<MainCompanyMembershipRequest>;
  resubmitRequest: (
    resubmission: RequestResubmission,
  ) => MembershipOperationResult<MainCompanyMembershipRequest>;
}>;

export const DemoMembershipRequestContext = createContext<DemoMembershipRequestContextValue | null>(
  null,
);
