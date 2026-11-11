import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { routes } from '../../shared/config/routes';
import {
  validatePersonContacts,
  validatePersonFullName,
  type RegistrationFailure,
} from './domain/registration';
import type {
  ConsumerInterestCategory,
  ConsumerPreferences,
  DeclaredConsumptionFrequency,
  DeclaredSpendRange,
  PreferredBenefitType,
} from './domain/registrationModels';
import type { PersonIdentityId } from './domain/models';
import { useConsumerRegistration } from './ConsumerRegistrationState';

const stepNames = ['Identificação', 'Contato', 'Preferências', 'Privacidade', 'Revisão'] as const;
const categories: readonly Readonly<{ value: ConsumerInterestCategory; label: string }>[] = [
  { value: 'FOOD', label: 'Alimentação' },
  { value: 'HEALTH', label: 'Saúde' },
  { value: 'BEAUTY', label: 'Beleza' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'ENTERTAINMENT', label: 'Entretenimento' },
  { value: 'SERVICES', label: 'Serviços' },
  { value: 'SPORTS', label: 'Esportes' },
  { value: 'TRANSPORT', label: 'Transporte' },
];
const benefitTypes: readonly Readonly<{ value: PreferredBenefitType; label: string }>[] = [
  { value: 'DISCOUNT', label: 'Descontos' },
  { value: 'CASHBACK', label: 'Cashback' },
  { value: 'POINTS', label: 'Pontos' },
  { value: 'EXPERIENCE', label: 'Experiências' },
  { value: 'SERVICE', label: 'Serviços' },
];
const frequencyOptions: readonly Readonly<{
  value: DeclaredConsumptionFrequency;
  label: string;
}>[] = [
  { value: 'WEEKLY', label: 'Semanalmente' },
  { value: 'MONTHLY', label: 'Mensalmente' },
  { value: 'OCCASIONAL', label: 'Ocasionalmente' },
];
const spendOptions: readonly Readonly<{ value: DeclaredSpendRange; label: string }>[] = [
  { value: 'UP_TO_100', label: 'Até R$ 100' },
  { value: '100_TO_500', label: 'De R$ 100 a R$ 500' },
  { value: '500_TO_1500', label: 'De R$ 500 a R$ 1.500' },
  { value: 'OVER_1500', label: 'Acima de R$ 1.500' },
];

type ContactDetails = Readonly<{ email: string; phone: string }>;
type FieldErrors = Partial<Record<'fullName' | 'email' | 'phone', RegistrationFailure>>;

function toggleChoice<T extends string>(choices: readonly T[], choice: T): readonly T[] {
  return choices.includes(choice)
    ? choices.filter((item) => item !== choice)
    : [...choices, choice];
}

function describeFailure(reason: RegistrationFailure): string {
  switch (reason) {
    case 'INVALID_FULL_NAME':
      return 'Informe seu nome completo com pelo menos 3 caracteres.';
    case 'INVALID_EMAIL':
      return 'Confira o formato do e-mail informado.';
    case 'INVALID_PHONE':
      return 'Confira o formato do telefone informado.';
    case 'DUPLICATE_ID':
    case 'DUPLICATE_PUBLIC_CODE':
    case 'DUPLICATE_NATIONAL_TAX_IDENTIFIER':
      return 'Não foi possível concluir: os dados informados já estão associados a um cadastro demonstrativo.';
    default:
      return 'Não foi possível concluir o cadastro demonstrativo. Revise os dados e tente novamente.';
  }
}

