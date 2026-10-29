import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  ArrowRight,
  Coins,
  Gift,
  LayoutDashboard,
  LogIn,
  Megaphone,
  Network,
  Wallet,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { routes } from '../../shared/config/routes';
import { demoCampaigns } from './demoData';

const consumerNavigation = [
  [routes.demoConsumer, 'Visão geral', LayoutDashboard],
  [routes.demoBenefits, 'Benefícios', Gift],
  [routes.demoWallet, 'Minha carteira', Wallet],
] as const;

const businessNavigation = [
  [routes.demoBusiness, 'Visão geral', LayoutDashboard],
  [routes.demoCampaigns, 'Campanhas', Megaphone],
  [routes.demoPartners, 'Parcerias', Network],
] as const;

type DemoShellProps = {
  business: boolean;
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function DemoShell({ business, children, title, subtitle }: DemoShellProps) {
  const links = business ? businessNavigation : consumerNavigation;

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <span className="side-title">{business ? 'ÁREA DA EMPRESA' : 'ÁREA DO CONSUMIDOR'}</span>
        {links.map(([url, label, Icon]) => (
          <NavLink
            key={url}
            to={url}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
          >
            <Icon size={19} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        <div className="side-bottom">
          <span className="avatar">{business ? 'BH' : 'VC'}</span>
          <span>
            {business ? 'Empresa demonstrativa' : 'Visitante demonstrativo'}
            <small>Dados simulados</small>
          </span>
        </div>
      </aside>
      <div className="workspace">
        <div className="page-heading">
          <div>
            <span className="kicker">{business ? 'PAINEL EMPRESARIAL' : 'MINHA VINKAR'}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <span className="demo-pill">● Modo demonstração</span>
        </div>
        {children}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function BenefitsGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className="cards two">
      {demoCampaigns.slice(0, compact ? 2 : 4).map((campaign, index) => (
        <article className="benefit" key={campaign.id}>
          <div className={`benefit-cover cover${index}`}>
            <span aria-hidden="true">{['✂️', '🏋️', '🛒', '🌐'][index]}</span>
            <small>{campaign.segment}</small>
          </div>
          <div className="benefit-body">
            <span className="tag">{campaign.status}</span>
            <h3>{campaign.title}</h3>
            <p>{campaign.description}</p>
            <div className="benefit-foot">
              <small>{campaign.business}</small>
              <span>Ver detalhes →</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function ConsumerPage() {
  return (
    <DemoShell
      business={false}
      title="Olá, que bom ter você aqui!"
      subtitle="Suas oportunidades em um só lugar."
    >
      <div className="cards three">
        <Metric
          label="Saldo de pontos"
          value="1.250"
          note="Saldo fictício"
          icon={<Coins size={20} />}
        />
        <Metric
          label="Benefícios disponíveis"
          value="04"
          note="Conheça as oportunidades"
          icon={<Gift size={20} />}
        />
        <Metric
          label="Parceiros na rede"
          value="04"
          note="Segmentos diferentes"
          icon={<Network size={20} />}
        />
      </div>
      <div className="sectionline">
        <h2>Benefícios em destaque</h2>
        <NavLink to={routes.demoBenefits}>Ver todos →</NavLink>
      </div>
      <BenefitsGrid compact />
    </DemoShell>
  );
}

export function BenefitsPage() {
  return (
    <DemoShell
      business={false}
      title="Explore benefícios"
      subtitle="Descubra oportunidades dos nossos parceiros demonstrativos."
    >
      <BenefitsGrid />
    </DemoShell>
  );
}

export function WalletPage() {
  const statements = [
    ['+ 500', 'Campanha de boas-vindas', 'Crédito simulado'],
    ['+ 900', 'Participação em benefício', 'Crédito simulado'],
    ['− 150', 'Resgate de demonstração', 'Débito simulado'],
  ];

  return (
    <DemoShell
      business={false}
      title="Minha carteira"
      subtitle="Seus pontos e movimentações, com transparência."
    >
      <div className="wallet-banner">
        <span>SALDO DEMONSTRATIVO</span>
        <h2>
          1.250 <small>pontos</small>
        </h2>
        <p>Estes pontos são fictícios e não podem ser utilizados.</p>
      </div>
      <div className="panel">
        <h2>Extrato de exemplo</h2>
        {statements.map(([amount, description, note]) => (
          <div className="statement" key={description}>
            <div>
              <strong>{description}</strong>
              <small>{note}</small>
            </div>
            <b className={amount.startsWith('+') ? 'positive' : ''}>{amount}</b>
          </div>
        ))}
      </div>
    </DemoShell>
  );
}

export function BusinessPage() {
  return (
    <DemoShell
      business
      title="Visão geral da empresa"
      subtitle="Gerencie sua presença e oportunidades na rede Vinkar."
    >
      <div className="cards three">
        <Metric
          label="Campanhas cadastradas"
          value="04"
          note="Dados de exemplo"
          icon={<Megaphone size={20} />}
        />
        <Metric
          label="Parceiros disponíveis"
          value="03"
          note="Convites demonstrativos"
          icon={<Network size={20} />}
        />
        <Metric
          label="Resgates simulados"
          value="28"
          note="Sem operações reais"
          icon={<Gift size={20} />}
        />
      </div>
      <div className="sectionline">
        <h2>Gerencie seu negócio</h2>
      </div>
      <div className="cards two">
        <NavLink className="actiontile" to={routes.demoCampaigns}>
          <div className="tile-icon purple">
            <Megaphone aria-hidden="true" />
          </div>
          <h3>Campanhas e benefícios</h3>
          <p>Crie, edite e organize suas campanhas diretamente na plataforma.</p>
          <span>Gerenciar campanhas →</span>
        </NavLink>
        <NavLink className="actiontile" to={routes.demoPartners}>
          <div className="tile-icon cyan">
            <Network aria-hidden="true" />
          </div>
          <h3>Rede de parcerias</h3>
          <p>Conheça empresas de outros segmentos e possibilidades de colaboração.</p>
          <span>Explorar parceiros →</span>
        </NavLink>
      </div>
    </DemoShell>
  );
}

export function PartnersPage() {
  const partners = [
    ['✂️', 'Barbearia do Matuto', 'Barbearia'],
    ['🛒', 'Varejão Econômico', 'Supermercado'],
    ['🏋️', 'Academia Hangar Fit', 'Academia'],
    ['🌐', 'Powertec', 'Internet'],
  ];

  return (
    <DemoShell
      business
      title="Rede de parcerias"
      subtitle="Conecte seu negócio a novas oportunidades."
    >
      <div className="panel">
        <h2>Empresas da rede demonstrativa</h2>
        <div className="partner-grid">
          {partners.map(([emoji, name, segment]) => (
            <div className="partner" key={name}>
              <div className="partner-icon" aria-hidden="true">
                {emoji}
              </div>
              <strong>{name}</strong>
              <small>{segment}</small>
              <span className="tag">Exemplo fictício</span>
            </div>
          ))}
        </div>
      </div>
      <div className="notice partner-notice" role="note">
        Convites, compartilhamento de dados e criação de redes serão implementados após aprovação
        das regras de negócio e permissões.
      </div>
    </DemoShell>
  );
}

export function SignInPage({ mode }: { mode: 'login' | 'cadastro' }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<'consumidor' | 'empresa'>('consumidor');

  function continueToDemo() {
    navigate(profile === 'empresa' ? routes.demoBusiness : routes.demoConsumer);
  }

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="tile-icon purple">
          <LogIn aria-hidden="true" />
        </div>
        <h1>{mode === 'login' ? 'Bem-vindo de volta' : 'Comece sua jornada'}</h1>
        <p>Escolha como deseja conhecer a Vinkar.</p>
        <div className="choice" aria-label="Perfil da demonstração">
          <button
            type="button"
            className={profile === 'consumidor' ? 'selected' : ''}
            aria-pressed={profile === 'consumidor'}
            onClick={() => setProfile('consumidor')}
          >
            Sou consumidor
          </button>
          <button
            type="button"
            className={profile === 'empresa' ? 'selected' : ''}
            aria-pressed={profile === 'empresa'}
            onClick={() => setProfile('empresa')}
          >
            Sou empresa
          </button>
        </div>
        <label>
          Seu e-mail
          <input type="email" placeholder="voce@exemplo.com" autoComplete="off" />
        </label>
        <label>
          Senha
          <input type="password" placeholder="••••••••" autoComplete="off" />
        </label>
        <button className="btn primary full" type="button" onClick={continueToDemo}>
          Entrar na demonstração <ArrowRight size={17} aria-hidden="true" />
        </button>
        <p className="smallprint">
          A navegação é simulada: não criamos contas nem autenticamos usuários.
        </p>
        <NavLink to={mode === 'login' ? routes.demoSignUp : routes.demoLogin}>
          {mode === 'login'
            ? 'Ainda não tem conta? Conheça o cadastro'
            : 'Já conhece a Vinkar? Ir para login'}
        </NavLink>
      </div>
    </main>
  );
}

export function DemoNotFoundPage() {
  return (
    <main className="not-found">
      <span className="kicker">DEMONSTRAÇÃO</span>
      <h1>Página não encontrada</h1>
      <p>Este caminho não faz parte da demonstração atual.</p>
      <NavLink className="btn primary" to={routes.demoBenefits}>
        Explorar benefícios
      </NavLink>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="not-found">
      <span className="kicker">404</span>
      <h1>Esta página não existe</h1>
      <p>Volte ao início para conhecer a Vinkar.</p>
      <NavLink className="btn primary" to={routes.home}>
        Voltar ao início
      </NavLink>
    </main>
  );
}
