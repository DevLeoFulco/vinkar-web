import { useContext } from 'react';
import { DemoScenarioContext } from './DemoScenarioState';

export function useDemoScenario() {
  const context = useContext(DemoScenarioContext);
  if (!context) {
    throw new Error('useDemoScenario deve ser usado dentro de DemoScenarioProvider.');
  }

  return context;
}