export function ConsumerRegistrationPage() {
  const { registerConsumer, updateConsumerProfileData } = useConsumerRegistration();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [contacts, setContacts] = useState<ContactDetails>({ email: '', phone: '' });
  const [preferences, setPreferences] = useState<ConsumerPreferences>({});
  const [personalizationChoice, setPersonalizationChoice] = useState(false);
  const [promotionalEmailChoice, setPromotionalEmailChoice] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registeredIdentityId, setRegisteredIdentityId] = useState<PersonIdentityId | null>(null);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const submittingRef = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (errors.fullName) nameInput.current?.focus();
    else if (errors.email) emailInput.current?.focus();
    else if (errors.phone) phoneInput.current?.focus();
  }, [errors]);

  function validateCurrentStep(): boolean {
    if (step === 0) {
      const failure = validatePersonFullName(fullName);
      setErrors(failure ? { fullName: failure } : {});
      return !failure;
    }
    if (step === 1) {
      const emailFailure = validatePersonContacts({ email: contacts.email });
      const contactFailure = validatePersonContacts(contacts);
      const nextErrors: FieldErrors = {
        ...(emailFailure === 'INVALID_EMAIL' ? { email: emailFailure } : {}),
        ...(contactFailure === 'INVALID_PHONE' ? { phone: contactFailure } : {}),
      };
      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    }
    setErrors({});
    return true;
  }

  function buildProfileData() {
    const communicationChannels = promotionalEmailChoice ? (['EMAIL'] as const) : undefined;
    const nextPreferences: ConsumerPreferences = {
      ...preferences,
      ...(personalizationChoice ? { personalizationEnabled: true } : {}),
      ...(communicationChannels ? { communicationChannels } : {}),
    };
    const hasPreferences = Object.keys(nextPreferences).length > 0;
    const declaredConsumption =
      preferences.declaredFrequency || preferences.declaredSpendRange
        ? {
            source: 'DECLARED' as const,
            ...(preferences.declaredFrequency ? { frequency: preferences.declaredFrequency } : {}),
            ...(preferences.declaredSpendRange
              ? { spendRange: preferences.declaredSpendRange }
              : {}),
          }
        : undefined;
    if (!hasPreferences && !declaredConsumption) {
      return undefined;
    }
    return {
      ...(hasPreferences ? { preferences: nextPreferences } : {}),
      ...(declaredConsumption ? { declaredConsumption } : {}),
    };
  }

  function completeRegistration() {
    if (submittingRef.current || complete) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmissionError(null);
    const profileData = buildProfileData();
    const result =
      editingPreferences && registeredIdentityId
        ? updateConsumerProfileData(registeredIdentityId, profileData)
        : registerConsumer({
            fullName,
            contacts: {
              email: contacts.email,
              ...(contacts.phone.trim() ? { phone: contacts.phone } : {}),
            },
            ...(profileData ? { profileData } : {}),
          });
    if (!result.success) {
      setSubmissionError(describeFailure(result.reason));
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }
    setRegisteredIdentityId(result.value.identity.id);
    setEditingPreferences(false);
    setComplete(true);
    setSubmitting(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < stepNames.length - 1) {
      if (validateCurrentStep()) setStep((current) => current + 1);
      return;
    }
    const nameFailure = validatePersonFullName(fullName);
    const emailFailure = validatePersonContacts({ email: contacts.email });
    const contactFailure = validatePersonContacts(contacts);
    if (!nameFailure && !contactFailure) {
      completeRegistration();
      return;
    }
    setSubmissionError('Revise o nome e os dados de contato antes de concluir.');
    if (nameFailure) {
      setStep(0);
      setErrors({ fullName: nameFailure });
    } else {
      setStep(1);
      setErrors({
        ...(emailFailure === 'INVALID_EMAIL' ? { email: emailFailure } : {}),
        ...(contactFailure === 'INVALID_PHONE' ? { phone: contactFailure } : {}),
      });
    }
  }

  function skipPreferences() {
    setPreferences({});
    setStep(3);
  }

  if (complete) {
    return (
      <main className="consumer-onboarding" aria-labelledby="registration-complete-title">
        <Card className="consumer-onboarding-card consumer-registration-success">
          <span className="consumer-onboarding-icon consumer-onboarding-icon--success">
            <Check aria-hidden="true" />
          </span>
          <span className="ui-badge ui-badge--neutral">CADASTRO DEMONSTRATIVO</span>
          <h1 id="registration-complete-title">Cadastro concluído!</h1>
          <p>
            Seu perfil de Consumidor foi criado apenas nesta demonstração. Nenhuma conta foi
            autenticada e seus dados não foram enviados nem salvos fora desta sessão.
          </p>
          <p>
            A descoberta abaixo é independente: ela abre o cenário fictício pré-configurado e não
            utiliza este cadastro nem cria vínculo com empresas.
          </p>
          <div className="consumer-onboarding-next-step">
            <strong>Próximo passo</strong>
            <span>Conheça as empresas fictícias disponíveis na demonstração.</span>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              submittingRef.current = false;
              setComplete(false);
              setEditingPreferences(true);
              setSubmissionError(null);
              setStep(2);
            }}
          >
            Atualizar preferências do perfil
          </Button>
          <Link
            className="ui-button ui-button--primary"
            to={routes.demoCompanies}
            state={{ demoContext: 'CONSUMER' }}
          >
            Descobrir empresas demonstrativas <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link className="consumer-onboarding-back-link" to={routes.demo}>
            Voltar à seleção de experiências
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="consumer-onboarding" aria-labelledby="consumer-registration-title">
      <header className="consumer-onboarding-heading">
        <span className="consumer-onboarding-icon">
          <UserRound aria-hidden="true" />
        </span>
        <span className="ui-badge ui-badge--neutral">AMBIENTE DE DEMONSTRAÇÃO</span>
        <h1 id="consumer-registration-title">
          {editingPreferences ? 'Atualizar preferências' : 'Cadastro de Consumidor'}
        </h1>
        <p>
          {editingPreferences
            ? 'Altere as preferências declaradas neste perfil demonstrativo.'
            : 'Crie um perfil demonstrativo em etapas. Suas preferências são opcionais.'}
        </p>
      </header>

      <Card className="consumer-onboarding-card">
        <div className="consumer-onboarding-progress">
          <div className="consumer-onboarding-progress-label">
            <span>
              Etapa {step + 1} de {stepNames.length}
            </span>
            <strong>{stepNames[step]}</strong>
          </div>
          <progress aria-label="Progresso do cadastro" value={step + 1} max={stepNames.length} />
          <ol aria-label="Etapas do cadastro">
            {stepNames.map((name, index) => (
              <li key={name} aria-current={index === step ? 'step' : undefined}>
                <span>{index + 1}</span>
                <span>{name}</span>
              </li>
            ))}
          </ol>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          {step === 0 && (
            <section aria-labelledby="registration-identification-title">
              <h2 id="registration-identification-title">Como podemos chamar você?</h2>
              <p>Informe somente seu nome. Não use dados reais sensíveis nesta demonstração.</p>
              <label htmlFor="consumer-full-name">
                Nome completo
                <input
                  ref={nameInput}
                  autoComplete="name"
                  id="consumer-full-name"
                  name="fullName"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    setErrors((current) => ({ ...current, fullName: undefined }));
                  }}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? 'consumer-full-name-error' : 'consumer-name-help'
                  }
                />
              </label>
              {errors.fullName ? (
                <p className="consumer-onboarding-error" id="consumer-full-name-error" role="alert">
                  {describeFailure(errors.fullName)}
                </p>
              ) : (
                <p className="consumer-onboarding-help" id="consumer-name-help">
                  O código Vinkar demonstrativo será gerado automaticamente.
                </p>
              )}
            </section>
          )}

          {step === 1 && (
            <section aria-labelledby="registration-contact-title">
              <h2 id="registration-contact-title">Como podemos entrar em contato?</h2>
              <p>O e-mail é obrigatório no modelo demonstrativo. Nenhuma mensagem será enviada.</p>
              <label htmlFor="consumer-email">
                E-mail
                <input
                  ref={emailInput}
                  autoComplete="email"
                  id="consumer-email"
                  name="email"
                  type="email"
                  value={contacts.email}
                  onChange={(event) => {
                    setContacts((current) => ({ ...current, email: event.target.value }));
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'consumer-email-error' : undefined}
                />
              </label>
              {errors.email && (
                <p className="consumer-onboarding-error" id="consumer-email-error" role="alert">
                  {describeFailure(errors.email)}
                </p>
              )}
              <label htmlFor="consumer-phone">
                Telefone <span>(opcional)</span>
                <input
                  ref={phoneInput}
                  autoComplete="tel"
                  id="consumer-phone"
                  name="phone"
                  type="tel"
                  value={contacts.phone}
                  onChange={(event) => {
                    setContacts((current) => ({ ...current, phone: event.target.value }));
                    setErrors((current) => ({ ...current, phone: undefined }));
                  }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'consumer-phone-error' : undefined}
                />
              </label>
              {errors.phone && (
                <p className="consumer-onboarding-error" id="consumer-phone-error" role="alert">
                  {describeFailure(errors.phone)}
                </p>
              )}
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="registration-preferences-title">
              <h2 id="registration-preferences-title">O que você gosta?</h2>
              <p>
                Esta etapa é opcional. Respostas são declaradas por você e não comprovam consumo.
              </p>
              <fieldset>
                <legend>Categorias de interesse</legend>
                <div className="consumer-onboarding-choice-grid">
                  {categories.map(({ value, label }) => (
                    <label className="consumer-onboarding-choice" key={value}>
                      <input
                        type="checkbox"
                        checked={preferences.interestCategories?.includes(value) ?? false}
                        onChange={() =>
                          setPreferences((current) => ({
                            ...current,
                            interestCategories: toggleChoice(
                              current.interestCategories ?? [],
                              value,
                            ),
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="consumer-frequency">
                Frequência aproximada que você declara
                <select
                  id="consumer-frequency"
                  value={preferences.declaredFrequency ?? ''}
                  onChange={(event) => {
                    const value = frequencyOptions.find(
                      (option) => option.value === event.target.value,
                    )?.value;
                    setPreferences((current) => ({ ...current, declaredFrequency: value }));
                  }}
                >
                  <option value="">Prefiro não informar</option>
                  {frequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="consumer-spend-range">
                Faixa aproximada de gasto que você declara
                <select
                  id="consumer-spend-range"
                  value={preferences.declaredSpendRange ?? ''}
                  onChange={(event) => {
                    const value = spendOptions.find(
                      (option) => option.value === event.target.value,
                    )?.value;
                    setPreferences((current) => ({ ...current, declaredSpendRange: value }));
                  }}
                >
                  <option value="">Prefiro não informar</option>
                  {spendOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset>
                <legend>Benefícios de sua preferência</legend>
                <div className="consumer-onboarding-choice-grid">
                  {benefitTypes.map(({ value, label }) => (
                    <label className="consumer-onboarding-choice" key={value}>
                      <input
                        type="checkbox"
                        checked={preferences.preferredBenefitTypes?.includes(value) ?? false}
                        onChange={() =>
                          setPreferences((current) => ({
                            ...current,
                            preferredBenefitTypes: toggleChoice(
                              current.preferredBenefitTypes ?? [],
                              value,
                            ),
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="registration-privacy-title">
              <h2 id="registration-privacy-title">Privacidade e suas escolhas</h2>
              <div className="consumer-onboarding-privacy-item">
                <strong>Dados necessários à demonstração</strong>
                <p>
                  Nome e e-mail são usados para montar o perfil demonstrativo e apresentar a
                  confirmação. O telefone é opcional. Nada é enviado a empresas ou terceiros.
                </p>
              </div>
              <label className="consumer-onboarding-choice">
                <input
                  type="checkbox"
                  checked={personalizationChoice}
                  onChange={(event) => setPersonalizationChoice(event.target.checked)}
                />
                Quero permitir preferências de personalização na demonstração.
              </label>
              <p className="consumer-onboarding-help">
                Se desmarcada, suas escolhas não serão sinalizadas como autorização para
                personalização.
              </p>
              <label className="consumer-onboarding-choice">
                <input
                  type="checkbox"
                  checked={promotionalEmailChoice}
                  onChange={(event) => setPromotionalEmailChoice(event.target.checked)}
                />
                Quero indicar preferência por comunicações promocionais por e-mail.
              </label>
              <p className="consumer-onboarding-help">
                Esta é apenas uma preferência demonstrativa. Nenhum e-mail será enviado.
              </p>
              <p className="consumer-onboarding-disclaimer">
                Estas escolhas não são consentimentos jurídicos nem comprovam conformidade legal. Os
                dados permanecem somente na memória desta sessão.
              </p>
            </section>
          )}

          {step === 4 && (
            <section aria-labelledby="registration-review-title">
              <h2 id="registration-review-title">Revise seu cadastro</h2>
              <p>Confira as informações antes de concluir. Você pode voltar e editar cada etapa.</p>
              <dl className="consumer-onboarding-review">
                <div>
                  <dt>Nome</dt>
                  <dd>{fullName.trim() || 'Não informado'}</dd>
                  {!editingPreferences && (
                    <button type="button" onClick={() => setStep(0)}>
                      Editar identificação
                    </button>
                  )}
                </div>
                <div>
                  <dt>E-mail</dt>
                  <dd>{contacts.email.trim() || 'Não informado'}</dd>
                  <dt>Telefone</dt>
                  <dd>{contacts.phone.trim() || 'Não informado'}</dd>
                  {!editingPreferences && (
                    <button type="button" onClick={() => setStep(1)}>
                      Editar contato
                    </button>
                  )}
                </div>
                <div>
                  <dt>Preferências</dt>
                  <dd>
                    {preferences.interestCategories?.length
                      ? preferences.interestCategories
                          .map(
                            (value) =>
                              categories.find((category) => category.value === value)?.label,
                          )
                          .join(', ')
                      : 'Nenhuma preferência informada'}
                  </dd>
                  {preferences.declaredFrequency && (
                    <dd>
                      Frequência declarada:{' '}
                      {
                        frequencyOptions.find(
                          (option) => option.value === preferences.declaredFrequency,
                        )?.label
                      }
                    </dd>
                  )}
                  {preferences.declaredSpendRange && (
                    <dd>
                      Faixa de gasto declarada:{' '}
                      {
                        spendOptions.find(
                          (option) => option.value === preferences.declaredSpendRange,
                        )?.label
                      }
                    </dd>
                  )}
                  {preferences.preferredBenefitTypes?.length ? (
                    <dd>
                      Benefícios preferidos:{' '}
                      {preferences.preferredBenefitTypes
                        .map(
                          (value) => benefitTypes.find((benefit) => benefit.value === value)?.label,
                        )
                        .join(', ')}
                    </dd>
                  ) : null}
                  <button type="button" onClick={() => setStep(2)}>
                    Editar preferências
                  </button>
                </div>
                <div>
                  <dt>Escolhas opcionais</dt>
                  <dd>Personalização: {personalizationChoice ? 'ativada' : 'não selecionada'}</dd>
                  <dd>
                    Comunicações promocionais por e-mail:{' '}
                    {promotionalEmailChoice ? 'selecionada' : 'não selecionada'}
                  </dd>
                  <button type="button" onClick={() => setStep(3)}>
                    Editar privacidade
                  </button>
                </div>
              </dl>
            </section>
          )}

          {submissionError && (
            <p className="consumer-onboarding-error" role="alert">
              {submissionError}
            </p>
          )}

          <div className="consumer-onboarding-actions">
            {((step > 0 && !editingPreferences) || (editingPreferences && step > 2)) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSubmissionError(null);
                  setErrors({});
                  setStep((current) => Math.max(editingPreferences ? 2 : 0, current - 1));
                }}
              >
                <ArrowLeft size={17} aria-hidden="true" /> Voltar
              </Button>
            )}
            {step === 2 && (
              <Button variant="subtle" onClick={skipPreferences}>
                Pular esta etapa
              </Button>
            )}
            <Button className="consumer-onboarding-continue" type="submit" disabled={submitting}>
              {step === 4 ? (
                submitting ? (
                  'Salvando...'
                ) : editingPreferences ? (
                  'Salvar preferências'
                ) : (
                  'Concluir cadastro demonstrativo'
                )
              ) : (
                <>
                  Continuar <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
      <Link className="consumer-onboarding-back-link" to={routes.demoLoginConsumer}>
        Já conhece a Vinkar? Ir para o login demonstrativo
      </Link>
    </main>
  );
}
