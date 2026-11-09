import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DemoLayout } from './layouts/DemoLayout';
import { CampaignsPage } from '../features/demo/CampaignsPage';
import { CompaniesPage } from '../features/demo/CompaniesPage';
import { DemoBeneficiaryPage } from '../features/demo/DemoBeneficiaryPage';
import { DemoContextGate } from '../features/demo/DemoContextGate';
import { DemoPlansPage } from '../features/demo/DemoPlansPage';
import { MembershipRequestsPage } from '../features/demo/MembershipRequestsPage';
import { BusinessMembershipRequestsPage } from '../features/demo/BusinessMembershipRequestsPage';
import { DemoProfileSelectionPage } from '../features/demo/DemoProfileSelectionPage';
import {
  BenefitsPage,
  BusinessPage,
  ConsumerPage,
  DemoNotFoundPage,
  NotFoundPage,
  PartnersPage,
  SignInPage,
  WalletPage,
} from '../features/demo/DemoPages';
import { LandingPage } from '../features/landing/LandingPage';
import { routes } from '../shared/config/routes';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={routes.home} element={<LandingPage />} />
      <Route path={routes.demo} element={<DemoLayout />}>
        <Route index element={<DemoProfileSelectionPage />} />
        <Route path="planos" element={<DemoPlansPage />} />
        <Route
          path="consumidor"
          element={
            <DemoContextGate context="CONSUMER">
              <ConsumerPage />
            </DemoContextGate>
          }
        />
        <Route
          path="empresas"
          element={
            <DemoContextGate context="CONSUMER">
              <CompaniesPage />
            </DemoContextGate>
          }
        />
        <Route
          path="solicitacoes"
          element={
            <DemoContextGate context="CONSUMER">
              <MembershipRequestsPage />
            </DemoContextGate>
          }
        />
        <Route
          path="empresa"
          element={
            <DemoContextGate context="BUSINESS">
              <BusinessPage />
            </DemoContextGate>
          }
        />
        <Route
          path="empresa/solicitacoes"
          element={
            <DemoContextGate context="BUSINESS">
              <BusinessMembershipRequestsPage />
            </DemoContextGate>
          }
        />
        <Route
          path="beneficiario"
          element={
            <DemoContextGate context="BENEFICIARY">
              <DemoBeneficiaryPage />
            </DemoContextGate>
          }
        />
        <Route
          path="campanhas"
          element={
            <DemoContextGate context="BUSINESS">
              <CampaignsPage />
            </DemoContextGate>
          }
        />
        <Route
          path="beneficios"
          element={
            <DemoContextGate context="CONSUMER">
              <BenefitsPage />
            </DemoContextGate>
          }
        />
        <Route
          path="carteira"
          element={
            <DemoContextGate context="CONSUMER">
              <WalletPage />
            </DemoContextGate>
          }
        />
        <Route
          path="parcerias"
          element={
            <DemoContextGate context="BUSINESS">
              <PartnersPage />
            </DemoContextGate>
          }
        />
        <Route path="login" element={<SignInPage mode="login" />} />
        <Route path="cadastro" element={<SignInPage mode="cadastro" />} />
        <Route path="*" element={<DemoNotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
