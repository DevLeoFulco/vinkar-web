import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LandingPage } from '../LandingPage';

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('seção de planos da landing pública', () => {
  it('apresenta os planos de Consumidor com valores vindos da apresentação de domínio', () => {
    renderLanding();

    const section = screen.getByRole('region', { name: 'Planos Vinkar' });
    expect(within(section).getByRole('heading', { name: 'Gratuito' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Pro' })).toBeInTheDocument();
    expect(within(section).getByRole('heading', { name: 'Premium' })).toBeInTheDocument();
    expect(
      within(section).getByText('Pontos válidos por 90 dias corridos após o crédito.'),
    ).toBeInTheDocument();
    expect(
      within(section).getByText('Carência de 30 dias corridos após a ativação.'),
    ).toBeInTheDocument();
    expect(
      within(section).getByText('Pontos válidos por 180 dias corridos após o crédito.'),
    ).toBeInTheDocument();
    expect(
      within(section).getByText('Carência de 15 dias corridos após a ativação.'),
    ).toBeInTheDocument();
    expect(within(section).getByText('Pontos sem expiração.')).toBeInTheDocument();
    expect(within(section).getByText('Saída imediata da rede principal.')).toBeInTheDocument();
    expect(within(section).getAllByText('Valor a definir')).toHaveLength(3);
    expect(within(section).queryByText(/R\$\s?\d/)).not.toBeInTheDocument();
  });

  it('alterna de forma informativa entre Empresa e Beneficiário sem aplicar regras de Consumidor', () => {
    renderLanding();

    const section = screen.getByRole('region', { name: 'Planos Vinkar' });
    const businessButton = within(section).getByRole('button', { name: 'Empresa' });
    fireEvent.click(businessButton);

    expect(businessButton).toHaveAttribute('aria-pressed', 'true');
    expect(within(section).getByText(/estão previstos/)).toBeInTheDocument();
    expect(within(section).getByText('Condições em definição')).toBeInTheDocument();
    expect(
      within(section).queryByText(/Pontos válidos|Carência de|Saída imediata/),
    ).not.toBeInTheDocument();

    const beneficiaryButton = within(section).getByRole('button', { name: 'Beneficiário' });
    fireEvent.click(beneficiaryButton);

    expect(beneficiaryButton).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(section).getByRole('heading', { name: 'Benefícios vinculados à organização' }),
    ).toBeInTheDocument();
    expect(within(section).getByText('Condições em definição')).toBeInTheDocument();
    expect(within(section).getByText(/depende do vínculo com a organização/)).toBeInTheDocument();
    expect(within(section).queryByRole('heading', { name: 'Gratuito' })).not.toBeInTheDocument();
    expect(within(section).queryByText(/assinatura individual/)).toBeInTheDocument();
    expect(within(section).queryByText(/R\$\s?\d/)).not.toBeInTheDocument();
  });

  it('mantém a landing pública, usa a âncora Planos e direciona a demonstração para /demo', () => {
    renderLanding();

    const section = screen.getByRole('region', { name: 'Planos Vinkar' });
    expect(section).toHaveAttribute('id', 'planos');
    expect(
      within(screen.getByRole('navigation', { name: 'Navegação principal' })).getByRole('link', {
        name: 'Planos',
      }),
    ).toHaveAttribute('href', '#planos');
    expect(
      within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Planos' }),
    ).toHaveAttribute('href', '#planos');
    expect(within(section).getByRole('link', { name: 'Conhecer demonstração' })).toHaveAttribute(
      'href',
      '/demo',
    );

    fireEvent.click(within(section).getByRole('button', { name: 'Empresa' }));
    expect(document.querySelector('.demo-app')).not.toBeInTheDocument();
    expect(within(section).getByRole('link', { name: 'Conhecer demonstração' })).toHaveAttribute(
      'href',
      '/demo',
    );
  });
});
