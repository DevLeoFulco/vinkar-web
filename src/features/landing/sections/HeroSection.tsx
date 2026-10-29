import { ArrowRight, Building2, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { landingSections, routes } from '../../../shared/config/routes';

export function HeroSection() {
  return (
    <section className="site-hero" id={landingSections.home} aria-labelledby="hero-title">
      <img
        className="site-hero-image"
        src="/images/hero/hero-tree-sunset.webp"
        width={536}
        height={242}
        alt="Árvore iluminada pelo sol ao entardecer, símbolo de conexão e crescimento"
        fetchPriority="high"
      />
      <div className="site-hero-shade" />
      <div className="site-container site-hero-content">
        <span className="site-eyebrow">Conectando pessoas. Fortalecendo negócios.</span>
        <h1 id="hero-title">
          Todos os seus custos podem se transformar em <em>benefícios.</em>
        </h1>
        <p>
          A Vinkar conecta pessoas e empresas em uma rede inteligente de benefícios, parcerias e
          oportunidades.
        </p>
        <div className="site-profile-cards">
          <Link className="site-profile-card consumer" to={routes.demoBenefits}>
            <img src="/images/cta/cta-consumidor.webp" alt="" />
            <span className="site-profile-icon">
              <UserRound size={20} aria-hidden="true" />
            </span>
            <span className="site-profile-copy">
              <strong>Sou consumidor</strong>
              <small>Conheça a demonstração de benefícios.</small>
            </span>
            <span className="site-profile-arrow">
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>
          <Link className="site-profile-card business" to={routes.demoBusiness}>
            <img src="/images/cta/cta-empresa.webp" alt="" />
            <span className="site-profile-icon">
              <Building2 size={20} aria-hidden="true" />
            </span>
            <span className="site-profile-copy">
              <strong>Sou empresa</strong>
              <small>Explore as telas demonstrativas.</small>
            </span>
            <span className="site-profile-arrow">
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>
        </div>
        <p className="site-hero-slogan">Conexões que geram mais.</p>
        <Link className="site-hero-more" to={routes.demoBenefits}>
          Conheça a demonstração <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
