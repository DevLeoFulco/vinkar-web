import { useContext } from 'react';
import { DemoMembershipRequestContext } from './DemoMembershipRequestState';

export function useDemoMembershipRequests() {
  const context = useContext(DemoMembershipRequestContext);
  if (!context) {
    throw new Error(
      'useDemoMembershipRequests deve ser usado dentro de DemoMembershipRequestProvider.',
    );
  }

  return context;
}
