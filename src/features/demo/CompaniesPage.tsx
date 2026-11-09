import { useEffect, useRef, useState } from 'react';
import { Network, X } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Badge } from '../../shared/components/ui/Badge';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import type { MainCompanyMembershipRequest, SubscriptionPlan } from './domain/models';
import {
  getMembershipCapacity,
  type MembershipOperationFailureReason,
} from './domain/membershipRequests';
import {
  getDemoCompanies,
  getDirectCompanyConnections,
  type DemoCompany,
} from './mocks/companyNetwork';
import { DemoShell } from './DemoPages';
import { getConsumerPlanPresentations } from './planPresentation';
import { useDemoScenario } from './useDemoScenario';
import { useDemoMembershipRequests } from './useDemoMembershipRequests';
import { getOpenMembershipRequestForOrganization } from './membershipRequestSelectors';

const planNames: Readonly<Record<SubscriptionPlan, string>> = {
  FREE: 'Gratuito',
  PRO: 'Pro',
  PREMIUM: 'Premium',
};

const requestErrorMessages = {
  NOT_CONSUMER: 'Somente o cenário demonstrativo de Consumidor pode enviar uma solicitação.',
  ORGANIZATION_NOT_FOUND: 'A empresa selecionada não foi encontrada no catálogo.',
  PROFILE_NOT_FOUND: 'O perfil demonstrativo do Consumidor não foi encontrado.',
  PROFILE_IDENTITY_MISMATCH: 'O perfil não corresponde à identidade do Consumidor.',
  INVALID_PROFILE: 'Confira os dados demonstrativos antes de enviar a solicitação.',
  OPEN_REQUEST_EXISTS: 'Já existe uma solicitação aberta para esta empresa.',
  ALREADY_AFFILIATED: 'A identidade já possui vínculo com essa organização.',
  CAPACITY_REACHED: 'A capacidade do plano para empresas principais foi atingida.',
  REQUEST_NOT_FOUND: 'A solicitação não foi encontrada.',
  REQUEST_NOT_PENDING: 'A solicitação não está mais pendente.',
  REQUEST_NOT_RETURNED: 'A solicitação não está aguardando correção.',
  UNAUTHORIZED_ORGANIZATION: 'Esta identidade não pode analisar solicitações da organização.',
  ORGANIZATION_MISMATCH: 'A solicitação pertence a outra organização.',
  RETURN_REASON_REQUIRED: 'Informe o motivo do retorno.',
  RETURN_REASON_TOO_SHORT: 'O motivo deve ter pelo menos 10 caracteres.',
  RETURN_REASON_TOO_LONG: 'O motivo deve ter no máximo 500 caracteres.',
  COMMAND_ID_CONFLICT: 'O comando já foi utilizado em outra operação.',
} satisfies Record<MembershipOperationFailureReason, string>;

