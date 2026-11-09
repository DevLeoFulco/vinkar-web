import { createContext } from 'react';
import type { MainCompanyMembershipRequest, OrganizationId } from './domain/models';
import type { DemoScenario } from './mocks/demoScenarios';
import type { CreateMembershipRequestResult } from './domain/membershipRequests';

export type RequestSubmission = Readonly<{
  scenario: DemoScenario;
  organizationId: OrganizationId;
  requestedAt: Date;
}>;

export type DemoMembershipRequestContextValue = Readonly<{
  pendingRequests: readonly MainCompanyMembershipRequest[];
  submitRequest: (submission: RequestSubmission) => CreateMembershipRequestResult;
}>;

export const DemoMembershipRequestContext = createContext<DemoMembershipRequestContextValue | null>(
  null,
);
