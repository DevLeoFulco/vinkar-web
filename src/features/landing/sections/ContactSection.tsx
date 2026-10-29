import { useState, type FormEvent } from 'react';
import { Mail, MessageSquareText } from 'lucide-react';
import { landingSections } from '../../../shared/config/routes';

type FormState = 'idle' | 'error' | 'validated';

export function ContactSection() {
  const [formState, setFormState] = useState<FormState>('idle');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.reportValidity()) {
      setFormState('error');
      return;
    }

    setFormState('validated');
    form.reset();
  }

  function clearFeedback() {
    setFormState('idle');
  }

  return (
    <section className="site-section site-contact" id={landingSections.contact}>
      <div className="site-container">
        <div className="site-contact-heading">
          <div>
            <span className="site-overline">Vamos conversar?</span>
            <h2>Entre em contato</h2>
            <p>Conte um pouco sobre você e sobre a conexão que gostaria de construir.</p>
          </div>
          <img
            src="/images/contact/contato-team.webp"
            alt="Espaço de trabalho preparado para uma conversa"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="site-contact-layout">
          <form className="site-contact-form" onSubmit={handleSubmit} noValidate>
            <div className="site-form-grid">
              <label>
                Nome
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  onChange={clearFeedback}
                />
              </label>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  onChange={clearFeedback}
                />
              </label>
            </div>
            <label>
              Assunto
              <input name="subject" type="text" required onChange={clearFeedback} />
            </label>
            <label>
              Mensagem
              <textarea name="message" rows={5} required onChange={clearFeedback} />
            </label>
            <label className="site-consent">
              <input name="consent" type="checkbox" required onChange={clearFeedback} />
              <span>
                Entendo que este formulário é apenas uma prévia: nenhum dado será enviado ou
                armazenado até que a finalidade e o aviso de privacidade sejam aprovados.
              </span>
            </label>
            {formState === 'error' && (
              <p className="site-form-feedback error" role="alert">
                Confira os campos obrigatórios e o consentimento antes de continuar.
              </p>
            )}
            {formState === 'validated' && (
              <p className="site-form-feedback success" role="status" aria-live="polite">
                Formulário validado neste navegador. Nenhuma mensagem foi enviada; o contato aguarda
                integração.
              </p>
            )}
            <button className="site-button site-button-primary" type="submit">
              <MessageSquareText size={17} aria-hidden="true" /> Validar formulário
            </button>
            <p className="site-privacy-note">
              Não informe dados sensíveis. Os canais oficiais de contato ainda serão confirmados.
            </p>
          </form>
          <aside className="site-contact-aside">
            <img
              src="/images/contact/map-illustration.webp"
              alt="Ilustração conceitual de localização, sem endereço real"
              loading="lazy"
              decoding="async"
            />
            <div>
              <Mail size={18} aria-hidden="true" />
              <span>
                <strong>E-mail</strong>
                <small>A confirmar</small>
              </span>
            </div>
            <p>
              TODO: confirmar e-mail oficial, telefone, localização e redes sociais antes de
              disponibilizar canais de contato públicos.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
