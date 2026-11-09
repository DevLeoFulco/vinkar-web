import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import { getConsumerPlanPolicy, calculateMainNetworkExitEligibleAt } from './domain/policies';
import {
  getLatestReturnReview,
  getMembershipCapacity,
  normalizeApplicantProfile,
  validateApplicantProfile,
  type MembershipOperationFailureReason,
} from './domain/membershipRequests';
import type {
  MainCompanyMembershipRequest,
  MembershipApplicantProfile,
  MembershipRequestStatus,
} from './domain/models';
import { DemoShell } from './DemoPages';
import { getDemoCompany } from './mocks/companyNetwork';
import { getMembershipRequestsForConsumer } from './membershipRequestSelectors';
import { useDemoMembershipRequests } from './useDemoMembershipRequests';
import { useDemoScenario } from './useDemoScenario';

const requestDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
});

const statusLabels: Readonly<Record<MembershipRequestStatus, string>> = {
  PENDING: 'Pendente',
  RETURNED: 'Retornado',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

const statusVariants: Readonly<Record<MembershipRequestStatus, 'warning' | 'success' | 'neutral'>> =
  {
    PENDING: 'warning',
    RETURNED: 'warning',
    APPROVED: 'success',
    REJECTED: 'neutral',
  };

const resubmissionErrors: Partial<Record<MembershipOperationFailureReason, string>> = {
  NOT_CONSUMER: 'Somente o cenário demonstrativo de Consumidor pode reenviar a solicitação.',
  PROFILE_IDENTITY_MISMATCH: 'Não foi possível validar a identidade associada à solicitação.',
  INVALID_PROFILE: 'Confira os dados obrigatórios e seus formatos.',
  REQUEST_NOT_FOUND: 'A solicitação não foi encontrada.',
  REQUEST_NOT_RETURNED: 'Esta solicitação não está aguardando correção.',
  COMMAND_ID_CONFLICT: 'O comando já foi utilizado em outra operação.',
};

function CorrectionDialog({
  request,
  personIdentityId,
  scenario,
  onClose,
}: {
  request: MainCompanyMembershipRequest;
  personIdentityId: MainCompanyMembershipRequest['personIdentityId'];
  scenario: Extract<
    NonNullable<ReturnType<typeof useDemoScenario>['activeScenario']>,
    { context: 'CONSUMER' }
  >;
  onClose: () => void;
}) {
  const { resubmitRequest } = useDemoMembershipRequests();
  const [profile, setProfile] = useState<MembershipApplicantProfile>(request.applicantProfile);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstInputRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled)',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      const focusOutside = !dialogRef.current.contains(document.activeElement);
      if (focusable.length === 0) {
        event.preventDefault();
      } else if (event.shiftKey && (document.activeElement === first || focusOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusOutside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  function updateField(field: keyof MembershipApplicantProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeApplicantProfile(profile);
    if (validateApplicantProfile(normalized)) {
      setError('Confira os dados obrigatórios e seus formatos antes de reenviar.');
      return;
    }
    setIsSubmitting(true);
    const result = resubmitRequest({
      scenario,
      requestId: request.id,
      applicantProfile: { ...normalized, personIdentityId },
      resubmittedAt: new Date(),
    });
    setIsSubmitting(false);
    if (result.success) {
      onClose();
      return;
    }
    setError(resubmissionErrors[result.reason] ?? 'Não foi possível reenviar a solicitação.');
  }

  return (
    <div className="membership-dialog-overlay">
      <div
        aria-labelledby="membership-correction-title"
        aria-modal="true"
        className="membership-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="membership-dialog-heading">
          <div>
            <h2 id="membership-correction-title">Corrigir informações demonstrativas</h2>
            <p>
              Código de cadastro <strong>{request.applicantProfile.publicRegistrationCode}</strong>{' '}
              (não editável)
            </p>
          </div>
          <button
            aria-label="Fechar correção"
            className="company-conditions-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <form className="membership-correction-form" onSubmit={handleSubmit}>
          <label>
            Nome completo
            <input
              autoComplete="name"
              maxLength={120}
              onChange={(event) => updateField('fullName', event.target.value)}
              ref={firstInputRef}
              required
              value={profile.fullName}
            />
          </label>
          <label>
            E-mail demonstrativo
            <input
              autoComplete="email"
              maxLength={254}
              onChange={(event) => updateField('email', event.target.value)}
              required
              type="email"
              value={profile.email}
            />
          </label>
          <label>
            Telefone demonstrativo (10 ou 11 dígitos)
            <input
              autoComplete="tel"
              inputMode="numeric"
              maxLength={11}
              onChange={(event) => updateField('phone', event.target.value.replace(/\D/g, ''))}
              pattern="\d{10,11}"
              required
              value={profile.phone}
            />
          </label>
          <label>
            Cidade
            <input
              autoComplete="address-level2"
              maxLength={100}
              onChange={(event) => updateField('city', event.target.value)}
              required
              value={profile.city}
            />
          </label>
          <label>
            Estado (UF)
            <input
              autoComplete="address-level1"
              maxLength={2}
              onChange={(event) => updateField('state', event.target.value.toUpperCase())}
              pattern="[A-Za-z]{2}"
              required
              value={profile.state}
            />
          </label>
          <p>Use somente dados fictícios. Não informe documentos ou dados financeiros.</p>
          {error && <p role="alert">{error}</p>}
          <div className="membership-review-actions">
            <Button disabled={isSubmitting} type="submit">
              Reenviar solicitação
            </Button>
            <Button disabled={isSubmitting} onClick={onClose} type="button" variant="subtle">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function MembershipRequestsPage() {
  const { activeScenario } = useDemoScenario();
  const { state } = useDemoMembershipRequests();
  const [correctionRequestId, setCorrectionRequestId] = useState<string | null>(null);
  const scenario =
    activeScenario?.context === 'CONSUMER' &&
    activeScenario.session.activePersonalProfile === 'CONSUMER'
      ? activeScenario
      : null;

  if (!scenario || !scenario.session.subscriptionPlan) {
    return <Navigate to={routes.demoLoginConsumer} replace />;
  }

  const personIdentityId = scenario.session.personIdentity.id;
  const requests = getMembershipRequestsForConsumer(state, personIdentityId);
  const capacity = getMembershipCapacity(
    state,
    personIdentityId,
    scenario.session.subscriptionPlan,
  );
  const limit = getConsumerPlanPolicy(scenario.session.subscriptionPlan).mainCompanyCapacity;
  const correctionRequest = requests.find((request) => request.id === correctionRequestId);

  return (
    <DemoShell
      business={false}
      title="Minhas solicitações"
      subtitle="Acompanhe pedidos, retornos e vínculos principais do seu cenário demonstrativo."
    >
      <Card
        as="section"
        className="membership-capacity"
        aria-labelledby="membership-capacity-title"
      >
        <div>
          <h2 id="membership-capacity-title">Capacidade do plano</h2>
          <p>
            {capacity.used} de {limit} empresas principais utilizadas · {capacity.available}{' '}
            disponível(is)
          </p>
        </div>
        <p>
          Vínculos ativos e solicitações pendentes ou retornadas reservam capacidade. Pedidos
          rejeitados não ocupam vaga; pedidos aprovados são contabilizados pelo vínculo ativo.
        </p>
      </Card>

      {requests.length ? (
        <section className="membership-requests-list" aria-label="Solicitações da identidade">
          {requests.map((request) => {
            const company = getDemoCompany(request.organizationId);
            const returnReview =
              request.status === 'RETURNED' ? getLatestReturnReview(state, request.id) : undefined;
            const membership = state.memberships.find(
              (item) => item.approvedRequestId === request.id,
            );
            const eligibleAt =
              membership &&
              calculateMainNetworkExitEligibleAt(
                membership.planAtActivation,
                new Date(membership.activatedAtUtc),
              );

            return (
              <Card as="article" className="membership-request-item" key={request.id}>
                <div className="membership-request-item-heading">
                  <div>
                    <span className="membership-request-label">Empresa principal</span>
                    <h2>{company?.displayName ?? 'Empresa não identificada no catálogo'}</h2>
                  </div>
                  <Badge variant={statusVariants[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                </div>
                <p>
                  Solicitada em (UTC):{' '}
                  <strong>{requestDateFormatter.format(new Date(request.createdAtUtc))}</strong>
                </p>
                {request.status === 'PENDING' && (
                  <p className="membership-request-note">
                    Aguardando análise da empresa. Nenhum vínculo foi ativado por este estado.
                  </p>
                )}
                {request.status === 'RETURNED' && (
                  <div className="membership-return-reason">
                    <h3>Motivo do retorno</h3>
                    <p>{returnReview?.reason ?? 'A empresa não informou um motivo.'}</p>
                    <Button onClick={() => setCorrectionRequestId(request.id)} type="button">
                      Corrigir informações
                    </Button>
                  </div>
                )}
                {request.status === 'APPROVED' && (
                  <div className="membership-active-notice" role="status">
                    <strong>Vínculo ativo.</strong> A ativação ocorreu em{' '}
                    {membership
                      ? requestDateFormatter.format(new Date(membership.activatedAtUtc))
                      : 'instante não disponível'}
                    . A aprovação não concede benefícios automaticamente.
                    {eligibleAt && (
                      <p>
                        Elegibilidade de saída conforme o plano na ativação:{' '}
                        {requestDateFormatter.format(eligibleAt)} (UTC).
                      </p>
                    )}
                  </div>
                )}
                {request.status === 'REJECTED' && (
                  <p className="membership-request-note">
                    Solicitação encerrada. Uma nova solicitação para esta empresa exige um novo
                    pedido.
                  </p>
                )}
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="membership-request-empty-state">
          <p>Você ainda não possui solicitações neste cenário demonstrativo.</p>
          <Link
            className="ui-button ui-button--secondary"
            to={routes.demoCompanies}
            state={{ demoContext: 'CONSUMER' }}
          >
            Conhecer empresas
          </Link>
        </Card>
      )}
      {correctionRequest && correctionRequest.status === 'RETURNED' && (
        <CorrectionDialog
          onClose={() => setCorrectionRequestId(null)}
          personIdentityId={personIdentityId}
          request={correctionRequest}
          scenario={scenario}
        />
      )}
    </DemoShell>
  );
}
