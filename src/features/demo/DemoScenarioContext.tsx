import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { routes } from '../../shared/config/routes';
import { getDemoScenario, type DemoScenario, type DemoScenarioId } from './mocks/demoScenarios';
import { DemoScenarioContext } from './DemoScenarioState';

function getScenarioForPath(pathname: string, search: string, state: unknown): DemoScenario | null {
  if (pathname === routes.demoLogin || pathname === routes.demoSignUp) {
    const context = new URLSearchParams(search).get('context');
    switch (context) {
      case 'CONSUMER':
        return getDemoScenario('scenario-demo-consumer-free') ?? null;
      case 'BUSINESS':
        return getDemoScenario('scenario-demo-business-admin') ?? null;
      case 'BENEFICIARY':
        return getDemoScenario('scenario-demo-beneficiary') ?? null;
      default:
        return null;
    }
  }

  const scenarioIdByPath: Readonly<Record<string, DemoScenarioId>> = {
    [routes.demoConsumer]: 'scenario-demo-consumer-free',
    [routes.demoBenefits]: 'scenario-demo-consumer-free',
    [routes.demoWallet]: 'scenario-demo-consumer-free',
    [routes.demoBusiness]: 'scenario-demo-business-admin',
    [routes.demoCampaigns]: 'scenario-demo-business-admin',
    [routes.demoPartners]: 'scenario-demo-business-admin',
    [routes.demoBeneficiary]: 'scenario-demo-beneficiary',
  };
  const scenarioId = scenarioIdByPath[pathname];
  const contextByPath: Readonly<Record<string, string>> = {
    [routes.demoConsumer]: 'CONSUMER',
    [routes.demoBenefits]: 'CONSUMER',
    [routes.demoWallet]: 'CONSUMER',
    [routes.demoBusiness]: 'BUSINESS',
    [routes.demoCampaigns]: 'BUSINESS',
    [routes.demoPartners]: 'BUSINESS',
    [routes.demoBeneficiary]: 'BENEFICIARY',
  };
  const expectedContext = contextByPath[pathname];
  const stateContext =
    typeof state === 'object' && state !== null && 'demoContext' in state
      ? state.demoContext
      : null;

  return scenarioId && stateContext === expectedContext
    ? (getDemoScenario(scenarioId) ?? null)
    : null;
}

export function DemoScenarioProvider({ children }: { children: ReactNode }) {
  const { pathname, search, state } = useLocation();
  const activeScenario = getScenarioForPath(pathname, search, state);

  return (
    <DemoScenarioContext.Provider value={{ activeScenario }}>
      {children}
    </DemoScenarioContext.Provider>
  );
}
