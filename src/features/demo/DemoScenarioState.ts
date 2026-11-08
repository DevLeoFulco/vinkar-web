import { createContext } from 'react';
import type { DemoScenario } from './mocks/demoScenarios';

export type DemoScenarioContextValue = Readonly<{
  activeScenario: DemoScenario | null;
}>;

export const DemoScenarioContext = createContext<DemoScenarioContextValue | null>(null);
