export const routes = {
  home: '/',
  demo: '/demo',
  demoConsumer: '/demo/consumidor',
  demoBusiness: '/demo/empresa',
  demoBeneficiary: '/demo/beneficiario',
  demoCampaigns: '/demo/campanhas',
  demoBenefits: '/demo/beneficios',
  demoWallet: '/demo/carteira',
  demoPartners: '/demo/parcerias',
  demoLogin: '/demo/login',
  demoLoginConsumer: '/demo/login?context=CONSUMER',
  demoLoginBusiness: '/demo/login?context=BUSINESS',
  demoLoginBeneficiary: '/demo/login?context=BENEFICIARY',
  demoSignUp: '/demo/cadastro',
} as const;

export const landingSections = {
  home: 'inicio',
  about: 'sobre',
  solutions: 'solucoes',
  clients: 'clientes',
  values: 'valores',
  contact: 'contato',
} as const;
