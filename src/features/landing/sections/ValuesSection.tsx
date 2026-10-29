import { Eye, HeartHandshake, Target } from 'lucide-react';
import { landingSections } from '../../../shared/config/routes';

const values = [
  {
    title: 'Missão',
    description:
      'Conectar pessoas e empresas para transformar despesas cotidianas em oportunidades e benefícios.',
    image: 'missao.webp',
    alt: 'Paisagem ao amanhecer, representando um caminho de possibilidades',
    icon: Target,
  },
  {
    title: 'Visão',
    description:
      'Construir uma rede de benefícios e parcerias reconhecida pela confiança, inovação e impacto positivo.',
    image: 'visao.webp',
    alt: 'Pessoa olhando para o horizonte, representando uma visão de futuro',
    icon: Eye,
  },
  {
    title: 'Valores',
    description:
      'Conexão, transparência, inovação responsável, colaboração, respeito e compromisso com benefícios reais.',
    image: 'valores.webp',
    alt: 'Pedras equilibradas em uma paisagem natural, representando valores e harmonia',
    icon: HeartHandshake,
  },
] as const;

export function ValuesSection() {
  return (
    <section className="site-section site-values" id={landingSections.values}>
      <div className="site-container">
        <div className="site-values-heading">
          <div>
            <span className="site-overline">O que nos move</span>
            <h2>Missão, Visão e Valores</h2>
            <p>Princípios que guiam nossas escolhas e fortalecem nosso propósito.</p>
          </div>
        </div>
        <div className="site-values-grid">
          {values.map(({ title, description, image, alt, icon: Icon }) => (
            <article className="site-value-card" key={title}>
              <img src={`/images/values/${image}`} alt={alt} loading="lazy" decoding="async" />
              <div className="site-value-content">
                <span className="site-value-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
