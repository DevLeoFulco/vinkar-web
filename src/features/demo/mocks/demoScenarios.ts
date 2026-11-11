import type {
  DemoSession,
  Organization,
  OrganizationAdministration,
  OrganizationAffiliation,
  PersonIdentity,
} from '../domain/models';
import { businessDemoOrganization } from './companyNetwork';

export type DemoScenarioContext = 'CONSUMER' | 'BUSINESS' | 'BENEFICIARY';

export type DemoScenarioId = `scenario-demo-${string}`;

type DemoScenarioBase = Readonly<{
  id: DemoScenarioId;
  title: string;
  description: string;
}>;

export type ConsumerDemoScenario = DemoScenarioBase &
  Readonly<{
    context: 'CONSUMER';
    session: Omit<
      DemoSession,
      | 'activePersonalProfile'
      | 'organizationAdministrations'
      | 'organizationAffiliations'
      | 'subscriptionPlan'
    > & {
      activePersonalProfile: 'CONSUMER';
      organizationAdministrations: readonly [];
      organizationAffiliations: readonly [];
      subscriptionPlan: 'FREE';
    };
  }>;

export type BusinessDemoScenario = DemoScenarioBase &
  Readonly<{
    context: 'BUSINESS';
    session: Omit<
      DemoSession,
      'activePersonalProfile' | 'organizationAffiliations' | 'subscriptionPlan'
    > & {
      activePersonalProfile: null;
      organizationAffiliations: readonly [];
      subscriptionPlan: null;
    };
    organization: Organization;
  }>;

export type BeneficiaryDemoScenario = DemoScenarioBase &
  Readonly<{
    context: 'BENEFICIARY';
    session: Omit<
      DemoSession,
      'activePersonalProfile' | 'organizationAdministrations' | 'subscriptionPlan'
    > & {
      activePersonalProfile: 'BENEFICIARY';
      organizationAdministrations: readonly [];
      organizationAffiliations: readonly [OrganizationAffiliation];
      subscriptionPlan: null;
    };
    organization: Organization;
  }>;

export type DemoScenario = ConsumerDemoScenario | BusinessDemoScenario | BeneficiaryDemoScenario;

const consumerIdentity = Object.freeze<PersonIdentity>({
  id: 'person-demo-consumer-001',
  publicRegistrationCode: 'VK-DEMO-0001',
  fullName: 'Camila Nogueira Demonstrativa',
  contacts: Object.freeze({
    email: 'camila.nogueira@example.com',
    phone: '11900000001',
  }),
  registrationStatus: 'ACTIVE',
  createdAtUtc: '2026-11-09T00:00:00.000Z',
  updatedAtUtc: '2026-11-09T00:00:00.000Z',
});

const businessAdministratorIdentity = Object.freeze<PersonIdentity>({
  id: 'person-demo-administrator-001',
  publicRegistrationCode: 'VK-DEMO-PERSON-002',
  fullName: 'Administrador demonstrativo',
  contacts: Object.freeze({ email: 'administrator@example.test', phone: '+550000000002' }),
  registrationStatus: 'ACTIVE',
  createdAtUtc: '2026-11-09T00:00:00.000Z',
  updatedAtUtc: '2026-11-09T00:00:00.000Z',
});

const beneficiaryIdentity = Object.freeze<PersonIdentity>({
  id: 'person-demo-beneficiary-001',
  publicRegistrationCode: 'VK-DEMO-PERSON-003',
  fullName: 'Beneficiário demonstrativo',
  contacts: Object.freeze({ email: 'beneficiary@example.test', phone: '+550000000003' }),
  registrationStatus: 'ACTIVE',
  createdAtUtc: '2026-11-09T00:00:00.000Z',
  updatedAtUtc: '2026-11-09T00:00:00.000Z',
});

const beneficiaryOrganization = Object.freeze<Organization>({
  id: 'organization-demo-beneficiary-001',
  displayName: 'Organização demonstrativa 002',
});

const businessAdministration = Object.freeze<OrganizationAdministration>({
  organizationId: businessDemoOrganization.id,
  role: 'ADMINISTRATOR',
});

const beneficiaryAffiliation = Object.freeze<OrganizationAffiliation>({
  organizationId: beneficiaryOrganization.id,
  type: 'EMPLOYMENT',
});

const consumerSession = Object.freeze({
  personIdentity: consumerIdentity,
  activePersonalProfile: 'CONSUMER',
  organizationAdministrations: Object.freeze([] as const),
  organizationAffiliations: Object.freeze([] as const),
  subscriptionPlan: 'FREE',
} satisfies ConsumerDemoScenario['session']);

const businessSession = Object.freeze({
  personIdentity: businessAdministratorIdentity,
  activePersonalProfile: null,
  organizationAdministrations: Object.freeze([businessAdministration]),
  organizationAffiliations: Object.freeze([] as const),
  subscriptionPlan: null,
} satisfies BusinessDemoScenario['session']);

const beneficiarySession = Object.freeze({
  personIdentity: beneficiaryIdentity,
  activePersonalProfile: 'BENEFICIARY',
  organizationAdministrations: Object.freeze([] as const),
  organizationAffiliations: Object.freeze([beneficiaryAffiliation] as const),
  subscriptionPlan: null,
} satisfies BeneficiaryDemoScenario['session']);

const consumerScenario = Object.freeze({
  id: 'scenario-demo-consumer-free',
  context: 'CONSUMER',
  title: 'Consumidor',
  description: 'Pessoa física demonstrativa no plano Gratuito.',
  session: consumerSession,
} satisfies ConsumerDemoScenario);

const businessScenario = Object.freeze({
  id: 'scenario-demo-business-admin',
  context: 'BUSINESS',
  title: 'Empresa',
  description: 'Organização demonstrativa administrada por uma pessoa autorizada.',
  session: businessSession,
  organization: businessDemoOrganization,
} satisfies BusinessDemoScenario);

const beneficiaryScenario = Object.freeze({
  id: 'scenario-demo-beneficiary',
  context: 'BENEFICIARY',
  title: 'Beneficiário',
  description: 'Pessoa física com vínculo empregatício demonstrativo.',
  session: beneficiarySession,
  organization: beneficiaryOrganization,
} satisfies BeneficiaryDemoScenario);

export const demoScenarios: readonly DemoScenario[] = Object.freeze([
  consumerScenario,
  businessScenario,
  beneficiaryScenario,
]);

export function getDemoScenario(id: DemoScenarioId): DemoScenario | undefined {
  return demoScenarios.find((scenario) => scenario.id === id);
}

export function getDemoScenariosByContext(context: DemoScenarioContext): readonly DemoScenario[] {
  return demoScenarios.filter((scenario) => scenario.context === context);
}
