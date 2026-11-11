import { describe, expect, it } from 'vitest';
import type {
  MainCompanyMembership,
  Organization,
  OrganizationId,
  PersonIdentityId,
} from './models';
import {
  activatePersonalProfile,
  authorizeOrganizationPersonalDataAccess,
  createOrganizationRegistration,
  createPersonIdentity,
  hasOrganizationAdministratorRole,
  InMemoryPersonIdentityRepository,
  isPurposeRecordComplete,
  transitionOrganizationRegistration,
  transitionOrganizationValidation,
  transitionPersonRegistration,
  toPublicPersonRegistrationStatus,
  updatePersonIdentity,
} from './registration';
import type {
  ConsumerProfileData,
  DeclaredConsumptionData,
  ObservedConsumptionData,
  OrganizationAdministratorAssignment,
  OrganizationRegistration,
  PersonalProfile,
  RegistrationAuditEvent,
} from './registrationModels';
import { getConsumerNetworkEligibility } from './networkEligibility';
import { demoCompanies, demoOrganizationConnections } from '../mocks/companyNetwork';
import { getDemoScenario } from '../mocks/demoScenarios';

const now = new Date('2026-11-09T12:00:00.000Z');
const otherPersonId = 'person-demo-registration-002' as PersonIdentityId;
const organizationId = 'organization-demo-registration-001' as OrganizationId;

function personInput(sequence = 1) {
  return {
    id: `person-demo-registration-${String(sequence).padStart(3, '0')}` as PersonIdentityId,
    publicRegistrationCode: `VK-DEMO-REG-${String(sequence).padStart(3, '0')}` as const,
    fullName: '  Marina   Pessoa Demonstrativa ',
    contacts: { email: `person${sequence}@example.test`, phone: '+55 (00) 00000-0000' },
    createdAt: now,
  };
}

function requirePerson(sequence = 1) {
  const result = createPersonIdentity(personInput(sequence));
  if (!result.success) {
    throw new Error(`Não foi possível criar identidade de teste: ${result.reason}`);
  }
  return result.value;
}

function requireActivePerson(sequence = 1) {
  const submitted = transitionPersonRegistration(requirePerson(sequence), 'SUBMITTED', now);
  if (!submitted.success) throw new Error('Falha ao submeter identidade de teste.');
  const active = transitionPersonRegistration(submitted.value, 'ACTIVE', now);
  if (!active.success) throw new Error('Falha ao ativar identidade de teste.');
  return active.value;
}

function profile(
  id: PersonalProfile['id'],
  personIdentityId: PersonIdentityId,
  type: PersonalProfile['type'],
  status: PersonalProfile['status'] = 'DRAFT',
): PersonalProfile {
  return { id, personIdentityId, type, status };
}

function createOrgRequest(
  responsible = requirePerson(1),
  requestedByPersonIdentityId = responsible.id,
) {
  return createOrganizationRegistration(
    {
      id: 'organization-registration-demo-001',
      organization: {
        id: organizationId,
        displayName: '  Organização   de Teste ',
        contacts: { email: 'company@example.test' },
      },
      requestedByPersonIdentityId,
      responsiblePersonIdentityId: responsible.id,
      createdAt: now,
    },
    [responsible],
  );
}

function activateOrganizationRegistration(
  registration: OrganizationRegistration,
  responsible = requirePerson(1),
) {
  const personSubmitted = transitionPersonRegistration(responsible, 'SUBMITTED', now);
  if (!personSubmitted.success) throw new Error('Falha ao submeter identidade responsável.');
  const personActive = transitionPersonRegistration(personSubmitted.value, 'ACTIVE', now);
  if (!personActive.success) throw new Error('Falha ao ativar identidade responsável.');
  const submitted = transitionOrganizationRegistration(
    registration,
    'SUBMITTED',
    personActive.value,
    now,
  );
  if (!submitted.success) throw new Error('Falha ao submeter cadastro de organização.');
  const underReview = transitionOrganizationRegistration(
    submitted.value,
    'UNDER_REVIEW',
    personActive.value,
    now,
  );
  if (!underReview.success) throw new Error('Falha ao iniciar análise da organização.');
  const validationInReview = transitionOrganizationValidation(underReview.value, 'IN_REVIEW', now);
  if (!validationInReview.success) throw new Error('Falha ao iniciar validação.');
  const validator = requireActivePerson(9);
  const verified = transitionOrganizationValidation(
    validationInReview.value,
    'VERIFIED',
    now,
    {
      decidedByPersonIdentityId: validator.id,
      evidenceReference: 'verification-evidence-demo-001',
    },
    [validator],
  );
  if (!verified.success) throw new Error('Falha ao concluir validação.');
  return transitionOrganizationRegistration(verified.value, 'ACTIVE', personActive.value, now);
}

