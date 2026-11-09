import { useCallback, useRef, useState, type ReactNode } from 'react';
import { createMainCompanyMembershipRequest } from './domain/membershipRequests';
import type { MainCompanyMembershipRequest } from './domain/models';
import { demoCompanies } from './mocks/companyNetwork';
import { DemoMembershipRequestContext, type RequestSubmission } from './DemoMembershipRequestState';

export function DemoMembershipRequestProvider({ children }: { children: ReactNode }) {
  const [pendingRequests, setPendingRequests] = useState<readonly MainCompanyMembershipRequest[]>(
    [],
  );
  const requestsRef = useRef(pendingRequests);

  const submitRequest = useCallback(
    ({ scenario, organizationId, requestedAt }: RequestSubmission) => {
      const result = createMainCompanyMembershipRequest({
        session: scenario.session,
        organizationId,
        organizations: demoCompanies,
        pendingRequests: requestsRef.current,
        requestedAt,
      });

      if (result.success) {
        const nextRequests = Object.freeze([...requestsRef.current, result.request]);
        requestsRef.current = nextRequests;
        setPendingRequests(nextRequests);
      }

      return result;
    },
    [],
  );

  return (
    <DemoMembershipRequestContext.Provider value={{ pendingRequests, submitRequest }}>
      {children}
    </DemoMembershipRequestContext.Provider>
  );
}
