import { ArrowRight, Clock3, Coins } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routes, landingSections } from '../../../shared/config/routes';
import { getConsumerPlanPresentations } from '../../demo/planPresentation';

type PlanContext = 'CONSUMER' | 'BUSINESS' | 'BENEFICIARY';

const contexts: readonly { id: PlanContext; label: string }[] = [
  { id: 'CONSUMER', label: 'Consumidor' },
  { id: 'BUSINESS', label: 'Empresa' },
  { id: 'BENEFICIARY', label: 'Beneficiário' },
];

export function PlansSection() {
  const [selectedContext, setSelectedContext] = useState<PlanContext>('CONSUMER');

  return (
    <section
      aria-labelledby="site-plans-title"
      className="site-section site-plans"
      id={landingSections.plans}
    >
      <div className="site-container">
        <div className="site-plans-heading">
          <span className="site-overline">Informações preliminares</span>
          <h2 id="site-plans-title">Planos Vinkar</h2>
          <p>Consulte as informações disponíveis para cada contexto.</p>
        </div>

        <div className="site-plans-contexts" role="group" aria-label="Contexto dos planos">
          {contexts.map(({ id, label }) => (
            <button
              aria-pressed={selectedContext === id}
              className="site-plans-context"
              key={id}
              onClick={() => setSelectedContext(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {selectedContext === 'CONSUMER' && (
          <div className="site-plans-grid" aria-labelledby="site-plans-title">
            {getConsumerPlanPresentations().map((plan) => (
              <article className="site-plan-card" key={plan.plan}>
                <h3>{plan.name}</h3>
                <p className="site-plan-price">Valor a definir</p>
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
              </article>
            ))}
          </div>
        )}

        {selectedContext === 'BUSINESS' && (
          <article className="site-plan-context-note" aria-labelledby="business-plans-title">
            <h3 id="business-plans-title">Planos empresariais em definição</h3>
            <p className="site-plan-price">Condições em definição</p>
            <p>
              Os planos Gratuito, Pro e Premium estão previstos. Recursos específicos, valores e
              condições comerciais ainda serão definidos para Empresas.
            </p>
          </article>
        )}

        {selectedContext === 'BENEFICIARY' && (
          <article className="site-plan-context-note" aria-labelledby="beneficiary-plans-title">
            <h3 id="beneficiary-plans-title">Benefícios vinculados à organização</h3>
            <p className="site-plan-price">Condições em definição</p>
            <p>
              O acesso aos benefícios corporativos depende do vínculo com a organização. A aplicação
              dos planos e suas condições específicas ainda será definida.
            </p>
            <p>Não há assinatura individual ou vantagem específica definida para Beneficiários.</p>
          </article>
        )}

        <div className="site-plans-footer">
          <p>Condições preliminares, sujeitas à homologação.</p>
          <Link className="site-button site-button-soft" to={routes.demo}>
            Conhecer demonstração <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
