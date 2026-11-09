import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import type {
  MainCompanyMembershipRequest,
  MembershipRequestReviewAction,
  MembershipRequestStatus,
} from './domain/models';
import { DemoShell } from './DemoPages';
import { getMembershipRequestsForOrganization } from './membershipRequestSelectors';
import { useDemoMembershipRequests } from './useDemoMembershipRequests';
import { useDemoScenario } from './useDemoScenario';
import type { MembershipOperationFailureReason } from './domain/membershipRequests';

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

const reviewActionLabels: Readonly<Record<MembershipRequestReviewAction, string>> = {
  SUBMITTED: 'Solicitada',
  RETURNED: 'Retornada',
  RESUBMITTED: 'Reenviada',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
};

const statusVariants: Readonly<Record<MembershipRequestStatus, 'warning' | 'success' | 'neutral'>> =
  {
    PENDING: 'warning',
    RETURNED: 'warning',
    APPROVED: 'success',
    REJECTED: 'neutral',
  };

const decisionErrors: Partial<Record<MembershipOperationFailureReason, string>> = {
  REQUEST_NOT_FOUND: 'A solicitação não foi encontrada.',
  REQUEST_NOT_PENDING: 'A solicitação não está mais pendente.',
  UNAUTHORIZED_ORGANIZATION: 'Esta identidade não pode analisar solicitações da organização.',
  ORGANIZATION_MISMATCH: 'A solicitação pertence a outra organização.',
  ALREADY_AFFILIATED: 'O consumidor já possui vínculo ativo com esta empresa.',
  CAPACITY_REACHED: 'A capacidade atual do plano do consumidor foi atingida.',
  RETURN_REASON_REQUIRED: 'Informe o motivo do retorno.',
  RETURN_REASON_TOO_SHORT: 'O motivo deve ter pelo menos 10 caracteres.',
  RETURN_REASON_TOO_LONG: 'O motivo deve ter no máximo 500 caracteres.',
  COMMAND_ID_CONFLICT: 'O comando já foi utilizado em outra operação.',
};

function getApplicantName(request: MainCompanyMembershipRequest): string {
  return request.applicantProfile.fullName;
}

