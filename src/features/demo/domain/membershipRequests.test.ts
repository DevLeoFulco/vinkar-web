import { describe, expect, it } from 'vitest';
import {
  approveMainCompanyMembershipRequest,
  createEmptyDemoMembershipState,
  createMainCompanyMembershipRequest,
  getLatestReturnReview,
  getMembershipCapacity,
  rejectMainCompanyMembershipRequest,
  resubmitReturnedMainCompanyMembershipRequest,
  returnMainCompanyMembershipRequest,
} from './membershipRequests';
import { calculateMainNetworkExitEligibleAt, getConsumerPlanPolicy } from './policies';
import type {
  DemoMembershipState,
  DemoSession,
  MembershipApplicantProfile,
  MembershipCommandId,
  MainCompanyMembershipRequest,
  PersonIdentityId,
  SubscriptionPlan,
} from './models';
import type { MembershipOperationResult } from './membershipRequests';
import { getDemoScenario } from '../mocks/demoScenarios';
import { demoCompanies } from '../mocks/companyNetwork';
import { getDemoConsumerProfile } from '../mocks/consumerProfiles';

const requestedAt = new Date('2026-11-08T22:30:45.123Z');

const consumerScenario = (() => {
  const scenario = getDemoScenario('scenario-demo-consumer-free');
  if (!scenario || scenario.context !== 'CONSUMER') {
    throw new Error('Cenário demonstrativo de Consumidor não encontrado.');
  }
  return scenario;
})();

const businessScenario = (() => {
  const scenario = getDemoScenario('scenario-demo-business-admin');
  if (!scenario || scenario.context !== 'BUSINESS') {
    throw new Error('Cenário demonstrativo de Empresa não encontrado.');
  }
  return scenario;
})();

const consumerProfile = (() => {
  const profile = getDemoConsumerProfile(consumerScenario.session.personIdentity.id);
  if (!profile) {
    throw new Error('Perfil demonstrativo de Consumidor não encontrado.');
  }
  return profile;
})();

function commandId(sequence: number): MembershipCommandId {
  return `membership-command-demo-${sequence}`;
}

function consumerSession(
  plan: SubscriptionPlan,
  personIdentityId: PersonIdentityId = consumerScenario.session.personIdentity.id,
): DemoSession {
  return {
    ...consumerScenario.session,
    personIdentity: { ...consumerScenario.session.personIdentity, id: personIdentityId },
    subscriptionPlan: plan,
  };
}

function applicantProfileFor(
  personIdentityId: PersonIdentityId = consumerScenario.session.personIdentity.id,
): MembershipApplicantProfile & { personIdentityId: PersonIdentityId } {
  const suffix = personIdentityId.slice('person-demo-'.length);
  return {
    ...consumerProfile,
    id: `consumer-profile-demo-${suffix}`,
    publicRegistrationCode: `VK-DEMO-${suffix}`,
    personIdentityId,
  };
}

function submit(
  state: DemoMembershipState,
  organizationIndex: number,
  sequence: number,
  plan: SubscriptionPlan = 'FREE',
  profile = applicantProfileFor(),
) {
  return createMainCompanyMembershipRequest({
    state,
    session: consumerSession(plan, profile.personIdentityId),
    organizationId: demoCompanies[organizationIndex].id,
    organizations: demoCompanies,
    applicantProfile: profile,
    commandId: commandId(sequence),
    requestedAt,
  });
}

function requireSuccess<T>(
  result: MembershipOperationResult<T>,
): T & { state: DemoMembershipState } {
  if (!result.success) {
    throw new Error('Operação de domínio esperada deveria ter sucesso.');
  }
  return { ...result.value, state: result.state };
}

function returnRequest(
  state: DemoMembershipState,
  requestId: MainCompanyMembershipRequest['id'],
  sequence: number,
  reason = 'Informe o número de contato atualizado.',
) {
  return returnMainCompanyMembershipRequest({
    state,
    session: businessScenario.session,
    organizationId: businessScenario.organization.id,
    requestId,
    commandId: commandId(sequence),
    decidedAt: requestedAt,
    reason,
  });
}

