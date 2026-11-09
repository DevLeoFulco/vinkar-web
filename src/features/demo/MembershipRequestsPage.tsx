import { Link, Navigate } from 'react-router-dom';
import { Badge } from '../../shared/components/ui/Badge';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import { DemoShell } from './DemoPages';
import { getPendingMainCompanyRequest } from './membershipRequestSelectors';
import { getDemoCompany } from './mocks/companyNetwork';
import { useDemoMembershipRequests } from './useDemoMembershipRequests';
import { useDemoScenario } from './useDemoScenario';

const requestDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export function MembershipRequestsPage() {
  const { activeScenario } = useDemoScenario();
  const { pendingRequests } = useDemoMembershipRequests();
  const scenario =
    activeScenario?.context === 'CONSUMER' &&
    activeScenario.session.activePersonalProfile === 'CONSUMER'
      ? activeScenario
      : null;

  if (!scenario) {
    return <Navigate to={routes.demoLoginConsumer} replace />;
  }

  const request = getPendingMainCompanyRequest(pendingRequests, scenario.session.personIdentity.id);
  const company = request ? getDemoCompany(request.organizationId) : undefined;

  return (
    <DemoShell
      business={false}
      title="Minhas solicitações"
      subtitle="Acompanhe as solicitações demonstrativas pendentes da sua identidade."
    >
      <Card as="section" className="membership-request-panel" aria-labelledby="membership-title">
        <div className="membership-request-heading">
          <div>
            <h2 id="membership-title">Solicitações pendentes</h2>
            <p>
              Este cenário acompanha somente solicitações pendentes; decisões e solicitações
              concluídas não são registradas.
            </p>
          </div>
          <Badge variant={request ? 'warning' : 'neutral'}>
            {request ? '1 pendente' : 'Nenhuma pendente'}
          </Badge>
        </div>

        {request ? (
          <article className="membership-request-item">
            <div className="membership-request-item-heading">
              <div>
                <span className="membership-request-label">Empresa principal solicitada</span>
                <h3>{company?.displayName ?? 'Empresa não identificada no catálogo'}</h3>
              </div>
              <Badge variant="warning">Aguardando aprovação</Badge>
            </div>
            <p>
              Solicitada em (UTC):{' '}
              <strong>{requestDateFormatter.format(new Date(request.createdAtUtc))}</strong>
            </p>
            <p className="membership-request-note">
              A solicitação não ativa um vínculo nem inicia a carência de saída da rede.
            </p>
          </article>
        ) : (
          <div className="membership-request-empty">
            <p>Você ainda não possui solicitações pendentes neste cenário.</p>
            <Link
              className="ui-button ui-button--secondary"
              to={routes.demoCompanies}
              state={{ demoContext: 'CONSUMER' }}
            >
              Conhecer empresas
            </Link>
          </div>
        )}
      </Card>
    </DemoShell>
  );
}
