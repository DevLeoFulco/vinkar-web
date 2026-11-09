import type { ReactNode } from 'react';
import {
  Building2,
  ArrowRight,
  ClipboardList,
  Coins,
  Gift,
  LayoutDashboard,
  LogIn,
  Megaphone,
  Network,
  Wallet,
} from 'lucide-react';
import { Link, Navigate, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '../../shared/config/routes';
import { Badge } from '../../shared/components/ui/Badge';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { demoCampaigns, type CampaignStatus } from './demoData';
import {
  getDemoCompanies,
  demoCompanies,
  demoOrganizationConnections,
  getDemoCompany,
} from './mocks/companyNetwork';
import {
  evaluateOfferEligibility,
  getConsumerNetworkEligibility,
  type OfferEligibilityResult,
} from './domain/networkEligibility';
import type { MainCompanyMembership, PersonIdentityId } from './domain/models';
import type { DemoScenarioContext } from './mocks/demoScenarios';
import { useDemoMembershipRequests } from './useDemoMembershipRequests';
import { useDemoScenario } from './useDemoScenario';

const consumerNavigation = [
  [routes.demoConsumer, 'Visão geral', LayoutDashboard],
  [routes.demoCompanies, 'Empresas', Building2],
  [routes.demoMembershipRequests, 'Minhas solicitações', ClipboardList],
  [routes.demoBenefits, 'Benefícios', Gift],
  [routes.demoWallet, 'Minha carteira', Wallet],
] as const;

const businessNavigation = [
  [routes.demoBusiness, 'Visão geral', LayoutDashboard],
  [routes.demoBusinessRequests, 'Solicitações', ClipboardList],
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
  const { activeScenario } = useDemoScenario();
  const { state } = useDemoMembershipRequests();
  const pendingRequestCount =
    business && activeScenario?.context === 'BUSINESS'
      ? state.requests.filter(
          (request) =>
            request.organizationId === activeScenario.organization.id &&
            request.status === 'PENDING',
        ).length
      : 0;

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <nav className="sidebar-nav" aria-label="Navegação da área">
          <span className="side-title">{business ? 'ÁREA DA EMPRESA' : 'ÁREA DO CONSUMIDOR'}</span>
          {links.map(([url, label, Icon]) => (
            <NavLink
              key={url}
              to={url}
              state={{ demoContext: business ? 'BUSINESS' : 'CONSUMER' }}
              className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
            >
              <Icon size={19} aria-hidden="true" />
              {label}
              {url === routes.demoBusinessRequests && pendingRequestCount > 0 && (
                <span className="sidebar-count" aria-label={`${pendingRequestCount} pendentes`}>
                  {pendingRequestCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
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
    <Card as="article" className="metric">
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </Card>
  );
}

function getStatusVariant(status: CampaignStatus): 'success' | 'neutral' | 'warning' {
  if (status === 'Ativa') {
    return 'success';
  }
  if (status === 'Encerrada') {
    return 'warning';
  }
  return 'neutral';
}

function getCampaignsForConsumer(
  personIdentityId: PersonIdentityId,
  memberships: readonly MainCompanyMembership[],
) {
  const network = getConsumerNetworkEligibility({
    personIdentityId,
    memberships,
    organizations: demoCompanies,
    connections: demoOrganizationConnections,
  });
  return demoCampaigns.map((campaign) => ({
    campaign,
    eligibility: evaluateOfferEligibility(
      {
        organizationId: campaign.organizationId,
        offerCategory: campaign.offerCategory,
        isActive: campaign.status === 'Ativa',
      },
      network,
    ),
  }));
}

function getEligibilityText(eligibility: OfferEligibilityResult): string {
  if (eligibility.accessStatus === 'POTENTIAL') {
    if (eligibility.offerCategory === 'GENERAL_CAMPAIGN') {
      return 'Acesso potencial pela rede ativa; não exige compra recente nem saldo de pontos. A participação ainda não foi iniciada, as regras específicas da campanha precisam ser avaliadas e nenhum ponto foi creditado.';
    }
    return 'Elegibilidade de rede potencial. Saldo e demais regras ainda precisam ser verificados; nenhum resgate está autorizado e nenhum ponto foi creditado.';
  }
  switch (eligibility.reason) {
    case 'OFFER_NOT_ACTIVE':
      return 'Esta oferta não está ativa.';
    case 'NO_ACTIVE_PRIMARY_COMPANY':
      return 'Sem empresa principal ativa: esta oferta ainda não está acessível neste cenário.';
    case 'OUTSIDE_ACTIVE_NETWORK':
      return 'A empresa promotora está fora da rede ativa deste consumidor.';
    case 'EXCLUSIVE_REQUIRES_PRIMARY_COMPANY':
      return 'Uma conexão direta não libera um benefício exclusivo. A empresa promotora precisa ser uma empresa principal ativa.';
    default:
      return 'A oferta não está acessível neste cenário demonstrativo.';
  }
}

function getRelationshipText(eligibility: OfferEligibilityResult): string {
  if (eligibility.relationship === 'PRINCIPAL') {
    return 'Empresa principal';
  }
  if (eligibility.relationship === 'CONNECTED') {
    return 'Empresa conectada à rede de';
  }
  return 'Fora da rede ativa';
}

function BenefitsGrid({
  compact = false,
  campaignResults,
}: {
  compact?: boolean;
  campaignResults: ReturnType<typeof getCampaignsForConsumer>;
}) {
  const visibleCampaigns = campaignResults.slice(0, compact ? 2 : 4);

  return (
    <>
      {visibleCampaigns.length === 0 ? (
        <Card className="consumer-offers-empty" role="status">
          <p>Não há ofertas demonstrativas cadastradas.</p>
        </Card>
      ) : (
        <div className="cards two consumer-offers">
          {visibleCampaigns.map(({ campaign, eligibility }, index) => {
            const promoter = getDemoCompany(campaign.organizationId);
            const originatingCompanies = eligibility.originatingMainCompanyIds
              .map((organizationId) => getDemoCompany(organizationId)?.displayName)
              .filter((name): name is string => Boolean(name));

            return (
              <Card as="article" className="benefit consumer-offer" key={campaign.id}>
                <div className={`benefit-cover cover${index}`}>
                  <span aria-hidden="true">{['✂️', '🏋️', '🛒', '🌐'][index]}</span>
                  <small>{campaign.segment}</small>
                </div>
                <div className="benefit-body">
                  <div className="consumer-offer-badges">
                    <Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge>
                    <Badge variant="neutral">
                      {campaign.offerCategory === 'GENERAL_CAMPAIGN'
                        ? 'Campanha geral'
                        : campaign.offerCategory === 'NETWORK_BENEFIT'
                          ? 'Benefício de rede'
                          : 'Benefício exclusivo'}
                    </Badge>
                    <Badge
                      variant={eligibility.accessStatus === 'POTENTIAL' ? 'success' : 'warning'}
                    >
                      {eligibility.accessStatus === 'POTENTIAL'
                        ? 'Acesso potencial'
                        : 'Indisponível'}
                    </Badge>
                  </div>
                  <h3>{campaign.title}</h3>
                  <p>{campaign.description}</p>
                  <dl className="consumer-offer-origin">
                    <div>
                      <dt>Empresa promotora</dt>
                      <dd>
                        {promoter?.displayName ?? 'Organização demonstrativa não identificada'}
                      </dd>
                    </div>
                    <div>
                      <dt>Relação com sua rede</dt>
                      <dd>{getRelationshipText(eligibility)}</dd>
                    </div>
                    {originatingCompanies.length > 0 && (
                      <div>
                        <dt>Empresas principais de origem</dt>
                        <dd>{originatingCompanies.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                  <p
                    className={`consumer-offer-access consumer-offer-access--${eligibility.accessStatus.toLowerCase()}`}
                    role="status"
                  >
                    {getEligibilityText(eligibility)}
                  </p>
                  {eligibility.pendingRequirements.length > 0 && (
                    <ul className="consumer-offer-requirements" aria-label="Requisitos pendentes">
                      {eligibility.pendingRequirements.map((requirement) => (
                        <li key={requirement}>
                          {requirement === 'OFFER_RULES_NOT_EVALUATED'
                            ? 'Regras específicas da oferta pendentes'
                            : requirement === 'BALANCE_NOT_VERIFIED'
                              ? 'Saldo necessário para eventual resgate ainda não verificado'
                              : 'Condições de resgate ainda não avaliadas'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="consumer-offers-disclaimer">
        A elegibilidade da rede não substitui as condições específicas da oferta nem autoriza
        resgates. Esta demonstração não concede ou movimenta pontos.
      </p>
    </>
  );
}

export function ConsumerPage() {
  const { activeScenario } = useDemoScenario();
  const { state } = useDemoMembershipRequests();
  const campaignResults =
    activeScenario?.context === 'CONSUMER'
      ? getCampaignsForConsumer(activeScenario.session.personIdentity.id, state.memberships)
      : [];
  const eligibleCampaignCount = campaignResults.filter(
    ({ eligibility }) => eligibility.accessStatus === 'POTENTIAL',
  ).length;

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
          label="Acesso potencial"
          value={String(eligibleCampaignCount).padStart(2, '0')}
          note="Conforme sua rede ativa"
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
        <NavLink
          to={routes.demoBenefits}
          state={{ demoContext: 'CONSUMER' satisfies DemoScenarioContext }}
        >
          Ver todos →
        </NavLink>
      </div>
      <BenefitsGrid campaignResults={campaignResults} compact />
    </DemoShell>
  );
}

export function BenefitsPage() {
  const { activeScenario } = useDemoScenario();
  const { state } = useDemoMembershipRequests();
  const campaignResults =
    activeScenario?.context === 'CONSUMER'
      ? getCampaignsForConsumer(activeScenario.session.personIdentity.id, state.memberships)
      : [];

  return (
    <DemoShell
      business={false}
      title="Explore benefícios"
      subtitle="Consulte campanhas e benefícios demonstrativos conforme sua rede ativa."
    >
      <BenefitsGrid campaignResults={campaignResults} />
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
      <Card className="panel">
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
      </Card>
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
        <NavLink
          className="ui-card ui-card--interactive actiontile"
          to={routes.demoCampaigns}
          state={{ demoContext: 'BUSINESS' satisfies DemoScenarioContext }}
        >
          <div className="tile-icon purple">
            <Megaphone aria-hidden="true" />
          </div>
          <h3>Campanhas e benefícios</h3>
          <p>Crie, edite e organize suas campanhas diretamente na plataforma.</p>
          <span>Gerenciar campanhas →</span>
        </NavLink>
        <NavLink
          className="ui-card ui-card--interactive actiontile"
          to={routes.demoPartners}
          state={{ demoContext: 'BUSINESS' satisfies DemoScenarioContext }}
        >
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
  return (
    <DemoShell
      business
      title="Rede de parcerias"
      subtitle="Conecte seu negócio a novas oportunidades."
    >
      <Card className="panel">
        <h2>Empresas da rede demonstrativa</h2>
        <div className="partner-grid">
          {getDemoCompanies().map((company) => (
            <Card as="article" className="partner" key={company.id}>
              <div className="partner-icon" aria-hidden="true">
                {company.symbol}
              </div>
              <strong>{company.displayName}</strong>
              <small>{company.segmentLabel}</small>
              <Badge>Exemplo fictício</Badge>
            </Card>
          ))}
        </div>
      </Card>
      <div className="notice partner-notice" role="note">
        Convites, compartilhamento de dados e criação de redes serão implementados após aprovação
        das regras de negócio e permissões.
      </div>
    </DemoShell>
  );
}

export function SignInPage({ mode }: { mode: 'login' | 'cadastro' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedContext = getSelectedDemoContext(searchParams.get('context'));

  if (!selectedContext) {
    return <Navigate to={routes.demo} replace />;
  }

  const contextDetails = {
    CONSUMER: {
      label: 'Consumidor',
      destination: routes.demoConsumer,
    },
    BUSINESS: {
      label: 'Empresa',
      destination: routes.demoBusiness,
    },
    BENEFICIARY: {
      label: 'Beneficiário',
      destination: routes.demoBeneficiary,
    },
  } as const;
  const selected = contextDetails[selectedContext];

  function continueToDemo() {
    navigate(selected.destination, { state: { demoContext: selectedContext } });
  }

  const otherModePath =
    mode === 'login'
      ? `${routes.demoSignUp}?context=${selectedContext}`
      : `${routes.demoLogin}?context=${selectedContext}`;

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="tile-icon purple">
          <LogIn aria-hidden="true" />
        </div>
        <h1>{mode === 'login' ? 'Bem-vindo de volta' : 'Comece sua jornada'}</h1>
        <p>Entre para continuar na experiência selecionada.</p>
        <div className="auth-context" aria-label={`Contexto selecionado: ${selected.label}`}>
          <span>Contexto selecionado</span>
          <strong>{selected.label}</strong>
          <Link to={routes.demo}>Escolher outro contexto</Link>
        </div>
        <label htmlFor={`signin-email-${mode}`}>
          Seu e-mail
          <input
            id={`signin-email-${mode}`}
            type="email"
            placeholder="voce@exemplo.com"
            autoComplete="off"
          />
        </label>
        <label htmlFor={`signin-password-${mode}`}>
          Senha
          <input
            id={`signin-password-${mode}`}
            type="password"
            placeholder="••••••••"
            autoComplete="off"
          />
        </label>
        <Button className="full" type="button" onClick={continueToDemo}>
          Entrar na demonstração <ArrowRight size={17} aria-hidden="true" />
        </Button>
        <p className="smallprint">
          A navegação é simulada: não criamos contas nem autenticamos usuários.
        </p>
        <NavLink to={otherModePath}>
          {mode === 'login'
            ? 'Ainda não tem conta? Conheça o cadastro'
            : 'Já conhece a Vinkar? Ir para login'}
        </NavLink>
      </div>
    </main>
  );
}

function getSelectedDemoContext(value: string | null): DemoScenarioContext | null {
  if (value === 'CONSUMER' || value === 'BUSINESS' || value === 'BENEFICIARY') {
    return value;
  }

  return null;
}

export function DemoNotFoundPage() {
  return (
    <main className="not-found">
      <span className="kicker">DEMONSTRAÇÃO</span>
      <h1>Página não encontrada</h1>
      <p>Este caminho não faz parte da demonstração atual.</p>
      <NavLink className="ui-button ui-button--primary" to={routes.demo}>
        Escolher contexto
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
      <NavLink className="ui-button ui-button--primary" to={routes.home}>
        Voltar ao início
      </NavLink>
    </main>
  );
}
