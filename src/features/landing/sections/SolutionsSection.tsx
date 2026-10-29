import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { landingSections, routes } from '../../../shared/config/routes';

const solutions = [
  {
    title: 'Benefícios exclusivos',
    description:
      'Uma proposta para reunir vantagens e apoiar a transformação de gastos em benefícios.',
    image: 'solucao-beneficios.webp',
    alt: 'Ilustração conceitual de uma interface de benefícios em um celular',
    link: routes.demoBenefits,
    linkText: 'Para consumidores',
    tone: 'purple',
  },
  {
    title: 'Campanhas personalizadas',
    description: 'Uma visão demonstrativa de campanhas pensadas para diferentes objetivos.',
    image: 'solucao-campanhas.webp',
    alt: 'Ilustração conceitual de gerenciamento de campanhas em um computador',
    link: routes.demoCampaigns,
    linkText: 'Para empresas',
    tone: 'blue',
  },
  {
    title: 'Carteira de benefícios',
    description: 'Uma proposta para visualizar pontos e movimentações de forma clara.',
    image: 'solucao-carteira.webp',
    alt: 'Ilustração conceitual de carteira digital de benefícios',
    link: routes.demoWallet,
    linkText: 'Saiba mais',
    tone: 'cyan',
  },
  {
    title: 'Rede de parcerias',
    description: 'Uma visão de como empresas de diferentes segmentos podem se conectar.',
    image: 'solucao-parcerias.webp',
    alt: 'Imagem conceitual de uma parceria empresarial',
    link: routes.demoPartners,
    linkText: 'Saiba mais',
    tone: 'orange',
  },
  {
    title: 'Gestão empresarial',
    description: 'Uma proposta de gestão para apoiar a organização de campanhas e benefícios.',
    image: 'solucao-gestao.webp',
    alt: 'Ilustração conceitual de uma interface de gestão empresarial',
    link: routes.demoBusiness,
    linkText: 'Saiba mais',
    tone: 'purple',
  },
] as const;

export function SolutionsSection() {
  return (
    <section className="site-section site-solutions" id={landingSections.solutions}>
      <div className="site-container">
        <div className="site-solutions-heading">
          <div>
            <span className="site-overline">Nossas soluções</span>
            <h2>Uma plataforma pensada para todos os lados da rede</h2>
            <p>Conheça as frentes que estamos construindo para conectar e gerar oportunidades.</p>
          </div>
          <Link className="site-button site-button-soft" to={routes.demoBenefits}>
            Ver demonstração <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="site-solution-grid">
          {solutions.map((solution) => (
            <article className={`site-solution-card ${solution.tone}`} key={solution.title}>
              <img
                src={`/images/solutions/${solution.image}`}
                alt={solution.alt}
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3>{solution.title}</h3>
                <p>{solution.description}</p>
                <Link to={solution.link}>
                  {solution.linkText} <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <small className="site-concept-note">
                  Prévia conceitual — não representa serviço operacional.
                </small>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
