import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsumerRegistrationPage } from './ConsumerRegistrationPage';
import { ConsumerRegistrationProvider } from './ConsumerRegistrationContext';
import { useConsumerRegistration } from './ConsumerRegistrationState';

function RegistrationCount() {
  const { registrationCount } = useConsumerRegistration();
  return <output aria-label="Cadastros demonstrativos">{registrationCount}</output>;
}

function renderRegistration() {
  return render(
    <MemoryRouter initialEntries={['/demo/cadastro/consumidor']}>
      <ConsumerRegistrationProvider>
        <Routes>
          <Route
            path="/demo/cadastro/consumidor"
            element={
              <>
                <ConsumerRegistrationPage />
                <RegistrationCount />
              </>
            }
          />
        </Routes>
      </ConsumerRegistrationProvider>
    </MemoryRouter>,
  );
}

async function completeRequiredSteps(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome completo'), 'Ana');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await user.type(screen.getByLabelText('E-mail'), 'a@b.co');
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('onboarding demonstrativo do Consumidor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza identificação como primeira etapa e orienta a não informar dados sensíveis', () => {
    renderRegistration();

    expect(screen.getByRole('heading', { name: 'Cadastro de Consumidor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Como podemos chamar você?' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Progresso do cadastro' })).toHaveAttribute(
      'value',
      '1',
    );
    expect(screen.getByText(/Não use dados reais sensíveis/)).toBeInTheDocument();
    expect(screen.getByLabelText('Cadastros demonstrativos')).toHaveTextContent('0');
  });

  it('valida identificação pelo domínio e direciona foco ao campo inválido', async () => {
    const user = userEvent.setup();
    renderRegistration();

    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Informe seu nome completo com pelo menos 3 caracteres.',
    );
    expect(screen.getByLabelText('Nome completo')).toHaveFocus();
    expect(screen.getByLabelText('Nome completo')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Cadastros demonstrativos')).toHaveTextContent('0');
  });

  it('valida contato, preserva dados ao voltar e permite navegação por teclado', async () => {
    const user = userEvent.setup();
    renderRegistration();

    await user.type(screen.getByLabelText('Nome completo'), 'Ana');
    screen.getByRole('button', { name: 'Continuar' }).focus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: 'Como podemos entrar em contato?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Confira o formato do e-mail informado.');
    expect(screen.getByLabelText('E-mail')).toHaveFocus();

    await user.type(screen.getByLabelText('E-mail'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByLabelText('Nome completo')).toHaveValue('Ana');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByLabelText('E-mail')).toHaveValue('a@b.co');
    await user.type(screen.getByLabelText('Telefone (opcional)'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Confira o formato do telefone informado.');
    expect(screen.getByLabelText('Telefone (opcional)')).toHaveFocus();
  });

  it('permite ignorar preferências opcionais sem marcar escolhas de privacidade', async () => {
    const user = userEvent.setup();
    renderRegistration();
    await completeRequiredSteps(user);

    expect(screen.getByRole('heading', { name: 'O que você gosta?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pular esta etapa' }));
    expect(
      screen.getByRole('heading', { name: 'Privacidade e suas escolhas' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /personalização/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /comunicações promocionais/ })).not.toBeChecked();
  });

  it('permite selecionar e atualizar preferências opcionais antes de concluir', async () => {
    const user = userEvent.setup();
    renderRegistration();
    await completeRequiredSteps(user);

    await user.click(screen.getByRole('checkbox', { name: 'Alimentação' }));
    await user.selectOptions(
      screen.getByLabelText('Frequência aproximada que você declara'),
      'MONTHLY',
    );
    await user.selectOptions(
      screen.getByLabelText('Faixa aproximada de gasto que você declara'),
      '500_TO_1500',
    );
    await user.click(screen.getByRole('checkbox', { name: 'Descontos' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('checkbox', { name: /personalização/ }));
    await user.click(screen.getByRole('checkbox', { name: /comunicações promocionais/ }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('a@b.co')).toBeInTheDocument();
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText('Personalização: ativada')).toBeInTheDocument();
    expect(
      screen.getByText('Comunicações promocionais por e-mail: selecionada'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar preferências' }));
    expect(screen.getByRole('checkbox', { name: 'Alimentação' })).toBeChecked();
    expect(screen.getByLabelText('Frequência aproximada que você declara')).toHaveValue('MONTHLY');
    await user.click(screen.getByRole('checkbox', { name: 'Alimentação' }));
    await user.click(screen.getByRole('checkbox', { name: 'Saúde' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Saúde')).toBeInTheDocument();
    expect(screen.queryByText('Alimentação')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Concluir cadastro demonstrativo' }));

    expect(screen.getByLabelText('Cadastros demonstrativos')).toHaveTextContent('1');
  });

  it('revisa, bloqueia dados inválidos, conclui uma vez e não autentica o consumidor', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderRegistration();

    await completeRequiredSteps(user);
    await user.click(screen.getByRole('button', { name: 'Pular esta etapa' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('heading', { name: 'Revise seu cadastro' })).toBeInTheDocument();
    expect(screen.getByText('a@b.co')).toBeInTheDocument();

    await user.dblClick(screen.getByRole('button', { name: 'Concluir cadastro demonstrativo' }));

    expect(screen.getByRole('heading', { name: 'Cadastro concluído!' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cadastros demonstrativos')).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: /Descobrir empresas demonstrativas/ })).toHaveAttribute(
      'href',
      '/demo/empresas',
    );
    expect(screen.getByText(/Nenhuma conta foi autenticada/)).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('permite atualizar as preferências depois de concluir o cadastro', async () => {
    const user = userEvent.setup();
    renderRegistration();

    await completeRequiredSteps(user);
    await user.click(screen.getByRole('button', { name: 'Pular esta etapa' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Concluir cadastro demonstrativo' }));
    expect(screen.getByLabelText('Cadastros demonstrativos')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Atualizar preferências do perfil' }));
    expect(screen.getByRole('heading', { name: 'Atualizar preferências' })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Saúde' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Salvar preferências' }));

    expect(screen.getByRole('heading', { name: 'Cadastro concluído!' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cadastros demonstrativos')).toHaveTextContent('1');
  });

  it('impede avançar com dados inválidos e não cria identidade parcial', async () => {
    const user = userEvent.setup();
    renderRegistration();

    await user.type(screen.getByLabelText('Nome completo'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.type(screen.getByLabelText('E-mail'), 'a@b.co');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Pular esta etapa' }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Editar contato' }));
    await user.clear(screen.getByLabelText('E-mail'));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Confira o formato do e-mail informado.');
    expect(screen.getByLabelText('Cadastros demonstrativos')).toHaveTextContent('0');
    expect(screen.queryByRole('heading', { name: 'Cadastro concluído!' })).not.toBeInTheDocument();
  });
});
