import { useEffect, useState } from 'react';
import { ArrowRight, CircleHelp, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { landingSections, routes } from '../../shared/config/routes';
import { BrandMark } from '../../shared/components/ui/BrandMark';
import { useDemoScenario } from './useDemoScenario';

export function DemoBrand() {
  return (
    <NavLink
      className="brand"
      to={`${routes.home}#${landingSections.home}`}
      aria-label="Vinkar — voltar ao início da Vinkar"
    >
      <BrandMark />
      <span>
        Vinkar
        <small>CONEXÕES QUE GERAM MAIS</small>
      </span>
    </NavLink>
  );
}

export function DemoHeader() {
  const { activeScenario } = useDemoScenario();
  const [menuOpen, setMenuOpen] = useState(false);
  const benefitsDestination =
    activeScenario?.context === 'CONSUMER' ? routes.demoBenefits : routes.demoLoginConsumer;
  const entryDestination =
    activeScenario?.context === 'CONSUMER'
      ? routes.demoLoginConsumer
      : activeScenario?.context === 'BUSINESS'
        ? routes.demoLoginBusiness
        : activeScenario?.context === 'BENEFICIARY'
          ? routes.demoLoginBeneficiary
          : routes.demo;
  const plansDestination =
    activeScenario?.context === 'CONSUMER'
      ? routes.demoPlansConsumer
      : activeScenario?.context === 'BUSINESS'
        ? routes.demoPlansBusiness
        : routes.demoPlansBeneficiary;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="top">
      <div className="topinner">
        <DemoBrand />
        <button
          className="mobile-menu"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Fechar menu da demonstração' : 'Abrir menu da demonstração'}
          aria-expanded={menuOpen}
          aria-controls="demo-navigation"
        >
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
        <nav
          className={menuOpen ? 'open' : ''}
          id="demo-navigation"
          aria-label="Navegação da demonstração"
        >
          <NavLink
            to={benefitsDestination}
            state={activeScenario?.context === 'CONSUMER' ? { demoContext: 'CONSUMER' } : undefined}
            onClick={closeMenu}
          >
            Explorar benefícios
          </NavLink>
          <NavLink to={routes.demoLoginConsumer} onClick={closeMenu}>
            Sou consumidor
          </NavLink>
          <NavLink to={routes.demoLoginBusiness} onClick={closeMenu}>
            Sou empresa
          </NavLink>
          {activeScenario && (
            <NavLink to={plansDestination} onClick={closeMenu}>
              Planos
            </NavLink>
          )}
          <NavLink
            className="navbutton ui-button ui-button--primary"
            to={entryDestination}
            onClick={closeMenu}
          >
            Entrar <ArrowRight size={16} aria-hidden="true" />
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export function DemoNotice() {
  const { activeScenario } = useDemoScenario();

  return (
    <div className="notice" role="note">
      <CircleHelp size={15} aria-hidden="true" />
      <span>
        Ambiente de demonstração: empresas, benefícios, pontos e operações são fictícios. Nenhum
        dado é salvo em servidor.
      </span>
      {activeScenario && (
        <span className="demo-active-scenario" aria-live="polite">
          Cenário ativo: {activeScenario.title}
        </span>
      )}
    </div>
  );
}

export function DemoFooter() {
  return (
    <footer className="demo-footer">
      <div className="container footerinner">
        <span>
          Vinkar <small>Conexões que geram mais.</small>
        </span>
        <span>Protótipo de validação • {new Date().getFullYear()}</span>
        <NavLink to={routes.home}>Voltar ao site institucional</NavLink>
      </div>
    </footer>
  );
}
