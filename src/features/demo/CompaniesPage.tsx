import { useState } from 'react';
import { Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../shared/components/ui/Badge';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import {
  getDemoCompanies,
  getDirectCompanyConnections,
  type DemoCompany,
} from './mocks/companyNetwork';
import { DemoShell } from './DemoPages';

function CompanyCard({ company }: { company: DemoCompany }) {
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

export function CompaniesPage() {
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
              <CompanyCard company={company} />
            </li>
          ))}
        </ul>
      </section>
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