function CompanyCard({
  company,
  selected,
  onSelect,
}: {
  company: DemoCompany;
  selected: boolean;
  onSelect: () => void;
}) {
  const connectedCompanies = getDirectCompanyConnections(company.id);
  const [connectionsVisible, setConnectionsVisible] = useState(false);
  const connectionsId = `connections-${company.id}`;

  return (
    <Card as="article" className="company-catalog-card">
      <div className="company-catalog-card-heading">
        <span className="company-catalog-icon" aria-hidden="true">
          {company.symbol}
        </span>
        <Badge variant="neutral">Demonstração fictícia</Badge>
      </div>
      <p className="company-catalog-segment">{company.segmentLabel}</p>
      <h3>{company.displayName}</h3>
      <p className="company-catalog-description">{company.description}</p>
      <p className="company-catalog-count">
        <Network size={16} aria-hidden="true" />
        {connectedCompanies.length}{' '}
        {connectedCompanies.length === 1 ? 'conexão direta' : 'conexões diretas'}
      </p>
      <button
        aria-controls={selected ? 'company-conditions-dialog' : undefined}
        aria-expanded={selected}
        aria-haspopup="dialog"
        className="ui-button ui-button--secondary company-catalog-toggle"
        onClick={onSelect}
        type="button"
      >
        Conhecer condições
      </button>
      {connectedCompanies.length > 0 ? (
        <>
          <button
            aria-controls={connectionsId}
            aria-expanded={connectionsVisible}
            aria-label={`${connectionsVisible ? 'Ocultar' : 'Ver'} empresas conectadas a ${company.displayName}`}
            className="ui-button ui-button--secondary company-catalog-toggle"
            onClick={() => setConnectionsVisible((visible) => !visible)}
            type="button"
          >
            {connectionsVisible ? 'Ocultar empresas conectadas' : 'Ver empresas conectadas'}
          </button>
          <ul className="company-connections-list" hidden={!connectionsVisible} id={connectionsId}>
            {connectedCompanies.map((connectedCompany) => (
              <li key={connectedCompany.id}>
                <strong>{connectedCompany.displayName}</strong>
                <span>{connectedCompany.segmentLabel}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="company-catalog-empty">Nenhuma conexão direta cadastrada neste cenário.</p>
      )}
    </Card>
  );
}

function CompanyConditionsDialog({
  company,
  currentPlan,
  openRequest,
  canSubmit,
  requestError,
  onSubmitRequest,
  onClose,
}: {
  company: DemoCompany;
  currentPlan: SubscriptionPlan;
  openRequest: MainCompanyMembershipRequest | undefined;
  canSubmit: boolean;
  requestError: string | null;
  onSubmitRequest: () => void;
  onClose: () => void;
}) {
  const connectedCompanies = getDirectCompanyConnections(company.id);
  const planPresentations = getConsumerPlanPresentations();
  const companyRequest = openRequest?.organizationId === company.id ? openRequest : undefined;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

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

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href]',
      );
      const firstElement = focusableElements.item(0);
      const lastElement = focusableElements.item(focusableElements.length - 1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const focusIsOutside = !dialogRef.current.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === firstElement || focusIsOutside)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || focusIsOutside)) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div className="company-conditions-overlay">
      <div
        aria-labelledby="company-conditions-title"
        aria-modal="true"
        className="company-conditions-dialog"
        id="company-conditions-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="company-conditions-dialog-heading">
          <div>
            <p className="company-catalog-segment">{company.segmentLabel}</p>
            <h2 id="company-conditions-title">Condições demonstrativas</h2>
            <p>{company.displayName}</p>
          </div>
          <button
            aria-label="Fechar condições"
            className="company-conditions-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="company-conditions">
          <p>
            Plano demonstrativo atual: <strong>{planNames[currentPlan]}</strong> ({currentPlan}).
          </p>
          <h3>Carência de saída conforme o plano</h3>
          <ul className="company-plan-grace-periods">
            {planPresentations.map((plan) => (
              <li key={plan.plan}>
                <strong>
                  {plan.name} ({plan.plan}){plan.plan === currentPlan ? ' — plano atual' : ''}
                </strong>
                <span>{plan.networkExit}</span>
              </li>
            ))}
          </ul>
          <p className="company-activation-note">
            O prazo de carência começa somente depois da aprovação da empresa e da ativação do
            vínculo. A solicitação pendente não inicia esse prazo.
          </p>
          {connectedCompanies.length > 0 ? (
            <div className="company-conditions-connections">
              <h3>Conexões diretas</h3>
              <ul>
                {connectedCompanies.map((connectedCompany) => (
                  <li key={connectedCompany.id}>{connectedCompany.displayName}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="company-no-connections-warning" role="note">
              Esta empresa não tem conexões diretas no cenário demonstrativo. Isso não impede o
              envio da solicitação.
            </p>
          )}
          {requestError && (
            <p className="company-request-error" role="alert">
              {requestError}
            </p>
          )}
          {companyRequest ? (
            <p className="company-request-status" role="status">
              {companyRequest.status === 'RETURNED'
                ? 'Esta solicitação retornou para correção. Acompanhe os detalhes em Minhas solicitações.'
                : 'Aguardando aprovação da empresa. Nenhum vínculo foi ativado.'}
            </p>
          ) : canSubmit ? (
            <button
              className="ui-button ui-button--primary company-request-submit"
              onClick={onSubmitRequest}
              type="button"
            >
              Enviar solicitação demonstrativa
            </button>
          ) : (
            <p className="company-request-status" role="status">
              A capacidade de empresas principais deste plano foi atingida.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CompaniesPage() {
  const { activeScenario } = useDemoScenario();
  const { state, submitRequest } = useDemoMembershipRequests();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const scenario =
    activeScenario?.context === 'CONSUMER' &&
    activeScenario.session.activePersonalProfile === 'CONSUMER'
      ? activeScenario
      : null;

  if (!scenario || !scenario.session.subscriptionPlan) {
    return <Navigate to={routes.demoLoginConsumer} replace />;
  }

  const consumerScenario = scenario;
  const currentPlan = consumerScenario.session.subscriptionPlan;
  const capacity = getMembershipCapacity(
    state,
    consumerScenario.session.personIdentity.id,
    currentPlan,
  );
  const selectedCompany = selectedCompanyId
    ? getDemoCompanies().find((company) => company.id === selectedCompanyId)
    : undefined;

  function handleRequest(company: DemoCompany) {
    const result = submitRequest({
      scenario: consumerScenario,
      organizationId: company.id,
      requestedAt: new Date(),
    });

    setRequestError(result.success ? null : requestErrorMessages[result.reason]);
  }

  return (
    <DemoShell
      business={false}
      title="Empresas e conexões"
      subtitle="Conheça os estabelecimentos e as conexões diretas do catálogo demonstrativo."
    >
      <section className="company-catalog" aria-labelledby="company-catalog-title">
        <h2 id="company-catalog-title">Catálogo de empresas</h2>
        <ul className="company-catalog-grid" aria-label="Empresas demonstrativas">
          {getDemoCompanies().map((company) => (
            <li key={company.id}>
              <CompanyCard
                company={company}
                selected={selectedCompanyId === company.id}
                onSelect={() => {
                  setSelectedCompanyId(company.id);
                  setRequestError(null);
                }}
              />
            </li>
          ))}
        </ul>
      </section>
      {selectedCompany && (
        <CompanyConditionsDialog
          company={selectedCompany}
          currentPlan={currentPlan}
          openRequest={getOpenMembershipRequestForOrganization(
            state,
            consumerScenario.session.personIdentity.id,
            selectedCompany.id,
          )}
          canSubmit={capacity.available > 0}
          requestError={requestError}
          onSubmitRequest={() => handleRequest(selectedCompany)}
          onClose={() => {
            setSelectedCompanyId(null);
            setRequestError(null);
          }}
        />
      )}
      <Card as="section" className="company-catalog-notice" aria-label="Aviso sobre conexões">
        As empresas e conexões exibidas são fictícias e não representam parcerias comerciais reais.
        Uma conexão não significa elegibilidade automática para campanhas ou benefícios.
      </Card>
      <Link
        className="ui-button ui-button--secondary company-catalog-back"
        to={routes.demoConsumer}
        state={{ demoContext: 'CONSUMER' }}
      >
        Voltar à visão geral
      </Link>
    </DemoShell>
  );
}
