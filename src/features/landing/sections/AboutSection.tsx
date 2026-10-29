import { ArrowRight, Heart, Network, TrendingUp, Workflow } from 'lucide-react';
import { landingSections } from '../../../shared/config/routes';

const concepts = [
  {
    title: 'Conexão',
    description: 'Pessoas e empresas mais próximas.',
    icon: Network,
    tone: 'purple',
  },
  {
    title: 'Distribuição',
    description: 'Benefícios que geram valor para todos.',
    icon: Workflow,
    tone: 'blue',
  },
  {
    title: 'Crescimento',
    description: 'Quanto mais conectados, mais fortes.',
    icon: TrendingUp,
    tone: 'cyan',
  },
  {
    title: 'Harmonia',
    description: 'Um ecossistema que busca fazer bem para todos.',
    icon: Heart,
    tone: 'coral',
  },
] as const;

export function AboutSection() {
  return (
    <section className="site-section site-about" id={landingSections.about}>
      <div className="site-container">
        <div className="site-section-heading">
          <span className="site-overline">Nossa história</span>
          <h2>Uma ideia que cresceu como uma árvore</h2>
        </div>
        <div className="site-about-grid">
          <div className="site-about-story">
            <p>
              A Vinkar nasceu de um sonho compartilhado por quatro amigos: Leo, Felipe, Rhuan e
              Henrique. Cada um com habilidades diferentes, todos com o mesmo propósito: transformar
              custos em benefícios para pessoas e empresas por meio de uma rede forte.
            </p>
            <p>
              Em um dia ensolarado, ao observar uma árvore, eles perceberam como raízes, tronco e
              galhos se conectam e distribuem recursos. Juntos, tornam o conjunto mais forte, bonito
              e vibrante. Essa harmonia inspirou a visão da Vinkar.
            </p>
            <p>
              Acreditamos que conexões bem cuidadas podem transformar despesas cotidianas em
              oportunidades compartilhadas.
            </p>
            <a className="site-text-link" href={`#${landingSections.values}`}>
              Conheça o que nos move <ArrowRight size={16} aria-hidden="true" />
            </a>
            <div className="site-founder-note">
              <img
                src="/images/about/founders-illustration.webp"
                alt="Ilustração conceitual de quatro amigos olhando juntos para o horizonte; não representa retratos dos fundadores"
                loading="lazy"
                decoding="async"
              />
              <span>Quatro amigos, habilidades diferentes e um sonho compartilhado.</span>
            </div>
          </div>
          <figure className="site-about-image">
            <img
              src="/images/about/tree-detail.webp"
              alt="Luz do sol atravessando os galhos de uma árvore, inspiração para a história da Vinkar"
              loading="lazy"
              decoding="async"
            />
            <figcaption>Raízes fortes. Conexões vivas. Crescimento compartilhado.</figcaption>
          </figure>
          <div className="site-concepts" aria-label="Conceitos que inspiram a Vinkar">
            {concepts.map(({ title, description, icon: Icon, tone }) => (
              <article className="site-concept" key={title}>
                <span className={`site-concept-icon ${tone}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