describe('fundação cadastral e regras de identidade', () => {
  it('cria identidade única com identificadores interno e público distintos', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const result = repository.create(personInput());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.id).not.toBe(result.value.publicRegistrationCode);
    expect(result.value.fullName).toBe('Marina Pessoa Demonstrativa');
    expect(result.value.registrationStatus).toBe('DRAFT');
    expect(repository.findById(result.value.id)).toBe(result.value);
    expect(repository.create(personInput())).toEqual({
      success: false,
      reason: 'DUPLICATE_ID',
    });
  });

  it('conclui identidade e perfil CONSUMER antes de registrar qualquer estado', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const result = repository.registerConsumer({
      identity: personInput(),
      profileId: 'personal-profile-demo-onboarding-001',
      profileData: {
        preferences: {
          interestCategories: ['FOOD'],
          declaredFrequency: 'MONTHLY',
          declaredSpendRange: '500_TO_1500',
          preferredBenefitTypes: ['DISCOUNT'],
          personalizationEnabled: true,
          communicationChannels: ['EMAIL'],
        },
        declaredConsumption: {
          source: 'DECLARED',
          frequency: 'MONTHLY',
          spendRange: '500_TO_1500',
        },
      },
    });

    expect(result).toMatchObject({
      success: true,
      value: {
        identity: {
          registrationStatus: 'ACTIVE',
          id: personInput().id,
        },
        profile: {
          personIdentityId: personInput().id,
          type: 'CONSUMER',
          status: 'ACTIVE',
        },
        profileData: {
          preferences: {
            interestCategories: ['FOOD'],
            declaredFrequency: 'MONTHLY',
            declaredSpendRange: '500_TO_1500',
            preferredBenefitTypes: ['DISCOUNT'],
            personalizationEnabled: true,
            communicationChannels: ['EMAIL'],
          },
          declaredConsumption: {
            source: 'DECLARED',
            frequency: 'MONTHLY',
            spendRange: '500_TO_1500',
          },
        },
      },
    });
    expect(repository.findById(personInput().id)).toBe(
      result.success ? result.value.identity : undefined,
    );
  });

  it('não registra identidade parcial quando dados são inválidos ou duplicados', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const invalid = repository.registerConsumer({
      identity: { ...personInput(), contacts: { email: 'inválido' } },
      profileId: 'personal-profile-demo-onboarding-invalid',
    });
    expect(invalid).toEqual({ success: false, reason: 'INVALID_EMAIL' });
    expect(repository.findById(personInput().id)).toBeUndefined();

    const registered = repository.registerConsumer({
      identity: personInput(),
      profileId: 'personal-profile-demo-onboarding-001',
    });
    const duplicate = repository.registerConsumer({
      identity: personInput(),
      profileId: 'personal-profile-demo-onboarding-002',
    });

    expect(registered.success).toBe(true);
    expect(duplicate).toEqual({ success: false, reason: 'DUPLICATE_ID' });
    expect(repository.findById(personInput().id)?.registrationStatus).toBe('ACTIVE');
  });

  it('recusa no repositório o código público já usado por um cenário demonstrativo', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const scenario = getDemoScenario('scenario-demo-consumer-free');
    if (!scenario || scenario.context !== 'CONSUMER') {
      throw new Error('Cenário de Consumidor esperado para teste.');
    }
    const reserved = repository.create({
      id: scenario.session.personIdentity.id,
      publicRegistrationCode: scenario.session.personIdentity.publicRegistrationCode,
      fullName: scenario.session.personIdentity.fullName,
      contacts: scenario.session.personIdentity.contacts,
      createdAt: new Date(scenario.session.personIdentity.createdAtUtc),
    });
    expect(reserved.success).toBe(true);

    const collision = repository.registerConsumer({
      identity: {
        ...personInput(2),
        publicRegistrationCode: scenario.session.personIdentity.publicRegistrationCode,
      },
      profileId: 'personal-profile-demo-onboarding-collision',
    });
    expect(collision).toEqual({ success: false, reason: 'DUPLICATE_PUBLIC_CODE' });
    expect(repository.findById(personInput(2).id)).toBeUndefined();
  });

  it('atualiza preferências depois do cadastro sem trocar identidade ou perfil', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const created = repository.registerConsumer({
      identity: personInput(),
      profileId: 'personal-profile-demo-onboarding-001',
    });
    if (!created.success) throw new Error('Falha ao criar perfil demonstrativo.');

    const updated = repository.updateConsumerProfileData(created.value.identity.id, {
      preferences: { interestCategories: ['HEALTH'] },
      declaredConsumption: { source: 'DECLARED', spendRange: '100_TO_500' },
    });

    expect(updated).toMatchObject({
      success: true,
      value: {
        identity: created.value.identity,
        profile: created.value.profile,
        profileData: {
          preferences: { interestCategories: ['HEALTH'] },
          declaredConsumption: {
            source: 'DECLARED',
            spendRange: '100_TO_500',
          },
        },
      },
    });
    expect(
      repository.updateConsumerProfileData(created.value.identity.id, undefined),
    ).toMatchObject({
      success: true,
      value: { identity: created.value.identity, profile: created.value.profile },
    });
    expect(repository.updateConsumerProfileData('person-demo-missing', undefined)).toEqual({
      success: false,
      reason: 'IDENTITY_NOT_FOUND',
    });
  });

  it('copia e congela preferências para não manter referências mutáveis do formulário', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const interestCategories: ('FOOD' | 'HEALTH')[] = ['FOOD'];
    const result = repository.registerConsumer({
      identity: personInput(),
      profileId: 'personal-profile-demo-onboarding-001',
      profileData: { preferences: { interestCategories } },
    });

    interestCategories.push('HEALTH');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.value.profileData?.preferences?.interestCategories).toEqual(['FOOD']);
    expect(Object.isFrozen(result.value.profileData?.preferences?.interestCategories)).toBe(true);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.identity)).toBe(true);
    expect(Object.isFrozen(result.value.profile)).toBe(true);
    expect(Reflect.set(result.value.identity, 'fullName', 'Alterado')).toBe(false);
    expect(repository.findById(result.value.identity.id)?.fullName).toBe(
      'Marina Pessoa Demonstrativa',
    );
  });

  it.each([
    ['publicRegistrationCode', { publicRegistrationCode: 'not-a-vinkar-code' }],
    ['fullName', { fullName: '  X ' }],
    ['email', { contacts: { email: 'invalid' } }],
    ['phone', { contacts: { email: 'valid@example.test', phone: 'bad-phone' } }],
    [
      'nationalTaxIdentifier',
      {
        nationalTaxIdentifier: { countryCode: 'USA', value: 'TEST-ID-001' },
      },
    ],
  ])('rejeita dados cadastrais inválidos em %s', (_field, invalidFields) => {
    const result = createPersonIdentity({
      ...personInput(),
      ...invalidFields,
    });

    expect(result.success).toBe(false);
  });

  it('impede duplicidade de identificador fiscal nacional normalizado', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const first = repository.create({
      ...personInput(),
      nationalTaxIdentifier: { countryCode: 'US', value: 'TEST-TAX-001' },
    });
    const duplicate = repository.create({
      ...personInput(2),
      nationalTaxIdentifier: { countryCode: 'us', value: 'testtax001' },
    });
    const sameValueDifferentCountry = repository.create({
      ...personInput(3),
      nationalTaxIdentifier: { countryCode: 'CA', value: 'testtax001' },
    });

    expect(first.success).toBe(true);
    expect(duplicate).toEqual({ success: false, reason: 'DUPLICATE_NATIONAL_TAX_IDENTIFIER' });
    expect(sameValueDifferentCountry.success).toBe(true);
  });

  it('permite remover identificador fiscal opcional sem alterar identidade interna', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const created = repository.create({
      ...personInput(),
      nationalTaxIdentifier: { countryCode: 'US', value: 'OPTIONAL-TAX-001' },
    });
    if (!created.success) throw new Error('Falha ao criar identidade com identificador fiscal.');

    const updated = repository.update(created.value.id, { nationalTaxIdentifier: undefined }, now);

    expect(updated).toMatchObject({ success: true, value: { id: created.value.id } });
    expect(repository.findById(created.value.id)).not.toHaveProperty('nationalTaxIdentifier');
  });

  it('impede duplicidade de código público sem usar o código como chave técnica', () => {
    const repository = new InMemoryPersonIdentityRepository();
    repository.create(personInput());
    const duplicate = repository.create({
      ...personInput(2),
      publicRegistrationCode: ' vk-demo-reg-001 ',
    });

    expect(duplicate).toEqual({ success: false, reason: 'DUPLICATE_PUBLIC_CODE' });
    expect(repository.findById(personInput().id)).toBeDefined();
  });

  it('mantém o repositório inalterado quando uma atualização viola unicidade', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const first = repository.create({
      ...personInput(1),
      nationalTaxIdentifier: { countryCode: 'US', value: 'SHARED-TAX-ID' },
    });
    const second = repository.create(personInput(2));
    if (!first.success || !second.success) throw new Error('Falha ao criar identidades de teste.');

    const failedUpdate = repository.update(
      second.value.id,
      {
        nationalTaxIdentifier: { countryCode: 'US', value: ' shared-tax-id ' },
        fullName: 'Alteração que deve ser atômica',
      },
      now,
    );

    expect(failedUpdate).toEqual({
      success: false,
      reason: 'DUPLICATE_NATIONAL_TAX_IDENTIFIER',
    });
    expect(repository.findById(second.value.id)).toBe(second.value);
    expect(repository.findById(second.value.id)?.fullName).toBe('Marina Pessoa Demonstrativa');

    const duplicateCodeUpdate = repository.update(
      second.value.id,
      { publicRegistrationCode: ' vk-demo-reg-001 ' },
      now,
    );
    expect(duplicateCodeUpdate).toEqual({
      success: false,
      reason: 'DUPLICATE_PUBLIC_CODE',
    });
    expect(repository.findById(second.value.id)).toBe(second.value);
  });

  it('mantém CONSUMER e BENEFICIARY mutuamente exclusivos enquanto ativos', () => {
    const identity = requireActivePerson();
    const consumer = profile(
      'personal-profile-demo-consumer-001',
      identity.id,
      'CONSUMER',
      'ACTIVE',
    );
    const beneficiary = profile(
      'personal-profile-demo-beneficiary-001',
      identity.id,
      'BENEFICIARY',
    );

    expect(activatePersonalProfile(beneficiary, identity, [consumer])).toEqual({
      success: false,
      reason: 'ACTIVE_PERSONAL_PROFILE_EXISTS',
    });
    expect(activatePersonalProfile(beneficiary, identity, [])).toMatchObject({
      success: true,
      value: { status: 'ACTIVE' },
    });
    expect(activatePersonalProfile(beneficiary, requireActivePerson(2), [])).toEqual({
      success: false,
      reason: 'PROFILE_IDENTITY_MISMATCH',
    });
  });

  it('permite administrador empresarial sem perfil pessoal', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    expect(request.success).toBe(true);
    if (!request.success) return;

    const activated = activateOrganizationRegistration(request.value, person);

    expect(activated.success).toBe(true);
    if (!activated.success) return;
    expect(activated.value.administrators[0]).toMatchObject({
      personIdentityId: person.id,
      role: 'ADMINISTRATOR',
      status: 'ACTIVE',
    });
    expect('personalProfile' in person).toBe(false);
  });

  it('mantém papel organizacional independente de um perfil pessoal existente', () => {
    const person = requirePerson();
    const personalProfile = profile(
      'personal-profile-demo-consumer-existing',
      person.id,
      'CONSUMER',
      'ACTIVE',
    );
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const activated = activateOrganizationRegistration(request.value, person);

    expect(personalProfile.personIdentityId).toBe(person.id);
    expect(activated.success).toBe(true);
    if (activated.success) {
      expect(activated.value.administrators[0]?.personIdentityId).toBe(
        personalProfile.personIdentityId,
      );
      expect(activated.value.administrators[0]?.role).toBe('ADMINISTRATOR');
    }
  });

  it('exige Pessoa Física identificada como solicitante e responsável da organização', () => {
    const person = requirePerson();
    const missingResponsible = createOrganizationRegistration(
      {
        id: 'organization-registration-demo-missing',
        organization: {
          id: organizationId,
          displayName: 'Organização teste',
          contacts: {},
        },
        requestedByPersonIdentityId: person.id,
        responsiblePersonIdentityId: otherPersonId,
        createdAt: now,
      },
      [person],
    );
    const missingRequester = createOrgRequest(person, otherPersonId);

    expect(missingResponsible).toEqual({
      success: false,
      reason: 'RESPONSIBLE_PERSON_NOT_FOUND',
    });

    expect(missingRequester).toEqual({
      success: false,
      reason: 'REQUESTING_PERSON_NOT_FOUND',
    });
  });

  it('valida contato cadastral da organização sem presumir poderes legais do solicitante', () => {
    const person = requirePerson();
    const invalid = createOrganizationRegistration(
      {
        id: 'organization-registration-demo-invalid',
        organization: {
          id: organizationId,
          displayName: 'Organização de Teste',
          contacts: { email: 'email-invalido' },
        },
        requestedByPersonIdentityId: person.id,
        responsiblePersonIdentityId: person.id,
        createdAt: now,
      },
      [person],
    );

    expect(invalid).toEqual({ success: false, reason: 'INVALID_ORGANIZATION' });
    const valid = createOrgRequest(person);
    expect(valid).toMatchObject({
      success: true,
      value: {
        registrationStatus: 'DRAFT',
        validationStatus: 'NOT_STARTED',
        administrators: [{ role: 'ADMINISTRATOR', status: 'PENDING' }],
      },
    });
  });

  it('aplica fluxos distintos de transição para pessoa e organização', () => {
    const person = requirePerson();
    const personSubmitted = transitionPersonRegistration(person, 'SUBMITTED', now);
    expect(personSubmitted).toMatchObject({
      success: true,
      value: { registrationStatus: 'SUBMITTED' },
    });
    expect(transitionPersonRegistration(person, 'UNDER_REVIEW', now)).toEqual({
      success: false,
      reason: 'INVALID_REGISTRATION_TRANSITION',
    });

    const organization = createOrgRequest(person);
    expect(organization.success).toBe(true);
    if (!organization.success) return;
    expect(transitionOrganizationRegistration(organization.value, 'ACTIVE', person, now)).toEqual({
      success: false,
      reason: 'INVALID_REGISTRATION_TRANSITION',
    });
    expect(transitionOrganizationValidation(organization.value, 'IN_REVIEW', now)).toEqual({
      success: false,
      reason: 'ORGANIZATION_NOT_UNDER_REVIEW',
    });
  });

  it('exige validação empresarial e responsável ativo antes de ativar organização', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const submitted = transitionOrganizationRegistration(request.value, 'SUBMITTED', person, now);
    if (!submitted.success) throw new Error('Falha ao submeter cadastro.');
    const underReview = transitionOrganizationRegistration(
      submitted.value,
      'UNDER_REVIEW',
      person,
      now,
    );
    if (!underReview.success) throw new Error('Falha ao iniciar análise.');
    const validation = transitionOrganizationValidation(underReview.value, 'IN_REVIEW', now);
    if (!validation.success) throw new Error('Falha ao iniciar validação.');
    const validator = requireActivePerson(8);
    const verified = transitionOrganizationValidation(
      validation.value,
      'VERIFIED',
      now,
      {
        decidedByPersonIdentityId: validator.id,
        evidenceReference: 'verification-evidence-demo-002',
      },
      [validator],
    );
    if (!verified.success) throw new Error('Falha ao validar organização.');
    const inactiveResponsible = transitionPersonRegistration(person, 'SUBMITTED', now);
    if (!inactiveResponsible.success) throw new Error('Falha ao submeter identidade.');

    expect(
      transitionOrganizationRegistration(verified.value, 'ACTIVE', inactiveResponsible.value, now),
    ).toEqual({ success: false, reason: 'RESPONSIBLE_PERSON_NOT_ACTIVE' });
  });

  it('não confunde organização ativa com vínculo principal ativo', () => {
    const person = requirePerson();
    const organization = createOrgRequest(person);
    if (!organization.success) throw new Error('Cadastro de organização de teste inválido.');
    const activated = activateOrganizationRegistration(organization.value, person);
    if (!activated.success) throw new Error('Falha ao ativar organização.');

    const enrichedOrganization = {
      ...activated.value.organization,
      contacts: { email: 'private@example.test' },
      nationalTaxIdentifier: { countryCode: 'US', value: 'PRIVATE-TAX-ID' },
    };
    const network = getConsumerNetworkEligibility({
      personIdentityId: person.id,
      memberships: [
        {
          id: 'main-company-membership-demo-registration-001',
          personIdentityId: person.id,
          organizationId,
          status: 'ACTIVE',
          activatedAtUtc: now.toISOString(),
          approvedRequestId: 'membership-request-demo-registration-001',
          planAtActivation: 'FREE',
        },
      ] satisfies MainCompanyMembership[],
      organizations: [enrichedOrganization],
      connections: [],
    });

    expect(activated.value.registrationStatus).toBe('ACTIVE');
    expect(network.mainCompanies).toHaveLength(1);
    expect(network.organizations).toHaveLength(1);
    expect(network).not.toHaveProperty('fullName');
    expect(network).not.toHaveProperty('contacts');
    expect(network).not.toHaveProperty('nationalTaxIdentifier');
    expect(network.organizations[0]?.organization).toEqual({
      id: organizationId,
      displayName: 'Organização de Teste',
    });
  });

  it('mantém preferências opcionais e separa consumo declarado de observado', () => {
    const noPreferences: ConsumerProfileData = {};
    const preferences: ConsumerProfileData['preferences'] = {
      interestCategories: ['FOOD', 'HEALTH'] as const,
      declaredFrequency: 'WEEKLY' as const,
      personalizationEnabled: true,
    };
    const declared: DeclaredConsumptionData = {
      source: 'DECLARED',
      frequency: 'WEEKLY',
      spendRange: '100_TO_500',
    };
    const observed: ObservedConsumptionData = {
      source: 'OBSERVED',
      evidenceReference: 'transaction-batch-demo-001',
      observedAtUtc: now.toISOString(),
    };

    expect(noPreferences).toEqual({});
    expect(preferences?.declaredFrequency).toBe('WEEKLY');
    expect(declared.source).not.toBe(observed.source);
    expect(declared).not.toHaveProperty('evidenceReference');
  });

  it('protege identidade contra mutação e atualiza dados sem alterar o identificador interno', () => {
    const repository = new InMemoryPersonIdentityRepository();
    const created = repository.create(personInput());
    if (!created.success) throw new Error('Falha ao criar identidade.');
    const original = created.value;
    const updated = repository.update(original.id, { fullName: 'Nome Atualizado' }, now);

    expect(Object.isFrozen(original)).toBe(true);
    expect(Object.isFrozen(original.contacts)).toBe(true);
    expect(updated).toMatchObject({
      success: true,
      value: { id: original.id, fullName: 'Nome Atualizado' },
    });
    expect(original.fullName).toBe('Marina Pessoa Demonstrativa');
    const attemptedChanges = { id: otherPersonId, fullName: 'ID permanece estável' };
    const attemptedIdChange = updatePersonIdentity(original, attemptedChanges, now);
    expect(attemptedIdChange).toMatchObject({
      success: true,
      value: { id: original.id, fullName: 'ID permanece estável' },
    });
    expect(
      updatePersonIdentity(original, { fullName: 'Outro Nome' }, new Date(Number.NaN)),
    ).toEqual({ success: false, reason: 'INVALID_TIMESTAMP' });
    expect(
      updatePersonIdentity(
        original,
        { fullName: 'Data anterior' },
        new Date('2026-11-08T12:00:00.000Z'),
      ),
    ).toEqual({ success: false, reason: 'INVALID_TIMESTAMP' });
  });

  it('não expõe identificador interno, nome, contatos ou identificador fiscal no resumo público', () => {
    const identity = createPersonIdentity({
      ...personInput(),
      nationalTaxIdentifier: { countryCode: 'US', value: 'TESTTAX001' },
    });
    if (!identity.success) throw new Error('Falha ao criar identidade.');
    const publicSummary = toPublicPersonRegistrationStatus(identity.value);

    expect(publicSummary).toEqual({
      registrationStatus: 'DRAFT',
    });
    expect(publicSummary).not.toHaveProperty('id');
    expect(publicSummary).not.toHaveProperty('fullName');
    expect(publicSummary).not.toHaveProperty('contacts');
    expect(publicSummary).not.toHaveProperty('nationalTaxIdentifier');
    expect(publicSummary).not.toHaveProperty('publicRegistrationCode');
  });

  it('exige papel administrativo ativo e concessão explícita, limitada por finalidade e atributos', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const activated = activateOrganizationRegistration(request.value, person);
    if (!activated.success) throw new Error('Falha ao ativar organização.');
    const processingPurpose = {
      personIdentityId: otherPersonId,
      purposeId: 'membership-verification',
      description: 'Verificar solicitação iniciada pela pessoa.',
      legalBasis: 'CONSENT',
      consentChoice: 'GRANTED',
      policyVersion: 'demo-1',
      recordedAtUtc: now.toISOString(),
    } as const;
    const grant = {
      personIdentityId: otherPersonId,
      organizationId,
      processingPurpose,
      allowedAttributes: ['FULL_NAME'] as const,
      expiresAtUtc: '2026-11-10T00:00:00.000Z',
    } as const;
    const requestAccess = (administrators = activated.value.administrators) =>
      authorizeOrganizationPersonalDataAccess({
        actorPersonIdentityId: person.id,
        organizationId,
        organization: activated.value,
        subjectPersonIdentityId: otherPersonId,
        purposeId: 'membership-verification',
        requestedAttributes: ['FULL_NAME'],
        administrators,
        people: [requireActivePerson()],
        grant,
        at: now,
      });

    expect(requestAccess()).toMatchObject({ success: true });
    expect(requestAccess([])).toEqual({
      success: false,
      reason: 'ADMINISTRATOR_NOT_AUTHORIZED',
    });
    expect(
      authorizeOrganizationPersonalDataAccess({
        actorPersonIdentityId: person.id,
        organizationId,
        organization: activated.value,
        subjectPersonIdentityId: otherPersonId,
        purposeId: 'other-purpose',
        requestedAttributes: ['FULL_NAME'],
        administrators: activated.value.administrators,
        people: [requireActivePerson()],
        grant,
        at: now,
      }),
    ).toEqual({ success: false, reason: 'PURPOSE_MISMATCH' });
    expect(
      authorizeOrganizationPersonalDataAccess({
        actorPersonIdentityId: person.id,
        organizationId,
        organization: activated.value,
        subjectPersonIdentityId: otherPersonId,
        purposeId: 'membership-verification',
        requestedAttributes: ['CONTACTS'],
        administrators: activated.value.administrators,
        people: [requireActivePerson()],
        grant,
        at: now,
      }),
    ).toEqual({ success: false, reason: 'ATTRIBUTE_OUTSIDE_GRANT' });
    expect(isPurposeRecordComplete(processingPurpose)).toBe(true);
    expect(
      authorizeOrganizationPersonalDataAccess({
        actorPersonIdentityId: person.id,
        organizationId,
        organization: activated.value,
        subjectPersonIdentityId: otherPersonId,
        purposeId: 'membership-verification',
        requestedAttributes: ['FULL_NAME'],
        administrators: activated.value.administrators,
        people: [requireActivePerson()],
        grant: {
          ...grant,
          processingPurpose: { ...processingPurpose, consentChoice: 'WITHDRAWN' },
        },
        at: now,
      }),
    ).toEqual({ success: false, reason: 'CONSENT_NOT_GRANTED' });
  });

  it('recusa operações administrativas para identidade bloqueada e organização diferente', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const activated = activateOrganizationRegistration(request.value, person);
    if (!activated.success) throw new Error('Falha ao ativar organização.');
    const activeActor = requireActivePerson();
    const blockedActor = transitionPersonRegistration(activeActor, 'BLOCKED', now);
    if (!blockedActor.success) throw new Error('Falha ao bloquear identidade.');
    const processingPurpose = {
      personIdentityId: otherPersonId,
      purposeId: 'membership-verification',
      description: 'Verificar solicitação iniciada pela pessoa.',
      legalBasis: 'CONSENT',
      consentChoice: 'GRANTED',
      policyVersion: 'demo-1',
      recordedAtUtc: now.toISOString(),
    } as const;
    const grant = {
      personIdentityId: otherPersonId,
      organizationId,
      processingPurpose,
      allowedAttributes: ['FULL_NAME'] as const,
      expiresAtUtc: '2026-11-10T00:00:00.000Z',
    } as const;
    const common = {
      actorPersonIdentityId: activeActor.id,
      organizationId,
      organization: activated.value,
      subjectPersonIdentityId: otherPersonId,
      purposeId: processingPurpose.purposeId,
      requestedAttributes: ['FULL_NAME'] as const,
      administrators: activated.value.administrators,
      grant,
      at: now,
    };

    expect(
      authorizeOrganizationPersonalDataAccess({
        ...common,
        people: [blockedActor.value],
      }),
    ).toEqual({ success: false, reason: 'ACTOR_NOT_ACTIVE' });
    expect(
      authorizeOrganizationPersonalDataAccess({
        ...common,
        organizationId: 'organization-demo-another' as OrganizationId,
        people: [activeActor],
      }),
    ).toEqual({ success: false, reason: 'ORGANIZATION_MISMATCH' });
  });

  it('rejeita timestamps fora de ordem em transições cadastrais', () => {
    const person = requirePerson();
    const organization = createOrgRequest(person);
    if (!organization.success) throw new Error('Cadastro de organização de teste inválido.');
    const submitted = transitionOrganizationRegistration(
      organization.value,
      'SUBMITTED',
      person,
      now,
    );
    if (!submitted.success) throw new Error('Falha ao submeter organização.');
    const timeBeforeSubmission = new Date('2026-11-09T11:00:00.000Z');

    expect(
      transitionOrganizationRegistration(
        submitted.value,
        'UNDER_REVIEW',
        person,
        timeBeforeSubmission,
      ),
    ).toEqual({ success: false, reason: 'INVALID_TIMESTAMP' });
  });

  it('não reabre cadastros rejeitados e suspende papéis ao bloquear organização', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const submitted = transitionOrganizationRegistration(request.value, 'SUBMITTED', person, now);
    if (!submitted.success) throw new Error('Falha ao submeter organização.');
    const underReview = transitionOrganizationRegistration(
      submitted.value,
      'UNDER_REVIEW',
      person,
      now,
    );
    if (!underReview.success) throw new Error('Falha ao iniciar análise.');
    const rejected = transitionOrganizationRegistration(underReview.value, 'REJECTED', person, now);
    if (!rejected.success) throw new Error('Falha ao rejeitar organização.');

    expect(transitionOrganizationRegistration(rejected.value, 'UNDER_REVIEW', person, now)).toEqual(
      { success: false, reason: 'INVALID_REGISTRATION_TRANSITION' },
    );

    const activeRequest = createOrgRequest(person);
    if (!activeRequest.success) throw new Error('Cadastro de organização inválido.');
    const active = activateOrganizationRegistration(activeRequest.value, person);
    if (!active.success) throw new Error('Falha ao ativar organização.');
    const responsible = requireActivePerson();
    const blocked = transitionOrganizationRegistration(active.value, 'BLOCKED', responsible, now);
    expect(blocked).toMatchObject({
      success: true,
      value: {
        registrationStatus: 'BLOCKED',
        administrators: [{ status: 'SUSPENDED' }],
      },
    });
    if (!blocked.success) return;
    expect(
      authorizeOrganizationPersonalDataAccess({
        actorPersonIdentityId: responsible.id,
        organizationId,
        organization: blocked.value,
        subjectPersonIdentityId: otherPersonId,
        purposeId: 'membership-verification',
        requestedAttributes: ['FULL_NAME'],
        administrators: active.value.administrators,
        people: [responsible],
        grant: undefined,
        at: now,
      }),
    ).toEqual({ success: false, reason: 'ORGANIZATION_NOT_ACTIVE' });
  });

  it('mantém modelos de organização compatíveis com o catálogo e conexões da Etapa 02', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const catalogOrganization: Organization = request.value.organization;
    const existingCompany = demoCompanies.find(({ id }) =>
      demoOrganizationConnections.some(({ organizationIds }) => organizationIds.includes(id)),
    );

    expect(catalogOrganization.id).toBe(organizationId);
    expect(existingCompany).toBeDefined();
    expect(existingCompany?.id).toMatch(/^organization-demo-/);
  });

  it('rejeita concessão expirada antes de autorizar qualquer dado', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const activated = activateOrganizationRegistration(request.value, person);
    if (!activated.success) throw new Error('Falha ao ativar organização.');
    const grant = {
      personIdentityId: otherPersonId,
      organizationId,
      processingPurpose: {
        personIdentityId: otherPersonId,
        purposeId: 'membership-verification',
        description: 'Verificar solicitação iniciada pela pessoa.',
        legalBasis: 'CONSENT',
        consentChoice: 'GRANTED',
        policyVersion: 'demo-1',
        recordedAtUtc: now.toISOString(),
      },
      allowedAttributes: ['FULL_NAME'] as const,
      expiresAtUtc: '2026-11-09T11:00:00.000Z',
    } as const;

    expect(
      authorizeOrganizationPersonalDataAccess({
        actorPersonIdentityId: person.id,
        organizationId,
        organization: activated.value,
        subjectPersonIdentityId: otherPersonId,
        purposeId: grant.processingPurpose.purposeId,
        requestedAttributes: ['FULL_NAME'],
        administrators: activated.value.administrators,
        people: [requireActivePerson()],
        grant,
        at: now,
      }),
    ).toEqual({ success: false, reason: 'GRANT_EXPIRED' });
  });

  it('não confunde afiliação empresarial com autorização de acesso a dados', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const activated = activateOrganizationRegistration(request.value, person);
    if (!activated.success) throw new Error('Falha ao ativar organização.');
    const assignment: OrganizationAdministratorAssignment = {
      personIdentityId: person.id,
      organizationId,
      role: 'ADMINISTRATOR',
      status: 'PENDING',
    };

    expect(
      hasOrganizationAdministratorRole([assignment], person.id, organizationId, [
        requireActivePerson(),
      ]),
    ).toBe(false);
    expect(
      authorizeOrganizationPersonalDataAccess({
        actorPersonIdentityId: person.id,
        organizationId,
        organization: activated.value,
        subjectPersonIdentityId: otherPersonId,
        purposeId: 'membership-verification',
        requestedAttributes: ['FULL_NAME'],
        administrators: [assignment],
        people: [requireActivePerson()],
        grant: undefined,
        at: now,
      }),
    ).toEqual({ success: false, reason: 'ADMINISTRATOR_NOT_AUTHORIZED' });
  });

  it('não permite que o responsável valide sozinho a própria organização', () => {
    const person = requirePerson();
    const request = createOrgRequest(person);
    if (!request.success) throw new Error('Cadastro de organização de teste inválido.');
    const submitted = transitionOrganizationRegistration(request.value, 'SUBMITTED', person, now);
    if (!submitted.success) throw new Error('Falha ao submeter cadastro.');
    const underReview = transitionOrganizationRegistration(
      submitted.value,
      'UNDER_REVIEW',
      person,
      now,
    );
    if (!underReview.success) throw new Error('Falha ao iniciar análise.');
    const validationInReview = transitionOrganizationValidation(
      underReview.value,
      'IN_REVIEW',
      now,
    );
    if (!validationInReview.success) throw new Error('Falha ao iniciar validação.');

    expect(
      transitionOrganizationValidation(
        validationInReview.value,
        'VERIFIED',
        now,
        {
          decidedByPersonIdentityId: person.id,
          evidenceReference: 'evidence-from-applicant',
        },
        [person],
      ),
    ).toEqual({ success: false, reason: 'RESPONSIBLE_CANNOT_VALIDATE' });
    const inactiveReviewer = requirePerson(11);
    expect(
      transitionOrganizationValidation(
        validationInReview.value,
        'VERIFIED',
        now,
        {
          decidedByPersonIdentityId: inactiveReviewer.id,
          evidenceReference: 'inactive-reviewer-evidence',
        },
        [inactiveReviewer],
      ),
    ).toEqual({ success: false, reason: 'VALIDATOR_NOT_ACTIVE' });
    expect(transitionOrganizationValidation(validationInReview.value, 'VERIFIED', now)).toEqual({
      success: false,
      reason: 'VALIDATION_DECISION_REQUIRED',
    });
  });

  it('define auditoria com metadados e sem valores cadastrais', () => {
    const auditEvent: RegistrationAuditEvent = {
      action: 'PERSON_UPDATED',
      subjectId: otherPersonId,
      actorPersonIdentityId: otherPersonId,
      occurredAtUtc: now.toISOString(),
      correlationId: 'registration-command-demo-001',
    };

    expect(auditEvent).not.toHaveProperty('fullName');
    expect(auditEvent).not.toHaveProperty('email');
    expect(auditEvent).not.toHaveProperty('phone');
    expect(auditEvent).not.toHaveProperty('nationalTaxIdentifier');
    expect(auditEvent).not.toHaveProperty('value');
  });
});
