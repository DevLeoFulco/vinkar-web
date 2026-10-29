import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router';

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
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

  it('direciona os CTAs por perfil para as páginas correspondentes da demo', () => {
    renderRoute('/');

    expect(screen.getByRole('link', { name: /Sou consumidor/ })).toHaveAttribute(
      'href',
      '/demo/beneficios',
    );
    expect(screen.getByRole('link', { name: /Sou empresa/ })).toHaveAttribute(
      'href',
      '/demo/empresa',
    );
    expect(screen.getByRole('link', { name: /Comece agora/ })).toHaveAttribute(
      'href',
      '/demo/beneficios',
    );
    expect(
      within(screen.getByRole('banner')).getByRole('link', { name: 'Vinkar' }),
    ).toHaveAttribute('href', '#inicio');
  });

  it('redireciona /demo para benefícios sem renderizar a página inicial removida', () => {
    renderRoute('/demo');

    expect(screen.getByRole('heading', { name: 'Explore benefícios' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /Uma experiência para cada conexão/ }),
    ).not.toBeInTheDocument();
  });

  it('leva o logo da demonstração de volta ao início da landing', async () => {
    const user = userEvent.setup();
    renderRoute('/demo/empresa');

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
    renderRoute('/demo/campanhas');

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
    renderRoute('/demo/campanhas');

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
    renderRoute('/demo/campanhas');

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
    renderRoute('/demo/campanhas');

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

  it('abre e fecha a navegação mobile do demo e navega pelo perfil selecionado', async () => {
    const user = userEvent.setup();
    const { container } = renderRoute('/demo/beneficios');
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
    expect(screen.getByRole('heading', { name: 'Visão geral da empresa' })).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
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
