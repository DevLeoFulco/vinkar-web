import { ArrowLeft, Building2, CircleHelp, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';

export function DemoBeneficiaryPage() {
  return (
    <main className="demo-beneficiary-page" aria-labelledby="beneficiary-title">
      <header className="demo-beneficiary-heading">
        <span className="ui-badge ui-badge--neutral">CONTEXTO DEMONSTRATIVO</span>
        <h1 id="beneficiary-title">Beneficiário</h1>
        <p>
          Uma pessoa pode ter um vínculo com uma organização sem que isso altere sua identidade
          pessoal.
        </p>
      </header>

      <div className="demo-beneficiary-grid">
        <Card as="article" className="demo-beneficiary-card">
          <UserRound size={24} aria-hidden="true" />
          <h2>Identidade pessoal</h2>
          <p>O Beneficiário é uma pessoa com identidade própria, separada da organização.</p>
        </Card>
        <Card as="article" className="demo-beneficiary-card">
          <Building2 size={24} aria-hidden="true" />
          <h2>Vínculo demonstrativo</h2>
          <p>A demonstração ilustra um vínculo com uma organização, sem validar sua existência.</p>
        </Card>
        <Card as="article" className="demo-beneficiary-card">
          <CircleHelp size={24} aria-hidden="true" />
          <h2>Regras ainda em definição</h2>
          <p>
            A disponibilidade de benefícios depende das regras da empresa e da Vinkar, ainda em
            definição. Esta demonstração não confirma vínculo ou elegibilidade real.
          </p>
        </Card>
      </div>

      <Link className="ui-button ui-button--secondary demo-beneficiary-back" to={routes.demo}>
        <ArrowLeft size={17} aria-hidden="true" />
        Voltar à seleção de contextos
      </Link>
    </main>
  );
}
