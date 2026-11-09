import type { DemoConsumerProfile, PersonIdentityId } from '../domain/models';

const demoConsumerProfile: DemoConsumerProfile = Object.freeze({
  id: 'consumer-profile-demo-001',
  personIdentityId: 'person-demo-consumer-001',
  publicRegistrationCode: 'VK-DEMO-0001',
  fullName: 'Camila Nogueira Demonstrativa',
  email: 'camila.nogueira@example.com',
  phone: '11900000001',
  city: 'São Paulo',
  state: 'SP',
});

export function getDemoConsumerProfile(
  personIdentityId: PersonIdentityId,
): DemoConsumerProfile | undefined {
  return demoConsumerProfile.personIdentityId === personIdentityId
    ? demoConsumerProfile
    : undefined;
}
