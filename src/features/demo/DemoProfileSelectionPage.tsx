import { ArrowRight, BriefcaseBusiness, Building2, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import {
  getDemoScenariosByContext,
  type DemoScenario,
  type DemoScenarioContext,
} from './mocks/demoScenarios';

type ProfileOption = Readonly<{
  context: DemoScenarioContext;
  description: string;
  destination: string;
  planDestination: string;
  registrationDestination?: string;
  Icon: LucideIcon;
}>;

const profileOptions: readonly ProfileOption[] = [
  {
    context: 'CONSUMER',
    description: 'Descubra empresas, conexões e benefícios.',
    destination: routes.demoLoginConsumer,
    planDestination: routes.demoPlansConsumer,
    registrationDestination: routes.demoConsumerRegistration,
    Icon: UserRound,
  },
  {
    context: 'BUSINESS',
    description: 'Conheça campanhas, redes e parcerias.',
    destination: routes.demoLoginBusiness,
    planDestination: routes.demoPlansBusiness,
    Icon: Building2,
  },
  {
    context: 'BENEFICIARY',
    description: 'Explore o conceito de benefícios corporativos.',
    destination: routes.demoLoginBeneficiary,
    planDestination: routes.demoPlansBeneficiary,
    Icon: BriefcaseBusiness,
  },
];

function findScenario(context: DemoScenarioContext): DemoScenario {
  const scenario = getDemoScenariosByContext(context)[0];
  if (!scenario) {
    throw new Error(`Cenário demonstrativo ausente para o contexto ${context}.`);
  }

  return scenario;
}

export function DemoProfileSelectionPage() {
  return (
    <main className="demo-profile-selection" aria-labelledby="demo-profile-title">
      <header className="demo-profile-intro">
        <span className="ui-badge ui-badge--neutral">AMBIENTE DE DEMONSTRAÇÃO</span>
        <h1 id="demo-profile-title">Uma Vinkar, diferentes experiências</h1>
        <p>Escolha um contexto para explorar o MVP demonstrativo.</p>
      </header>

      <div className="demo-profile-grid">
        {profileOptions.map(
          ({
            context,
            description,
            destination,
            planDestination,
            registrationDestination,
            Icon,
          }) => {
            const scenario = findScenario(context);

            return (
              <Card as="article" className="demo-profile-card" key={scenario.id}>
                <span className={`demo-profile-icon demo-profile-icon--${context.toLowerCase()}`}>
                  <Icon size={25} aria-hidden="true" />
                </span>
                <h2>{scenario.title}</h2>
                <p>{description}</p>
                <Link className="ui-button ui-button--primary demo-profile-action" to={destination}>
                  Continuar como {scenario.title.toLowerCase()}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link className="demo-profile-plans-link" to={planDestination}>
                  Informações de planos
                </Link>
                {registrationDestination && (
                  <Link className="demo-profile-registration-link" to={registrationDestination}>
                    Criar perfil demonstrativo
                  </Link>
                )}
              </Card>
            );
          },
        )}
      </div>
    </main>
  );
}
