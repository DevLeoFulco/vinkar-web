import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  InMemoryPersonIdentityRepository,
  type ConsumerRegistration,
  type RegistrationResult,
} from './domain/registration';
import type { PersonIdentityId } from './domain/models';
import type { ConsumerProfileData } from './domain/registrationModels';
import { demoScenarios } from './mocks/demoScenarios';
import {
  ConsumerRegistrationContext,
  type ConsumerRegistrationDetails,
  type ConsumerRegistrationContextValue,
} from './ConsumerRegistrationState';

function createSeededIdentityRepository() {
  const identityRepository = new InMemoryPersonIdentityRepository();
  for (const scenario of demoScenarios) {
    const { personIdentity } = scenario.session;
    const seeded = identityRepository.create({
      id: personIdentity.id,
      publicRegistrationCode: personIdentity.publicRegistrationCode,
      fullName: personIdentity.fullName,
      ...(personIdentity.nationalTaxIdentifier
        ? { nationalTaxIdentifier: personIdentity.nationalTaxIdentifier }
        : {}),
      contacts: personIdentity.contacts,
      createdAt: new Date(personIdentity.createdAtUtc),
    });
    if (!seeded.success) {
      throw new Error(`Não foi possível reservar a identidade do cenário ${scenario.id}.`);
    }
  }
  return identityRepository;
}

export function ConsumerRegistrationProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(createSeededIdentityRepository);
  const nextId = useRef(0);
  const [registrations, setRegistrations] = useState<readonly ConsumerRegistration[]>([]);

  const registerConsumer = useCallback(
    (details: ConsumerRegistrationDetails): RegistrationResult<ConsumerRegistration> => {
      let sequence = nextId.current + 1;
      let result: RegistrationResult<ConsumerRegistration>;
      for (;;) {
        const now = new Date();
        result = repository.registerConsumer({
          identity: {
            id: `person-demo-consumer-onboarding-${sequence}`,
            publicRegistrationCode: `VK-DEMO-ONBOARDING-${sequence}`,
            fullName: details.fullName,
            contacts: details.contacts,
            createdAt: now,
          },
          profileId: `personal-profile-demo-onboarding-${sequence}`,
          ...(details.profileData ? { profileData: details.profileData } : {}),
        });
        if (result.success) {
          break;
        }
        if (result.reason !== 'DUPLICATE_ID' && result.reason !== 'DUPLICATE_PUBLIC_CODE') break;
        sequence += 1;
      }
      if (result.success) {
        nextId.current = sequence;
        setRegistrations((current) => [...current, result.value]);
      }
      return result;
    },
    [repository],
  );
  const updateConsumerProfileData = useCallback(
    (personIdentityId: PersonIdentityId, profileData: ConsumerProfileData | undefined) =>
      repository.updateConsumerProfileData(personIdentityId, profileData),
    [repository],
  );

  const value = useMemo(
    () => ({
      registrationCount: registrations.length,
      registerConsumer,
      updateConsumerProfileData,
    }),
    [registrations, registerConsumer, updateConsumerProfileData],
  ) satisfies ConsumerRegistrationContextValue;

  return (
    <ConsumerRegistrationContext.Provider value={value}>
      {children}
    </ConsumerRegistrationContext.Provider>
  );
}
