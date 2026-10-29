import { Link } from 'react-router-dom';
import { landingSections, routes } from '../../../shared/config/routes';
import { BrandMark } from '../../../shared/components/ui/BrandMark';

const footerNavigation = [
  [landingSections.about, 'Sobre'],
  [landingSections.solutions, 'Soluções'],
  [landingSections.clients, 'Clientes'],
  [landingSections.values, 'Missão, Visão e Valores'],
  [landingSections.contact, 'Contato'],
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-container site-footer-grid">
          <div>
            <a className="site-brand site-footer-brand" href={`#${landingSections.home}`}>
              <BrandMark />
              <span>Vinkar</span>
            </a>
            <p>Conexões que geram mais.</p>
            <p className="site-footer-note">
              Uma rede em construção para transformar conexões em oportunidades.
            </p>
          </div>
          <div className="site-footer-links">
            <h2>Navegue</h2>
            {footerNavigation.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
            <Link to={routes.demoBenefits}>Conheça a demonstração</Link>
          </div>
          <div className="site-footer-links">
            <h2>Informações</h2>
            <p>Termos de uso e política de privacidade: pendentes de publicação.</p>
            <p>Contato oficial e redes sociais: pendentes de confirmação.</p>
          </div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <div className="site-container">
          <span>© {new Date().getFullYear()} Vinkar. Todos os direitos reservados.</span>
          <a href={`#${landingSections.home}`}>Voltar ao início ↑</a>
        </div>
      </div>
    </footer>
  );
}
