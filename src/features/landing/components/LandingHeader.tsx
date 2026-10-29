import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { landingSections, routes } from '../../../shared/config/routes';
import { BrandMark } from './BrandMark';

const navigation = [
  [landingSections.home, 'Início'],
  [landingSections.about, 'Sobre'],
  [landingSections.solutions, 'Soluções'],
  [landingSections.clients, 'Clientes'],
  [landingSections.values, 'Missão, Visão e Valores'],
  [landingSections.contact, 'Contato'],
] as const;

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="site-brand" href={`#${landingSections.home}`} onClick={closeMenu}>
          <BrandMark />
          <span>Vinkar</span>
        </a>
        <button
          className="site-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Fechar menu principal' : 'Abrir menu principal'}
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav
          className={`site-navigation${menuOpen ? ' is-open' : ''}`}
          id="site-navigation"
          aria-label="Navegação principal"
        >
          {navigation.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={closeMenu}>
              {label}
            </a>
          ))}
          <div className="site-header-actions">
            <Link
              className="site-button site-button-outline"
              to={routes.demoLogin}
              onClick={closeMenu}
            >
              Entrar
            </Link>
            <Link
              className="site-button site-button-primary"
              to={routes.demoBenefits}
              onClick={closeMenu}
            >
              Comece agora <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
