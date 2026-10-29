import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DemoLayout } from './layouts/DemoLayout';
import { CampaignsPage } from '../features/demo/CampaignsPage';
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
        <Route index element={<Navigate to={routes.demoBenefits} replace />} />
        <Route path="consumidor" element={<ConsumerPage />} />
        <Route path="empresa" element={<BusinessPage />} />
        <Route path="campanhas" element={<CampaignsPage />} />
        <Route path="beneficios" element={<BenefitsPage />} />
        <Route path="carteira" element={<WalletPage />} />
        <Route path="parcerias" element={<PartnersPage />} />
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
