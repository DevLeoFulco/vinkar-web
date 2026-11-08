import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router';

function renderRoute(
  path: string,
  state?: { demoContext: 'CONSUMER' | 'BUSINESS' | 'BENEFICIARY' },
) {
  const url = new URL(path, 'http://localhost');

  return render(
    <MemoryRouter initialEntries={[{ pathname: url.pathname, search: url.search, state }]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('isolamento e navegação da demonstração', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mantém a landing institucional fora da demonstração', () => {
    renderRoute('/');

    expect(document.querySelector('.demo-app')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Todos os seus custos podem se transformar em benefícios.',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Ambiente de demonstração/)).not.toBeInTheDocument();
  });

  it('leva as entradas da landing para a seleção ou login pré-selecionado', () => {
    renderRoute('/');

    expect(screen.getByRole('link', { name: /Sou consumidor/ })).toHaveAttribute(
      'href',
      '/demo/login?context=CONSUMER',
    );
    expect(screen.getByRole('link', { name: /Sou empresa/ })).toHaveAttribute(
      'href',
      '/demo/login?context=BUSINESS',
    );
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/demo');
    expect(screen.getByRole('link', { name: /Comece agora/ })).toHaveAttribute('href', '/demo');
    expect(
      screen
        .getAllByRole('link', { name: 'Conheça a demonstração' })
        .every((link) => link.getAttribute('href') === '/demo'),
    ).toBe(true);
    expect(screen.getByRole('link', { name: 'Ver demonstração' })).toHaveAttribute('href', '/demo');
    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: 'Vinkar' }),
    ).toHaveAttribute('href', '#inicio');
  });

  it('mantém o contexto Beneficiário travado no login e entra na experiência correspondente', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/login?context=BENEFICIARY');

    const loginPage = within(screen.getByRole('main'));
    expect(loginPage.getByText('Contexto selecionado')).toBeInTheDocument();
    expect(loginPage.getByText('Beneficiário')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sou consumidor' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sou empresa' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Entrar na demonstração' }));

    expect(screen.getByRole('heading', { name: 'Beneficiário' })).toBeInTheDocument();
    expect(screen.getByText('Cenário ativo: Beneficiário')).toBeInTheDocument();
  });

  it('retorna à seleção quando o login não recebeu um contexto previamente escolhido', () => {
    renderRoute('/demo/login');

    expect(
      screen.getByRole('heading', { name: 'Uma Vinkar, diferentes experiências' }),
    ).toBeInTheDocument();
  });

  it('redireciona acesso direto ao dashboard empresarial para login com contexto selecionado', () => {
    renderRoute('/demo/empresa');

    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Empresa')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Visão geral da empresa' }),
    ).not.toBeInTheDocument();
  });

  it('não aceita contexto incompatível para entrar no painel empresarial', () => {
    renderRoute('/demo/empresa', { demoContext: 'CONSUMER' });

    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Empresa')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Visão geral da empresa' }),
    ).not.toBeInTheDocument();
  });

  it('apresenta a seleção dos três contextos em /demo', () => {
    renderRoute('/demo');

    expect(
      screen.getByRole('heading', { name: 'Uma Vinkar, diferentes experiências' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Consumidor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Empresa' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Beneficiário' })).toBeInTheDocument();
    expect(screen.getByText('Descubra empresas, conexões e benefícios.')).toBeInTheDocument();
    expect(screen.getByText('Conheça campanhas, redes e parcerias.')).toBeInTheDocument();
    expect(screen.getByText('Explore o conceito de benefícios corporativos.')).toBeInTheDocument();
  });

  it('lista empresas e preserva o cenário do Consumidor no catálogo', () => {
    renderRoute('/demo/empresas', { demoContext: 'CONSUMER' });

    expect(screen.getByRole('heading', { name: 'Empresas e conexões' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Empresas demonstrativas' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getAllByRole('article')).toHaveLength(4);
    const companySegments = Array.from(
      screen
        .getByRole('list', { name: 'Empresas demonstrativas' })
        .querySelectorAll('.company-catalog-segment'),
      (segment) => segment.textContent,
    );
    expect(companySegments).toEqual(['Barbearia', 'Supermercado', 'Academia', 'Internet']);
    expect(screen.getByText('2 conexões diretas')).toBeInTheDocument();
    expect(screen.getAllByText('1 conexão direta')).toHaveLength(2);
    expect(screen.getByText('0 conexões diretas')).toBeInTheDocument();
    expect(screen.getByText('Cenário ativo: Consumidor')).toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-consumer-free',
    );
    expect(screen.getByRole('link', { name: 'Empresas' })).toHaveAttribute(
      'href',
      '/demo/empresas',
    );
    expect(
      screen.queryByRole('button', { name: /aderir|selecionar.*empresa principal/i }),
    ).toBeNull();
  });

  it('expõe apenas conexões diretas da empresa consultada', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/empresas', { demoContext: 'CONSUMER' });

    const academyCard = screen
      .getByRole('heading', { name: 'Academia Horizonte Demo' })
      .closest('article');
    expect(academyCard).not.toBeNull();
    const academy = within(academyCard as HTMLElement);
    const viewConnections = academy.getByRole('button', {
      name: 'Ver empresas conectadas a Academia Horizonte Demo',
    });
    expect(viewConnections).toHaveAttribute('aria-expanded', 'false');
    expect(viewConnections).toHaveAttribute(
      'aria-controls',
      'connections-organization-demo-network-academy',
    );
    const connectionList = document.getElementById(
      viewConnections.getAttribute('aria-controls') ?? '',
    );
    expect(connectionList).not.toBeNull();
    expect(connectionList).not.toBeVisible();
    viewConnections.focus();
    await user.keyboard('{Enter}');

    expect(viewConnections).toHaveAttribute('aria-expanded', 'true');
    expect(connectionList).toBeVisible();
    expect(academy.getByText('Barbearia Ponto Zero Demo')).toBeInTheDocument();
    expect(academy.getByText('Mercado Raiz Demo')).toBeInTheDocument();

    const barbershopCard = screen
      .getByRole('heading', { name: 'Barbearia Ponto Zero Demo' })
      .closest('article');
    expect(barbershopCard).not.toBeNull();
    await user.click(
      within(barbershopCard as HTMLElement).getByRole('button', {
        name: 'Ver empresas conectadas a Barbearia Ponto Zero Demo',
      }),
    );

    expect(
      within(barbershopCard as HTMLElement).getByText('Academia Horizonte Demo'),
    ).toBeInTheDocument();
    expect(
      within(barbershopCard as HTMLElement).queryByText('Mercado Raiz Demo'),
    ).not.toBeInTheDocument();
  });

  it('informa quando uma empresa não possui conexões diretas', () => {
    renderRoute('/demo/empresas', { demoContext: 'CONSUMER' });

    const internetProviderCard = screen
      .getByRole('heading', { name: 'Provedor Nuvem Azul Demo' })
      .closest('article');
    expect(internetProviderCard).not.toBeNull();
    expect(
      within(internetProviderCard as HTMLElement).getByText(
        'Nenhuma conexão direta cadastrada neste cenário.',
      ),
    ).toBeInTheDocument();
    expect(
      within(internetProviderCard as HTMLElement).queryByRole('button'),
    ).not.toBeInTheDocument();
  });

  it('protege o catálogo contra acesso direto sem o contexto Consumidor', () => {
    renderRoute('/demo/empresas');

    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Consumidor')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Empresas e conexões' })).not.toBeInTheDocument();
  });

  it('não permite reutilizar o catálogo com um contexto incompatível', () => {
    renderRoute('/demo/empresas', { demoContext: 'BUSINESS' });

    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText('Consumidor')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Empresas e conexões' })).not.toBeInTheDocument();
  });

  it('mantém a lista de empresas da tela empresarial ligada ao catálogo compartilhado', () => {
    renderRoute('/demo/parcerias', { demoContext: 'BUSINESS' });

    expect(screen.getByRole('heading', { name: 'Rede de parcerias' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
    for (const name of [
      'Barbearia Ponto Zero Demo',
      'Mercado Raiz Demo',
      'Academia Horizonte Demo',
      'Provedor Nuvem Azul Demo',
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('mantém a sessão demonstrativa ao retornar do catálogo à visão geral', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/empresas', { demoContext: 'CONSUMER' });

    await user.click(screen.getByRole('link', { name: 'Voltar à visão geral' }));

    expect(
      screen.getByRole('heading', { name: 'Olá, que bom ter você aqui!' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cenário ativo: Consumidor')).toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-consumer-free',
    );
  });

  it('apresenta os planos de Consumidor com regras e restrições demonstrativas', () => {
    renderRoute('/demo/planos?context=CONSUMER');

    expect(screen.getByRole('heading', { name: 'Planos Vinkar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gratuito' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Premium' })).toBeInTheDocument();
    expect(
      screen.getByText('Pontos válidos por 90 dias corridos após o crédito.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Carência de 30 dias corridos após a ativação.')).toBeInTheDocument();
    expect(
      screen.getByText('Pontos válidos por 180 dias corridos após o crédito.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Carência de 15 dias corridos após a ativação.')).toBeInTheDocument();
    expect(screen.getByText('Pontos sem expiração.')).toBeInTheDocument();
    expect(screen.getByText('Saída imediata da rede principal.')).toBeInTheDocument();
    expect(screen.getByText('Os pontos não podem ser sacados.')).toBeInTheDocument();
    expect(screen.getByText('Os pontos não podem ser transferidos.')).toBeInTheDocument();
    expect(screen.getByText('Os pontos não podem ser usados fora da Vinkar.')).toBeInTheDocument();
    expect(
      screen.getByText('A disponibilidade de benefícios depende das regras de elegibilidade.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/R\$\s?\d|contratar|assinar/i)).not.toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-consumer-free',
    );
  });

  it.each([
    ['BUSINESS', 'Empresa', '/demo/empresa', 'Voltar à demonstração de Empresa'],
    ['BENEFICIARY', 'Beneficiário', '/demo/beneficiario', 'Voltar à apresentação de Beneficiário'],
  ] as const)(
    'não aplica políticas de Consumidor ao contexto %s e permite retornar',
    async (context, contextName, returnPath, returnLabel) => {
      const user = userEvent.setup();
      renderRoute(`/demo/planos?context=${context}`);

      expect(
        within(screen.getByRole('main')).getByText(contextName, { exact: true }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/detalhes comerciais.*ainda estão em definição/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/políticas apresentadas para Consumidor não se aplicam automaticamente/i),
      ).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Gratuito' })).not.toBeInTheDocument();
      expect(screen.queryByText(/pontos válidos por|carência de/i)).not.toBeInTheDocument();
      expect(
        screen.getByText('Nenhum plano pode ser contratado ou ativado nesta demonstração.'),
      ).toBeInTheDocument();

      const returnLink = screen.getByRole('link', { name: returnLabel });
      expect(returnLink).toHaveAttribute('href', returnPath);
      await user.click(returnLink);

      expect(document.querySelector('.demo-app')).toHaveAttribute(
        'data-demo-scenario-id',
        context === 'BUSINESS' ? 'scenario-demo-business-admin' : 'scenario-demo-beneficiary',
      );
      expect(
        screen.getByRole('heading', {
          name: context === 'BUSINESS' ? 'Visão geral da empresa' : 'Beneficiário',
        }),
      ).toBeInTheDocument();
    },
  );

  it('retorna à seleção quando os planos são acessados sem contexto', () => {
    renderRoute('/demo/planos');

    expect(
      screen.getByRole('heading', { name: 'Uma Vinkar, diferentes experiências' }),
    ).toBeInTheDocument();
  });

  it('preserva o cenário ativo ao consultar e retornar dos planos', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/consumidor', { demoContext: 'CONSUMER' });

    await user.click(screen.getByRole('link', { name: 'Planos' }));

    expect(screen.getByRole('heading', { name: 'Planos Vinkar' })).toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-consumer-free',
    );

    await user.click(screen.getByRole('link', { name: 'Voltar à demonstração de Consumidor' }));

    expect(
      screen.getByRole('heading', { name: 'Olá, que bom ter você aqui!' }),
    ).toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-consumer-free',
    );
  });

  it('seleciona Consumidor e abre a experiência existente com o cenário ativo', async () => {
    const user = userEvent.setup();
    renderRoute('/demo');

    await user.click(screen.getByRole('link', { name: 'Continuar como consumidor' }));

    expect(screen.getByText('Consumidor')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sou empresa' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Entrar na demonstração' }));

    expect(
      screen.getByRole('heading', { name: 'Olá, que bom ter você aqui!' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Cenário ativo: Consumidor')).toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-consumer-free',
    );
  });

  it('seleciona Empresa sem criar um perfil pessoal', async () => {
    const user = userEvent.setup();
    renderRoute('/demo');

    await user.click(screen.getByRole('link', { name: 'Continuar como empresa' }));
    expect(within(screen.getByRole('main')).getByText('Empresa')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Entrar na demonstração' }));

    expect(screen.getByRole('heading', { name: 'Visão geral da empresa' })).toBeInTheDocument();
    expect(screen.getByText('Cenário ativo: Empresa')).toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-business-admin',
    );
  });

  it('seleciona Beneficiário e apresenta somente o contexto demonstrativo', async () => {
    const user = userEvent.setup();
    renderRoute('/demo');

    await user.click(screen.getByRole('link', { name: 'Continuar como beneficiário' }));
    expect(screen.getByText('Beneficiário')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Entrar na demonstração' }));

    expect(screen.getByRole('heading', { name: 'Beneficiário' })).toBeInTheDocument();
    expect(screen.getByText(/identidade própria, separada da organização/)).toBeInTheDocument();
    expect(
      screen.getByText(/disponibilidade de benefícios depende das regras da empresa e da Vinkar/),
    ).toBeInTheDocument();
    expect(screen.getByText(/não confirma vínculo ou elegibilidade real/)).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).queryByText(/saldo|pontos|plano/i),
    ).not.toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-beneficiary',
    );
  });

  it('preserva o cenário selecionado ao navegar dentro da experiência empresarial', async () => {
    const user = userEvent.setup();
    renderRoute('/demo');

    await user.click(screen.getByRole('link', { name: 'Continuar como empresa' }));
    await user.click(screen.getByRole('button', { name: 'Entrar na demonstração' }));
    await user.click(screen.getByRole('link', { name: 'Campanhas' }));

    expect(screen.getByRole('heading', { name: 'Minhas campanhas' })).toBeInTheDocument();
    expect(screen.getByText('Cenário ativo: Empresa')).toBeInTheDocument();
    expect(document.querySelector('.demo-app')).toHaveAttribute(
      'data-demo-scenario-id',
      'scenario-demo-business-admin',
    );
  });

  it('leva o logo da demonstração de volta ao início da landing', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/empresa', { demoContext: 'BUSINESS' });

    await user.click(screen.getByRole('link', { name: 'Vinkar — voltar ao início da Vinkar' }));

    expect(
      screen.getByRole('heading', {
        name: 'Todos os seus custos podem se transformar em benefícios.',
      }),
    ).toBeInTheDocument();
  });

  it('renderiza as seções institucionais com âncoras de navegação válidas', () => {
    renderRoute('/');

    expect(
      screen.getByRole('heading', { name: /Uma ideia que cresceu como uma árvore/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Uma plataforma pensada para todos os lados/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Conexões começam com diferentes negócios/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Missão, Visão e Valores' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entre em contato' })).toBeInTheDocument();

    for (const id of ['inicio', 'sobre', 'solucoes', 'clientes', 'valores', 'contato']) {
      expect(document.getElementById(id)).toBeInTheDocument();
    }
  });

  it('abre e fecha o menu mobile e atualiza o estado acessível', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    const menuButton = screen.getByLabelText('Abrir menu principal');
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toHaveClass('is-open');

    await user.click(
      within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', {
        name: 'Soluções',
      }),
    );
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('mantém a rota de campanhas dentro do layout e dos dados demonstrativos', () => {
    renderRoute('/demo/campanhas', { demoContext: 'BUSINESS' });

    expect(document.querySelector('.demo-app')).toContainElement(
      screen.getByRole('heading', { name: 'Minhas campanhas' }),
    );
    expect(screen.getByRole('heading', { name: 'Minhas campanhas' })).toBeInTheDocument();
    expect(screen.getByText(/Modo demonstração/)).toBeInTheDocument();
    expect(screen.getByText('4 campanhas demonstrativas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao site institucional' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('preserva a criação de campanhas em memória e sinaliza a lista vazia', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/campanhas', { demoContext: 'BUSINESS' });

    await user.click(screen.getByRole('button', { name: 'Nova campanha' }));
    const dialog = screen.getByRole('dialog', { name: 'Nova campanha' });
    await user.type(within(dialog).getByLabelText('Nome da campanha'), 'Campanha de teste');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar campanha' }));

    expect(screen.getByText('5 campanhas demonstrativas')).toBeInTheDocument();
    expect(screen.getByText('Campanha de teste')).toBeInTheDocument();

    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    await user.click(screen.getByRole('button', { name: 'Excluir Campanha de teste' }));
    expect(screen.getByText('4 campanhas demonstrativas')).toBeInTheDocument();
    expect(screen.queryByText('Campanha de teste')).not.toBeInTheDocument();
  });

  it('permite editar campanhas sem alterar a quantidade de registros', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/campanhas', { demoContext: 'BUSINESS' });

    await user.click(screen.getByRole('button', { name: 'Editar Sua próxima visita vale mais' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar campanha' });
    const nameInput = within(dialog).getByLabelText('Nome da campanha');
    await user.clear(nameInput);
    await user.type(nameInput, 'Campanha revisada');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar campanha' }));

    expect(screen.getByText('4 campanhas demonstrativas')).toBeInTheDocument();
    expect(screen.getByText('Campanha revisada')).toBeInTheDocument();
    expect(screen.queryByText('Sua próxima visita vale mais')).not.toBeInTheDocument();
  });

  it('mantém foco dentro do modal e o devolve ao controle que o abriu', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/campanhas', { demoContext: 'BUSINESS' });

    const openButton = screen.getByRole('button', { name: 'Nova campanha' });
    await user.click(openButton);
    const dialog = screen.getByRole('dialog', { name: 'Nova campanha' });
    const nameInput = within(dialog).getByLabelText('Nome da campanha');
    expect(document.activeElement).toBe(nameInput);

    openButton.focus();
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Fechar' }));

    within(dialog).getByRole('button', { name: 'Fechar' }).focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(openButton);
  });

  it('leva a troca de contexto para login antes de entrar na outra experiência', async () => {
    const user = userEvent.setup();
    const { container } = renderRoute('/demo/beneficios', { demoContext: 'CONSUMER' });
    const menuButton = container.querySelector<HTMLButtonElement>('.mobile-menu');
    expect(menuButton).not.toBeNull();
    if (!menuButton) {
      throw new Error('Botão do menu mobile não encontrado.');
    }

    expect(menuButton).toHaveAttribute('aria-label', 'Abrir menu da demonstração');
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(
      within(screen.getByRole('navigation', { name: 'Navegação da demonstração' })).getByRole(
        'link',
        { name: 'Sou empresa' },
      ),
    );
    expect(within(screen.getByRole('main')).getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Visão geral da empresa' }),
    ).not.toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Entrar na demonstração' }));
    expect(screen.getByRole('heading', { name: 'Visão geral da empresa' })).toBeInTheDocument();
  });

  it('apresenta uma página 404 fora das rotas conhecidas', () => {
    renderRoute('/rota-inexistente');

    expect(screen.getByRole('heading', { name: 'Esta página não existe' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });

  it('valida campos obrigatórios e não simula o envio do formulário', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    await user.click(screen.getByRole('button', { name: 'Validar formulário' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Confira os campos obrigatórios e o consentimento antes de continuar.',
    );

    await user.type(screen.getByLabelText('Nome'), 'Pessoa de teste');
    await user.type(screen.getByLabelText('E-mail'), 'pessoa@example.com');
    await user.type(screen.getByLabelText('Assunto'), 'Interesse na Vinkar');
    await user.type(screen.getByLabelText('Mensagem'), 'Gostaria de conhecer a proposta.');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Validar formulário' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhuma mensagem foi enviada; o contato aguarda integração.',
    );
  });
});
