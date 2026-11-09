import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DemoMembershipRequestProvider } from './DemoMembershipRequests';
import { demoCompanies } from './mocks/companyNetwork';
import { getDemoScenario } from './mocks/demoScenarios';
import type { DemoScenario } from './mocks/demoScenarios';
import { useDemoMembershipRequests } from './useDemoMembershipRequests';

function getConsumerScenario(): Extract<DemoScenario, { context: 'CONSUMER' }> {
  const scenario = getDemoScenario('scenario-demo-consumer-free');
  if (!scenario || scenario.context !== 'CONSUMER') {
    throw new Error('Cenário demonstrativo de Consumidor não encontrado.');
  }
  return scenario;
}

const consumerScenario = getConsumerScenario();

function ConcurrentSubmissionHarness() {
  const { state, submitRequest } = useDemoMembershipRequests();

  function submitTwoRequestsInOneEvent() {
    const requestedAt = new Date('2026-11-08T22:30:45.123Z');
    const first = submitRequest({
      scenario: consumerScenario,
      organizationId: demoCompanies[0].id,
      requestedAt,
    });
    const second = submitRequest({
      scenario: consumerScenario,
      organizationId: demoCompanies[1].id,
      requestedAt,
    });
    expect(first.success).toBe(true);
    expect(second).toMatchObject({ success: false, reason: 'CAPACITY_REACHED' });
  }

  return (
    <>
      <button onClick={submitTwoRequestsInOneEvent} type="button">
        Enviar em sequência
      </button>
      <output aria-label="Solicitações no estado" role="status">
        {state.requests.length}
      </output>
    </>
  );
}

describe('concorrência das operações demonstrativas de adesão', () => {
  it('valida o segundo comando contra o estado atualizado na mesma interação', () => {
    render(
      <DemoMembershipRequestProvider>
        <ConcurrentSubmissionHarness />
      </DemoMembershipRequestProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enviar em sequência' }));

    expect(screen.getByRole('status', { name: 'Solicitações no estado' })).toHaveTextContent('1');
  });
});
