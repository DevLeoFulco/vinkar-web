import { createContext, useContext } from 'react';
import type { ConsumerRegistration, RegistrationResult } from './domain/registration';
import type { PersonIdentityId } from './domain/models';
import type {
  ConsumerProfileData,
  PersonIdentityRegistrationInput,
} from './domain/registrationModels';

export type ConsumerRegistrationDetails = Readonly<{
  fullName: string;
  contacts: PersonIdentityRegistrationInput['contacts'];
  profileData?: ConsumerProfileData;
}>;

export type ConsumerRegistrationContextValue = Readonly<{
  registrationCount: number;
  registerConsumer(details: ConsumerRegistrationDetails): RegistrationResult<ConsumerRegistration>;
  updateConsumerProfileData(
    personIdentityId: PersonIdentityId,
    profileData: ConsumerProfileData | undefined,
  ): RegistrationResult<ConsumerRegistration>;
}>;

export const ConsumerRegistrationContext = createContext<ConsumerRegistrationContextValue | null>(
  null,
);

export function useConsumerRegistration() {
  const context = useContext(ConsumerRegistrationContext);
  if (!context) {
    throw new Error('O contexto de cadastro do Consumidor não está disponível.');
  }
  return context;
}
