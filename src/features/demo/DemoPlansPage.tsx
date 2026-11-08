import { ArrowLeft, Clock3, Coins, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../../shared/components/ui/Badge';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import type { DemoScenarioContext } from './mocks/demoScenarios';
import { getConsumerPlanPresentations } from './planPresentation';

const contextDetails = {
  CONSUMER: {
    name: 'Consumidor',
    returnLabel: 'Voltar à demonstração de Consumidor',
    returnPath: routes.demoConsumer,
  },
  BUSINESS: {
    name: 'Empresa',
    returnLabel: 'Voltar à demonstração de Empresa',
    returnPath: routes.demoBusiness,
  },
  BENEFICIARY: {
    name: 'Beneficiário',
    returnLabel: 'Voltar à apresentação de Beneficiário',
    returnPath: routes.demoBeneficiary,
  },
} as const satisfies Record<
  DemoScenarioContext,
  { name: string; returnLabel: string; returnPath: string }
>;

function getDemoContext(value: string | null): DemoScenarioContext | null {
  if (value === 'CONSUMER' || value === 'BUSINESS' || value === 'BENEFICIARY') {
    return value;
  }

  return null;
}

export function DemoPlansPage() {
  const [searchParams] = useSearchParams();
  const context = getDemoContext(searchParams.get('context'));

  if (!context) {
    return <Navigate to={routes.demo} replace />;
  }

  const details = contextDetails[context];
  const returnState = { demoContext: context };

  return (
    <main className="demo-plans-page" aria-labelledby="demo-plans-title">
      <header className="demo-plans-heading">
        <Badge variant="neutral">INFORMAÇÕES DEMONSTRATIVAS</Badge>
        <h1 id="demo-plans-title">Planos Vinkar</h1>
        <p>
          Contexto selecionado: <strong>{details.name}</strong>. Esta apresentação não altera seu
          cenário demonstrativo nem ativa uma assinatura.
        </p>
      </header>

      {context === 'CONSUMER' ? (
        <>
          <section aria-labelledby="consumer-plans-title">
            <h2 className="demo-plans-section-title" id="consumer-plans-title">
              Regras conhecidas para Consumidor
            </h2>
            <div className="demo-plan-grid">
              {getConsumerPlanPresentations().map((plan) => (
                <Card as="article" className="demo-plan-card" key={plan.plan}>
                  <h3>{plan.name}</h3>
                  <dl>
                    <div>
                      <dt>
                        <Coins size={17} aria-hidden="true" />
                        Validade dos pontos
                      </dt>
                      <dd>{plan.pointsValidity}</dd>
                    </div>
                    <div>
                      <dt>
                        <Clock3 size={17} aria-hidden="true" />
                        Saída da rede principal
                      </dt>
                      <dd>{plan.networkExit}</dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>
          </section>

          <Card as="section" className="demo-plan-restrictions" aria-labelledby="plan-limits-title">
            <div className="demo-plan-restrictions-heading">
              <ShieldCheck size={21} aria-hidden="true" />
              <h2 id="plan-limits-title">Regras gerais dos pontos</h2>
            </div>
            <ul>
              <li>Os pontos não podem ser sacados.</li>
              <li>Os pontos não podem ser transferidos.</li>
              <li>Os pontos não podem ser usados fora da Vinkar.</li>
            </ul>
            <p>A disponibilidade de benefícios depende das regras de elegibilidade.</p>
          </Card>
        </>
      ) : (
        <Card as="section" className="demo-plan-undetermined" aria-labelledby="plans-pending-title">
          <Badge variant="warning">DETALHES EM DEFINIÇÃO</Badge>
          <h2 id="plans-pending-title">Condições específicas ainda não definidas</h2>
          <p>
            Os detalhes comerciais para {details.name} ainda estão em definição. As políticas
            apresentadas para Consumidor não se aplicam automaticamente a este contexto.
          </p>
          <p>Nenhum plano pode ser contratado ou ativado nesta demonstração.</p>
        </Card>
      )}

      <Link
        className="ui-button ui-button--secondary demo-plans-back"
        to={details.returnPath}
        state={returnState}
        aria-label={details.returnLabel}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        {details.returnLabel}
      </Link>
    </main>
  );
}
