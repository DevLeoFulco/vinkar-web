import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  approveMainCompanyMembershipRequest,
  createEmptyDemoMembershipState,
  createMainCompanyMembershipRequest,
  rejectMainCompanyMembershipRequest,
  resubmitReturnedMainCompanyMembershipRequest,
  returnMainCompanyMembershipRequest,
  type MembershipOperationResult,
} from './domain/membershipRequests';
import type { DemoMembershipState, MembershipCommandId } from './domain/models';
import { getDemoConsumerProfile } from './mocks/consumerProfiles';
import { demoCompanies } from './mocks/companyNetwork';
import { getDemoScenario } from './mocks/demoScenarios';
import {
  DemoMembershipRequestContext,
  type DemoMembershipRequestContextValue,
  type RequestDecision,
  type RequestResubmission,
  type RequestSubmission,
} from './DemoMembershipRequestState';

export function DemoMembershipRequestProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoMembershipState>(createEmptyDemoMembershipState);
  const stateRef = useRef(state);
  const commandSequence = useRef(0);

  const getNextCommandId = useCallback((): MembershipCommandId => {
    commandSequence.current += 1;
    return `membership-command-demo-${commandSequence.current}`;
  }, []);

  const commit = useCallback(
    <T,>(result: MembershipOperationResult<T>): MembershipOperationResult<T> => {
      if (result.success) {
        stateRef.current = result.state;
        setState(result.state);
      }
      return result;
    },
    [],
  );

  const submitRequest = useCallback(
    (submission: RequestSubmission) => {
      const { scenario, organizationId, requestedAt } = submission;
      const profile = getDemoConsumerProfile(scenario.session.personIdentity.id);
      if (!profile) {
        return {
          success: false as const,
          state: stateRef.current,
          reason: 'PROFILE_NOT_FOUND' as const,
        };
      }
      return commit(
        createMainCompanyMembershipRequest({
          state: stateRef.current,
          session: scenario.session,
          organizationId,
          organizations: demoCompanies,
          applicantProfile: profile,
          commandId: getNextCommandId(),
          requestedAt,
        }),
      );
    },
    [commit, getNextCommandId],
  );

  const approveRequest = useCallback(
    (decision: RequestDecision) => {
      if (decision.scenario.context !== 'BUSINESS') {
        return {
          success: false as const,
          state: stateRef.current,
          reason: 'UNAUTHORIZED_ORGANIZATION' as const,
        };
      }
      const consumerScenario = getDemoScenario('scenario-demo-consumer-free');
      if (!consumerScenario || consumerScenario.context !== 'CONSUMER') {
        throw new Error('Cenário demonstrativo de Consumidor não encontrado.');
      }
      return commit(
        approveMainCompanyMembershipRequest({
          state: stateRef.current,
          session: decision.scenario.session,
          organizationId: decision.scenario.organization.id,
          requestId: decision.requestId,
          commandId: getNextCommandId(),
          decidedAt: decision.decidedAt,
          plan: consumerScenario.session.subscriptionPlan,
        }),
      );
    },
    [commit, getNextCommandId],
  );
  const rejectRequest = useCallback(
    (decision: RequestDecision) => {
      if (decision.scenario.context !== 'BUSINESS') {
        return {
          success: false as const,
          state: stateRef.current,
          reason: 'UNAUTHORIZED_ORGANIZATION' as const,
        };
      }
      return commit(
        rejectMainCompanyMembershipRequest({
          state: stateRef.current,
          session: decision.scenario.session,
          organizationId: decision.scenario.organization.id,
          requestId: decision.requestId,
          commandId: getNextCommandId(),
          decidedAt: decision.decidedAt,
          reason: decision.reason,
        }),
      );
    },
    [commit, getNextCommandId],
  );
  const returnRequest = useCallback(
    (decision: RequestDecision & { reason: string }) => {
      if (decision.scenario.context !== 'BUSINESS') {
        return {
          success: false as const,
          state: stateRef.current,
          reason: 'UNAUTHORIZED_ORGANIZATION' as const,
        };
      }
      return commit(
        returnMainCompanyMembershipRequest({
          state: stateRef.current,
          session: decision.scenario.session,
          organizationId: decision.scenario.organization.id,
          requestId: decision.requestId,
          commandId: getNextCommandId(),
          decidedAt: decision.decidedAt,
          reason: decision.reason,
        }),
      );
    },
    [commit, getNextCommandId],
  );

  const resubmitRequest = useCallback(
    (resubmission: RequestResubmission) => {
      if (resubmission.scenario.context !== 'CONSUMER') {
        return {
          success: false as const,
          state: stateRef.current,
          reason: 'NOT_CONSUMER' as const,
        };
      }
      return commit(
        resubmitReturnedMainCompanyMembershipRequest({
          state: stateRef.current,
          session: resubmission.scenario.session,
          requestId: resubmission.requestId,
          applicantProfile: {
            ...resubmission.applicantProfile,
            personIdentityId: resubmission.scenario.session.personIdentity.id,
          },
          commandId: getNextCommandId(),
          resubmittedAt: resubmission.resubmittedAt,
        }),
      );
    },
    [commit, getNextCommandId],
  );

  const value: DemoMembershipRequestContextValue = {
    state,
    submitRequest,
    approveRequest,
    rejectRequest,
    returnRequest,
    resubmitRequest,
  };

  return (
    <DemoMembershipRequestContext.Provider value={value}>
      {children}
    </DemoMembershipRequestContext.Provider>
  );
}