function RequestReviewDialog({
  request,
  reviews,
  scenario,
  onClose,
}: {
  request: MainCompanyMembershipRequest;
  reviews: ReturnType<typeof useDemoMembershipRequests>['state']['reviews'];
  scenario: Extract<
    NonNullable<ReturnType<typeof useDemoScenario>['activeScenario']>,
    { context: 'BUSINESS' }
  >;
  onClose: () => void;
}) {
  const { approveRequest, returnRequest, rejectRequest } = useDemoMembershipRequests();
  const [isReturning, setIsReturning] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const requestReviews = reviews.filter((review) => review.requestId === request.id);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea:not(:disabled)',
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

  function applyDecision(action: 'approve' | 'reject' | 'return', decisionReason?: string) {
    setIsSubmitting(true);
    const input = {
      scenario,
      requestId: request.id,
      decidedAt: new Date(),
      ...(decisionReason ? { reason: decisionReason } : {}),
    };
    const result =
      action === 'approve'
        ? approveRequest(input)
        : action === 'reject'
          ? rejectRequest(input)
          : returnRequest({ ...input, reason: decisionReason ?? '' });
    setIsSubmitting(false);
    if (result.success) {
      setError(null);
      onClose();
      return;
    }
    setError(decisionErrors[result.reason] ?? 'Não foi possível concluir a análise.');
  }

  function submitReturn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyDecision('return', reason);
  }

  return (
    <div className="membership-dialog-overlay">
      <div
        aria-labelledby="membership-review-title"
        aria-modal="true"
        className="membership-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <header className="membership-dialog-heading">
          <div>
            <span className="membership-request-label">Análise demonstrativa</span>
            <h2 id="membership-review-title">{getApplicantName(request)}</h2>
            <p>Código de cadastro: {request.applicantProfile.publicRegistrationCode}</p>
          </div>
          <button
            aria-label="Fechar análise"
            className="company-conditions-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </header>

        <dl className="membership-applicant-details">
          <div>
            <dt>Empresa solicitada</dt>
            <dd>{scenario.organization.displayName}</dd>
          </div>
          <div>
            <dt>E-mail demonstrativo</dt>
            <dd>{request.applicantProfile.email}</dd>
          </div>
          <div>
            <dt>Telefone demonstrativo</dt>
            <dd>{request.applicantProfile.phone}</dd>
          </div>
          <div>
            <dt>Localidade</dt>
            <dd>
              {request.applicantProfile.city} / {request.applicantProfile.state}
            </dd>
          </div>
          <div>
            <dt>Data da solicitação (UTC)</dt>
            <dd>{requestDateFormatter.format(new Date(request.createdAtUtc))}</dd>
          </div>
          <div>
            <dt>Plano na solicitação</dt>
            <dd>{request.planAtSubmission}</dd>
          </div>
        </dl>

        <section className="membership-review-history" aria-labelledby="membership-history-title">
          <h3 id="membership-history-title">Histórico de análise</h3>
          {requestReviews.length > 0 ? (
            <ol>
              {requestReviews.map((review) => (
                <li key={review.id}>
                  <strong>{reviewActionLabels[review.action]}</strong>
                  <span>{requestDateFormatter.format(new Date(review.createdAtUtc))}</span>
                  {review.reason && <p>{review.reason}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <p>Nenhuma análise registrada.</p>
          )}
        </section>

        {error && (
          <p className="company-request-error" role="alert">
            {error}
          </p>
        )}

        {request.status === 'PENDING' && (
          <div className="membership-review-actions">
            {isReturning ? (
              <form className="membership-return-form" onSubmit={submitReturn}>
                <label htmlFor="membership-return-reason">Motivo do retorno</label>
                <textarea
                  autoComplete="off"
                  id="membership-return-reason"
                  maxLength={500}
                  minLength={10}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Descreva qual informação demonstrativa está ausente ou inconsistente."
                  required
                  value={reason}
                />
                <p>Não inclua documentos ou informações sensíveis. Limite de 500 caracteres.</p>
                <Button disabled={isSubmitting} type="submit">
                  Confirmar retorno
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsReturning(false);
                    setError(null);
                  }}
                  type="button"
                  variant="subtle"
                >
                  Cancelar
                </Button>
              </form>
            ) : (
              <>
                <Button
                  disabled={isSubmitting}
                  onClick={() => applyDecision('approve')}
                  type="button"
                >
                  Aprovar
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsReturning(true);
                    setError(null);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Retornar
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={() => applyDecision('reject')}
                  type="button"
                  variant="subtle"
                >
                  Rejeitar
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BusinessMembershipRequestsPage() {
  const { activeScenario } = useDemoScenario();
  const { state } = useDemoMembershipRequests();
  const [statusFilter, setStatusFilter] = useState<MembershipRequestStatus | 'ALL'>('ALL');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const scenario =
    activeScenario?.context === 'BUSINESS' &&
    activeScenario.session.organizationAdministrations.some(
      ({ organizationId, role }) =>
        organizationId === activeScenario.organization.id && role === 'ADMINISTRATOR',
    )
      ? activeScenario
      : null;

  if (!scenario) {
    return <Navigate to={routes.demoLoginBusiness} replace />;
  }

  const organizationRequests = getMembershipRequestsForOrganization(
    state,
    scenario.organization.id,
  );
  const filteredRequests =
    statusFilter === 'ALL'
      ? organizationRequests
      : organizationRequests.filter((request) => request.status === statusFilter);
  const selectedRequest = organizationRequests.find((request) => request.id === selectedRequestId);
  const pendingCount = organizationRequests.filter(
    (request) => request.status === 'PENDING',
  ).length;

  return (
    <DemoShell
      business
      title="Solicitações de adesão"
      subtitle={`Acompanhe pedidos destinados a ${scenario.organization.displayName}.`}
    >
      <section className="business-membership-requests" aria-labelledby="business-requests-title">
        <div className="business-membership-toolbar">
          <div>
            <h2 id="business-requests-title">Solicitações recebidas</h2>
            <p>
              {pendingCount} pendente{pendingCount === 1 ? '' : 's'} para análise.
            </p>
          </div>
          <label>
            Filtrar por status
            <select
              onChange={(event) =>
                setStatusFilter(event.target.value as MembershipRequestStatus | 'ALL')
              }
              value={statusFilter}
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="RETURNED">Retornado</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
            </select>
          </label>
        </div>

        {filteredRequests.length ? (
          <ul className="business-membership-list" aria-label="Solicitações da organização">
            {filteredRequests.map((request) => (
              <li key={request.id}>
                <Card as="article" className="business-membership-card">
                  <div className="business-membership-card-heading">
                    <div>
                      <h3>{request.applicantProfile.fullName}</h3>
                      <p>Código {request.applicantProfile.publicRegistrationCode}</p>
                    </div>
                    <Badge variant={statusVariants[request.status]}>
                      {statusLabels[request.status]}
                    </Badge>
                  </div>
                  <p>{scenario.organization.displayName}</p>
                  <p>
                    Solicitada em (UTC):{' '}
                    <strong>{requestDateFormatter.format(new Date(request.createdAtUtc))}</strong>
                  </p>
                  <Button
                    onClick={() => setSelectedRequestId(request.id)}
                    type="button"
                    variant="secondary"
                  >
                    Analisar solicitação
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="membership-request-empty-state">
            <p>
              {organizationRequests.length === 0
                ? 'Ainda não há solicitações destinadas a esta organização no cenário demonstrativo.'
                : 'Nenhuma solicitação corresponde ao filtro selecionado.'}
            </p>
          </Card>
        )}
      </section>
      {selectedRequest && (
        <RequestReviewDialog
          onClose={() => setSelectedRequestId(null)}
          request={selectedRequest}
          reviews={state.reviews}
          scenario={scenario}
        />
      )}
    </DemoShell>
  );
}
