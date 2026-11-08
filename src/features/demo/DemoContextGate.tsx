import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { routes } from '../../shared/config/routes';
import type { DemoScenarioContext } from './mocks/demoScenarios';

type DemoEntryState = Readonly<{
  demoContext: DemoScenarioContext;
}>;

const loginRoutes: Readonly<Record<DemoScenarioContext, string>> = {
  CONSUMER: routes.demoLoginConsumer,
  BUSINESS: routes.demoLoginBusiness,
  BENEFICIARY: routes.demoLoginBeneficiary,
};

function isDemoEntryState(state: unknown, context: DemoScenarioContext): state is DemoEntryState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'demoContext' in state &&
    state.demoContext === context
  );
}

export function DemoContextGate({
  context,
  children,
}: {
  context: DemoScenarioContext;
  children: ReactNode;
}) {
  const location = useLocation();

  if (!isDemoEntryState(location.state, context)) {
    return <Navigate to={loginRoutes[context]} replace />;
  }

  return children;
}
