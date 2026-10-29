import { Building2 } from 'lucide-react';
import { landingSections } from '../../../shared/config/routes';

const segments = [
  ['Barbearia', 'segmento-barbearia.webp', 'Ilustração genérica de uma barbearia'],
  ['Supermercado', 'segmento-supermercado.webp', 'Ilustração genérica de um supermercado'],
  ['Academia', 'segmento-academia.webp', 'Ilustração genérica de uma academia'],
  [
    'Provedora de internet',
    'segmento-internet.webp',
    'Ilustração genérica de um equipamento de internet',
  ],
] as const;

export function SegmentsSection() {
  return (
    <section className="site-section site-segments" id={landingSections.clients}>
      <div className="site-container site-segments-layout">
        <div className="site-segments-heading">
          <span className="site-overline">Segmentos em validação</span>
          <h2>Conexões começam com diferentes negócios</h2>
          <p>Segmentos considerados para a fase inicial de validação da proposta da Vinkar.</p>
          <span className="site-validation-label">
            <Building2 size={16} aria-hidden="true" />
            Negócios participantes da fase de validação
          </span>
        </div>
        <div className="site-segment-grid">
          {segments.map(([name, image, alt]) => (
            <article className="site-segment-card" key={name}>
              <img src={`/images/segments/${image}`} alt={alt} loading="lazy" decoding="async" />
              <h3>{name}</h3>
              <span>Segmento em validação</span>
            </article>
          ))}
        </div>
        <p className="site-segments-disclaimer">
          Imagens ilustrativas. Nenhuma marca ou parceria específica é apresentada nesta etapa.
        </p>
      </div>
    </section>
  );
}