describe('capacidade e transições de solicitações demonstrativas', () => {
  it('deriva capacidade FREE, PRO e PREMIUM das políticas dos planos', () => {
    expect(getConsumerPlanPolicy('FREE').mainCompanyCapacity).toBe(1);
    expect(getConsumerPlanPolicy('PRO').mainCompanyCapacity).toBe(3);
    expect(getConsumerPlanPolicy('PREMIUM').mainCompanyCapacity).toBe(5);
  });

  it('limita FREE a uma solicitação ou vínculo e permite até três para PRO', () => {
    const freeFirst = requireSuccess(submit(createEmptyDemoMembershipState(), 0, 1));
    const freeState = submit(freeFirst.state, 1, 2);
    expect(freeState).toMatchObject({ success: false, reason: 'CAPACITY_REACHED' });
    expect(
      getMembershipCapacity(freeFirst.state, consumerProfile.personIdentityId, 'FREE'),
    ).toEqual({
      used: 1,
      limit: 1,
      available: 0,
    });

    let proState = createEmptyDemoMembershipState();
    for (let index = 0; index < 3; index += 1) {
      proState = requireSuccess(submit(proState, index, 10 + index, 'PRO')).state;
    }
    expect(submit(proState, 3, 20, 'PRO')).toMatchObject({
      success: false,
      reason: 'CAPACITY_REACHED',
    });
    expect(getMembershipCapacity(proState, consumerProfile.personIdentityId, 'PRO')).toEqual({
      used: 3,
      limit: 3,
      available: 0,
    });
  });

  it('permite até cinco solicitações para PREMIUM', () => {
    let state = createEmptyDemoMembershipState();
    for (let index = 0; index < 5; index += 1) {
      state = requireSuccess(submit(state, index, 30 + index, 'PREMIUM')).state;
    }
    expect(getMembershipCapacity(state, consumerProfile.personIdentityId, 'PREMIUM')).toEqual({
      used: 5,
      limit: 5,
      available: 0,
    });
  });

  it('aplica capacidade por identidade e não globalmente', () => {
    const first = requireSuccess(submit(createEmptyDemoMembershipState(), 0, 40));
    const anotherIdentity = 'person-demo-consumer-002' as const;
    const second = submit(first.state, 1, 41, 'FREE', applicantProfileFor(anotherIdentity));

    expect(second.success).toBe(true);
    if (second.success) {
      expect(second.state.requests).toHaveLength(2);
      expect(getMembershipCapacity(second.state, anotherIdentity, 'FREE')).toEqual({
        used: 1,
        limit: 1,
        available: 0,
      });
    }
  });

  it('uma empresa pode receber solicitações de consumidores diferentes', () => {
    const first = requireSuccess(submit(createEmptyDemoMembershipState(), 0, 50));
    const anotherIdentity = 'person-demo-consumer-003' as const;
    const second = submit(first.state, 0, 51, 'FREE', applicantProfileFor(anotherIdentity));

    expect(second.success).toBe(true);
  });

  it('bloqueia solicitações abertas duplicadas para a mesma identidade e empresa', () => {
    const first = requireSuccess(submit(createEmptyDemoMembershipState(), 0, 60));
    expect(submit(first.state, 0, 61)).toMatchObject({
      success: false,
      reason: 'OPEN_REQUEST_EXISTS',
    });
  });

  it('rejeita organização inexistente, perfil divergente e identidade não consumidora', () => {
    const invalidOrganization = createMainCompanyMembershipRequest({
      state: createEmptyDemoMembershipState(),
      session: consumerScenario.session,
      organizationId: 'organization-demo-not-in-catalog',
      organizations: demoCompanies,
      applicantProfile: applicantProfileFor(),
      commandId: commandId(70),
      requestedAt,
    });
    expect(invalidOrganization).toMatchObject({ success: false, reason: 'ORGANIZATION_NOT_FOUND' });

    const invalidIdentity = createMainCompanyMembershipRequest({
      state: createEmptyDemoMembershipState(),
      session: consumerScenario.session,
      organizationId: demoCompanies[0].id,
      organizations: demoCompanies,
      applicantProfile: applicantProfileFor('person-demo-other-identity'),
      commandId: commandId(71),
      requestedAt,
    });
    expect(invalidIdentity).toMatchObject({ success: false, reason: 'PROFILE_IDENTITY_MISMATCH' });

    const notConsumer = createMainCompanyMembershipRequest({
      state: createEmptyDemoMembershipState(),
      session: businessScenario.session,
      organizationId: demoCompanies[0].id,
      organizations: demoCompanies,
      applicantProfile: applicantProfileFor(),
      commandId: commandId(72),
      requestedAt,
    });
    expect(notConsumer).toMatchObject({ success: false, reason: 'NOT_CONSUMER' });
  });

  it('rejeita dados demonstrativos inválidos e timestamps inválidos', () => {
    const invalidProfile = {
      ...applicantProfileFor(),
      email: 'not-an-email',
    };
    expect(submit(createEmptyDemoMembershipState(), 0, 80, 'FREE', invalidProfile)).toMatchObject({
      success: false,
      reason: 'INVALID_PROFILE',
    });
    expect(() =>
      createMainCompanyMembershipRequest({
        state: createEmptyDemoMembershipState(),
        session: consumerScenario.session,
        organizationId: demoCompanies[0].id,
        organizations: demoCompanies,
        applicantProfile: applicantProfileFor(),
        commandId: commandId(82),
        requestedAt: new Date(Number.NaN),
      }),
    ).toThrow('requestedAt deve ser um instante válido.');
  });

  it('aprova atomicamente, cria um vínculo e usa o mesmo instante UTC', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 90));
    const result = approveMainCompanyMembershipRequest({
      state: request.state,
      session: businessScenario.session,
      organizationId: businessScenario.organization.id,
      requestId: request.id,
      commandId: commandId(91),
      decidedAt: requestedAt,
      plan: 'FREE',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.state.requests[0].status).toBe('APPROVED');
    expect(result.state.memberships).toHaveLength(1);
    expect(result.value).toMatchObject({
      personIdentityId: request.personIdentityId,
      organizationId: request.organizationId,
      status: 'ACTIVE',
      activatedAtUtc: requestedAt.toISOString(),
      approvedRequestId: request.id,
      planAtActivation: 'FREE',
    });
    expect(result.state.reviews.at(-1)).toMatchObject({
      action: 'APPROVED',
      organizationId: businessScenario.organization.id,
      createdAtUtc: result.value.activatedAtUtc,
    });
    expect(Object.isFrozen(result.state.reviews.at(-1))).toBe(true);
  });

  it('rejeita decisões por organização diferente ou sessão sem papel administrativo', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 100));
    expect(
      approveMainCompanyMembershipRequest({
        state: request.state,
        session: businessScenario.session,
        organizationId: demoCompanies[0].id,
        requestId: request.id,
        commandId: commandId(101),
        decidedAt: requestedAt,
        plan: 'FREE',
      }),
    ).toMatchObject({ success: false, reason: 'ORGANIZATION_MISMATCH' });
    expect(
      returnMainCompanyMembershipRequest({
        state: request.state,
        session: consumerScenario.session,
        organizationId: businessScenario.organization.id,
        requestId: request.id,
        commandId: commandId(102),
        decidedAt: requestedAt,
        reason: 'Informação demonstrativa incorreta.',
      }),
    ).toMatchObject({ success: false, reason: 'UNAUTHORIZED_ORGANIZATION' });
  });

  it('não permite que replays idempotentes contornem identidade ou autorização', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 170));
    const createInput = {
      state: request.state,
      organizationId: request.organizationId,
      organizations: demoCompanies,
      applicantProfile: applicantProfileFor(),
      commandId: commandId(170),
      requestedAt,
    };
    expect(
      createMainCompanyMembershipRequest({
        ...createInput,
        session: businessScenario.session,
      }),
    ).toMatchObject({ success: false, reason: 'NOT_CONSUMER' });
    expect(
      createMainCompanyMembershipRequest({
        ...createInput,
        session: consumerSession('FREE', 'person-demo-replay-other'),
      }),
    ).toMatchObject({ success: false, reason: 'PROFILE_IDENTITY_MISMATCH' });

    const approvalInput = {
      state: request.state,
      session: businessScenario.session,
      organizationId: request.organizationId,
      requestId: request.id,
      commandId: commandId(171),
      decidedAt: requestedAt,
      plan: 'FREE' as const,
    };
    const approved = approveMainCompanyMembershipRequest(approvalInput);
    expect(approved.success).toBe(true);
    if (!approved.success) {
      return;
    }
    expect(
      approveMainCompanyMembershipRequest({
        ...approvalInput,
        state: approved.state,
        session: {
          ...businessScenario.session,
          organizationAdministrations: [],
        },
      }),
    ).toMatchObject({ success: false, reason: 'UNAUTHORIZED_ORGANIZATION' });

    const secondIdentity = 'person-demo-consumer-002';
    const secondRequest = requireSuccess(
      submit(approved.state, 4, 172, 'PRO', applicantProfileFor(secondIdentity)),
    );
    const returned = requireSuccess(returnRequest(secondRequest.state, secondRequest.id, 173));
    const correctedProfile = {
      ...returned.applicantProfile,
      personIdentityId: returned.personIdentityId,
      email: 'camila.corrigida@example.com',
    };
    const resubmitInput = {
      state: returned.state,
      session: consumerSession('PRO', secondIdentity),
      requestId: returned.id,
      applicantProfile: correctedProfile,
      commandId: commandId(174),
      resubmittedAt: requestedAt,
    };
    const resubmitted = resubmitReturnedMainCompanyMembershipRequest(resubmitInput);
    expect(resubmitted.success).toBe(true);
    if (!resubmitted.success) {
      return;
    }
    expect(
      resubmitReturnedMainCompanyMembershipRequest({
        ...resubmitInput,
        state: resubmitted.state,
        session: consumerSession('PRO', 'person-demo-replay-other'),
      }),
    ).toMatchObject({ success: false, reason: 'PROFILE_IDENTITY_MISMATCH' });
  });

  it('retorna somente com motivo válido, mantém capacidade e registra auditoria', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 110));
    expect(returnRequest(request.state, request.id, 111, '   ')).toMatchObject({
      success: false,
      reason: 'RETURN_REASON_REQUIRED',
    });
    expect(returnRequest(request.state, request.id, 112, 'curto')).toMatchObject({
      success: false,
      reason: 'RETURN_REASON_TOO_SHORT',
    });

    const returned = returnRequest(
      request.state,
      request.id,
      113,
      '  Informe   um telefone atualizado.  ',
    );
    expect(returned.success).toBe(true);
    if (!returned.success) {
      return;
    }
    expect(returned.value.status).toBe('RETURNED');
    expect(getMembershipCapacity(returned.state, request.personIdentityId, 'FREE').used).toBe(1);
    expect(getLatestReturnReview(returned.state, request.id)?.reason).toBe(
      'Informe um telefone atualizado.',
    );
  });

  it('reenvia após correção preservando ID, identidade, código e histórico', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 120));
    const originalReview = request.state.reviews[0];
    const returned = requireSuccess(returnRequest(request.state, request.id, 121));
    const correctedProfile = {
      ...returned.applicantProfile,
      email: 'camila.atualizada@example.com',
      personIdentityId: returned.personIdentityId,
    };
    const resubmitted = resubmitReturnedMainCompanyMembershipRequest({
      state: returnRequest(request.state, request.id, 121).state,
      session: consumerScenario.session,
      requestId: request.id,
      applicantProfile: correctedProfile,
      commandId: commandId(122),
      resubmittedAt: new Date('2026-11-09T01:00:00.000Z'),
    });

    expect(resubmitted.success).toBe(true);
    if (!resubmitted.success) {
      return;
    }
    expect(resubmitted.value).toMatchObject({
      id: request.id,
      personIdentityId: request.personIdentityId,
      organizationId: request.organizationId,
      status: 'PENDING',
      applicantProfile: {
        id: request.applicantProfile.id,
        publicRegistrationCode: request.applicantProfile.publicRegistrationCode,
        email: 'camila.atualizada@example.com',
      },
    });
    expect(resubmitted.state.reviews.map((review) => review.action)).toEqual([
      'SUBMITTED',
      'RETURNED',
      'RESUBMITTED',
    ]);
    expect(request.state.requests[0].status).toBe('PENDING');
    expect(request.state.reviews).toHaveLength(1);
    expect(Object.isFrozen(originalReview)).toBe(true);
    expect(returned.state.reviews[0]).toBe(originalReview);
  });

  it('recusa reenvio sem correção e preserva a vaga rejeitada para novo ID', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 130));
    const rejected = rejectMainCompanyMembershipRequest({
      state: request.state,
      session: businessScenario.session,
      organizationId: businessScenario.organization.id,
      requestId: request.id,
      commandId: commandId(131),
      decidedAt: requestedAt,
      reason: 'Solicitação encerrada para o cenário.',
    });
    expect(rejected.success).toBe(true);
    if (!rejected.success) {
      return;
    }
    expect(getMembershipCapacity(rejected.state, request.personIdentityId, 'FREE').available).toBe(
      1,
    );
    const nextRequest = submit(rejected.state, 0, 132);
    expect(nextRequest.success).toBe(true);
    if (nextRequest.success) {
      expect(nextRequest.value.id).not.toBe(request.id);
      expect(nextRequest.state.requests.map((item) => item.status)).toEqual([
        'REJECTED',
        'PENDING',
      ]);
    }
  });

  it('trata comandos repetidos como idempotentes e recusa conflito de ID', () => {
    const created = submit(createEmptyDemoMembershipState(), 4, 140);
    const request = requireSuccess(created);
    const repeatedCreate = submit(request.state, 4, 140);
    expect(repeatedCreate.success).toBe(true);
    if (!repeatedCreate.success) {
      return;
    }
    expect(repeatedCreate.state.requests).toHaveLength(1);
    expect(submit(request.state, 3, 140)).toMatchObject({
      success: false,
      reason: 'COMMAND_ID_CONFLICT',
    });
    expect(
      createMainCompanyMembershipRequest({
        state: request.state,
        session: consumerSession('FREE', request.personIdentityId),
        organizationId: request.organizationId,
        organizations: demoCompanies,
        applicantProfile: {
          ...request.applicantProfile,
          personIdentityId: request.personIdentityId,
        },
        commandId: commandId(140),
        requestedAt: new Date(requestedAt.getTime() + 1_000),
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });

    const approvalInput = {
      state: request.state,
      session: businessScenario.session,
      organizationId: businessScenario.organization.id,
      requestId: request.id,
      commandId: commandId(141),
      decidedAt: requestedAt,
      plan: 'FREE' as const,
    };
    const firstApproval = approveMainCompanyMembershipRequest(approvalInput);
    expect(firstApproval.success).toBe(true);
    if (!firstApproval.success) {
      return;
    }
    const repeatedApproval = approveMainCompanyMembershipRequest({
      ...approvalInput,
      state: firstApproval.state,
    });
    expect(repeatedApproval.success).toBe(true);
    if (repeatedApproval.success) {
      expect(repeatedApproval.state.memberships).toHaveLength(1);
      expect(repeatedApproval.state.reviews).toHaveLength(2);
    }
    expect(
      approveMainCompanyMembershipRequest({
        ...approvalInput,
        state: firstApproval.state,
        decidedAt: new Date(requestedAt.getTime() + 1_000),
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });
    expect(
      approveMainCompanyMembershipRequest({
        ...approvalInput,
        state: firstApproval.state,
        session: {
          ...businessScenario.session,
          personIdentity: {
            ...businessScenario.session.personIdentity,
            id: 'person-demo-other-administrator',
          },
        },
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });
    expect(
      approveMainCompanyMembershipRequest({
        ...approvalInput,
        state: firstApproval.state,
        commandId: commandId(142),
      }),
    ).toMatchObject({ success: false, reason: 'REQUEST_NOT_PENDING' });
  });

  it('mantém retorno, reenvio e rejeição idempotentes e protege o conteúdo do comando', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 160));
    const returnInput = {
      state: request.state,
      session: businessScenario.session,
      organizationId: businessScenario.organization.id,
      requestId: request.id,
      commandId: commandId(161),
      decidedAt: requestedAt,
      reason: 'Atualize o telefone demonstrativo.',
    };
    const returned = returnMainCompanyMembershipRequest(returnInput);
    expect(returned.success).toBe(true);
    if (!returned.success) {
      return;
    }

    const repeatedReturn = returnMainCompanyMembershipRequest({
      ...returnInput,
      state: returned.state,
    });
    expect(repeatedReturn.success).toBe(true);
    expect(repeatedReturn.state.reviews).toHaveLength(2);
    expect(
      returnMainCompanyMembershipRequest({
        ...returnInput,
        state: returned.state,
        reason: 'Outro motivo.',
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });
    expect(
      returnMainCompanyMembershipRequest({
        ...returnInput,
        state: returned.state,
        decidedAt: new Date(requestedAt.getTime() + 1_000),
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });

    const correctedProfile = {
      ...returned.value.applicantProfile,
      personIdentityId: request.personIdentityId,
      email: 'camila.corrigida@example.com',
    };
    const resubmitInput = {
      state: returned.state,
      session: consumerScenario.session,
      requestId: request.id,
      applicantProfile: correctedProfile,
      commandId: commandId(162),
      resubmittedAt: new Date('2026-11-09T01:00:00.000Z'),
    };
    const resubmitted = resubmitReturnedMainCompanyMembershipRequest(resubmitInput);
    expect(resubmitted.success).toBe(true);
    if (!resubmitted.success) {
      return;
    }
    const repeatedResubmission = resubmitReturnedMainCompanyMembershipRequest({
      ...resubmitInput,
      state: resubmitted.state,
    });
    expect(repeatedResubmission.success).toBe(true);
    expect(repeatedResubmission.state.reviews).toHaveLength(3);
    expect(
      resubmitReturnedMainCompanyMembershipRequest({
        ...resubmitInput,
        state: resubmitted.state,
        applicantProfile: { ...correctedProfile, email: 'outro@example.com' },
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });
    expect(
      resubmitReturnedMainCompanyMembershipRequest({
        ...resubmitInput,
        state: resubmitted.state,
        resubmittedAt: new Date(resubmitInput.resubmittedAt.getTime() + 1_000),
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });

    const rejectInput = {
      state: resubmitted.state,
      session: businessScenario.session,
      organizationId: businessScenario.organization.id,
      requestId: request.id,
      commandId: commandId(163),
      decidedAt: requestedAt,
      reason: 'Solicitação encerrada para o cenário.',
    };
    const rejected = rejectMainCompanyMembershipRequest(rejectInput);
    expect(rejected.success).toBe(true);
    if (!rejected.success) {
      return;
    }
    const repeatedRejection = rejectMainCompanyMembershipRequest({
      ...rejectInput,
      state: rejected.state,
    });
    expect(repeatedRejection.success).toBe(true);
    expect(repeatedRejection.state.reviews).toHaveLength(4);
    expect(
      rejectMainCompanyMembershipRequest({
        ...rejectInput,
        state: rejected.state,
        reason: 'Outro motivo.',
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });
    expect(
      rejectMainCompanyMembershipRequest({
        ...rejectInput,
        state: rejected.state,
        decidedAt: new Date(requestedAt.getTime() + 1_000),
      }),
    ).toMatchObject({ success: false, reason: 'COMMAND_ID_CONFLICT' });
  });

  it('contabiliza vínculo ativo e não conta solicitação aprovada duas vezes', () => {
    const request = requireSuccess(submit(createEmptyDemoMembershipState(), 4, 150));
    const approved = approveMainCompanyMembershipRequest({
      state: request.state,
      session: businessScenario.session,
      organizationId: businessScenario.organization.id,
      requestId: request.id,
      commandId: commandId(151),
      decidedAt: requestedAt,
      plan: 'FREE',
    });
    expect(approved.success).toBe(true);
    if (approved.success) {
      expect(getMembershipCapacity(approved.state, request.personIdentityId, 'FREE')).toEqual({
        used: 1,
        limit: 1,
        available: 0,
      });
      expect(submit(approved.state, 1, 152)).toMatchObject({
        success: false,
        reason: 'CAPACITY_REACHED',
      });
      expect(submit(approved.state, 4, 153)).toMatchObject({
        success: false,
        reason: 'ALREADY_AFFILIATED',
      });
    }
  });

  it('aplica carências por plano a partir do instante de ativação individual', () => {
    expect(
      calculateMainNetworkExitEligibleAt('FREE', new Date('2026-11-08T22:30:45.123Z')),
    ).toEqual(new Date('2026-12-08T22:30:45.123Z'));
    expect(calculateMainNetworkExitEligibleAt('PRO', requestedAt)).toEqual(
      new Date('2026-11-23T22:30:45.123Z'),
    );
    expect(calculateMainNetworkExitEligibleAt('PREMIUM', requestedAt)).toEqual(requestedAt);
  });

  it('mantém instante de ativação e carência independentes por vínculo', () => {
    const consumerPlan = 'PRO';
    const firstRequest = requireSuccess(
      submit(createEmptyDemoMembershipState(), 4, 180, consumerPlan),
    );
    const secondRequest = requireSuccess(submit(firstRequest.state, 0, 181, consumerPlan));
    const firstActivatedAt = new Date('2026-11-08T22:30:45.123Z');
    const secondActivatedAt = new Date('2026-11-10T09:15:00.000Z');
    const firstApproved = approveMainCompanyMembershipRequest({
      state: secondRequest.state,
      session: businessScenario.session,
      organizationId: businessScenario.organization.id,
      requestId: firstRequest.id,
      commandId: commandId(182),
      decidedAt: firstActivatedAt,
      plan: consumerPlan,
    });
    expect(firstApproved.success).toBe(true);
    if (!firstApproved.success) {
      return;
    }

    const secondCompanySession: DemoSession = {
      ...businessScenario.session,
      organizationAdministrations: [{ organizationId: demoCompanies[0].id, role: 'ADMINISTRATOR' }],
    };
    const secondApproved = approveMainCompanyMembershipRequest({
      state: firstApproved.state,
      session: secondCompanySession,
      organizationId: demoCompanies[0].id,
      requestId: secondRequest.id,
      commandId: commandId(183),
      decidedAt: secondActivatedAt,
      plan: consumerPlan,
    });
    expect(secondApproved.success).toBe(true);
    if (!secondApproved.success) {
      return;
    }

    expect(secondApproved.state.memberships.map((membership) => membership.activatedAtUtc)).toEqual(
      [firstActivatedAt.toISOString(), secondActivatedAt.toISOString()],
    );
    expect(
      secondApproved.state.memberships.map((membership) =>
        calculateMainNetworkExitEligibleAt(
          membership.planAtActivation,
          new Date(membership.activatedAtUtc),
        ).toISOString(),
      ),
    ).toEqual(['2026-11-23T22:30:45.123Z', '2026-11-25T09:15:00.000Z']);
  });
});
