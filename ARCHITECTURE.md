# Arquitetura Vinkar Web

## Áreas da aplicação

- `/` entrega somente o site institucional.
- `/demo/*` isola a demonstração navegável em um layout próprio, com aviso permanente de conteúdo fictício.
- Qualquer rota desconhecida retorna uma página 404; o fallback não encaminha para a landing nem para a demo.

## Organização do código

```text
src/
  app/
    layouts/       Layout da demonstração
    router.tsx     Rotas públicas e composição dos layouts
  features/
    landing/
      components/  Cabeçalho e rodapé
      sections/    Hero, história, soluções, segmentos, valores e contato
    demo/           Páginas, dados locais, estilos e testes da demonstração
  shared/
    components/ui/  Marca, botões, badges e cards reutilizáveis
    config/         Rotas e âncoras centralizadas
    styles/         Tokens, estilos globais e componentes compartilhados
  test/             Setup de Vitest e Testing Library
```

As ilustrações são servidas diretamente de `public/images/`, agrupadas por finalidade. Não há dependência de backend nem cliente de API.

## Conteúdo e dados

Os registros de campanha e parceiros da demo continuam fictícios e ficam em `src/features/demo/demoData.ts`. O estado do CRUD permanece local ao componente, sem persistência. A landing usa textos de validação e cartões de segmento sem nomes comerciais ou marcas.

O catálogo compartilhado de estabelecimentos demonstrativos fica em `src/features/demo/mocks/companyNetwork.ts`. `OrganizationConnection` identifica uma conexão direta entre duas organizações; a consulta não infere conexões transitivas nem associa conexões a identidades pessoais. As listas de descoberta do Consumidor e de parcerias da Empresa reutilizam o mesmo catálogo. Os dados são fictícios e conexões não implicam elegibilidade ou parceria comercial real.

O formulário de contato usa validação do navegador, não envia dados e não simula entrega. Endereço de e-mail, telefone, localização e redes sociais oficiais aguardam confirmação. Termos e política só devem ganhar links quando suas páginas forem publicadas.

## Domínio demonstrativo de perfis e planos

Os modelos sem dependência de React ficam em `src/features/demo/domain/models.ts`. Uma sessão representa uma identidade pessoal, no máximo um perfil pessoal ativo (`CONSUMER` ou `BENEFICIARY`), eventuais papéis administrativos associados a organizações independentes e um plano separado do perfil. Os identificadores de exemplo usam formatos fictícios `person-demo-*` e `organization-demo-*`; não representam CPF, CNPJ nem clientes reais. O papel administrativo não altera o perfil nem concede elegibilidade pessoal a benefícios.

As políticas puras ficam em `src/features/demo/domain/policies.ts` e se aplicam somente aos planos de consumidor. Cada lote calcula sua validade a partir do instante de crédito; cada adesão calcula sua carência a partir do instante de ativação. Os cálculos usam epoch UTC e intervalos exatos de 24 horas, sem consultar o relógio do sistema. PREMIUM representa pontos sem expiração e carência zero.

Essas durações são premissas técnicas temporárias para a demonstração, sujeitas à homologação dos sócios. Não há nesta etapa regras de planos para Empresa ou Beneficiário, nem políticas de upgrade ou downgrade.

O catálogo determinístico dos cenários demonstrativos fica em `src/features/demo/mocks/demoScenarios.ts`, separado dos mocks de campanhas. Ele define uma sessão de Consumidor com plano FREE, uma Empresa com identidade de administrador separada da organização e um Beneficiário com perfil pessoal próprio. `OrganizationAffiliation` representa somente o vínculo demonstrativo com uma organização; não implica elegibilidade, benefícios, pontos ou regras comerciais. Não há perfil pessoal `COMPANY`, nem plano empresarial definido.

As conexões diretas entre organizações e o catálogo fictício de empresas ficam em `src/features/demo/mocks/companyNetwork.ts`. `OrganizationConnection` referencia duas organizações; consultas não inferem conexões transitivas nem ligam organizações a identidades pessoais. As listas de descoberta do Consumidor e de parcerias da Empresa compartilham esses mocks.

As solicitações demonstrativas de adesão ficam em memória no `DemoMembershipRequestProvider`, associadas ao `PersonIdentityId`. O domínio valida perfil consumidor, organização existente, vínculo já ativo, solicitação pendente e instante UTC injetado. A solicitação `PENDING` não cria `OrganizationAffiliation`, não inicia carência e não persiste após recarregar a aplicação; aprovação e ativação não fazem parte deste fluxo.

A rota protegida `/demo/solicitacoes` permite ao Consumidor acompanhar sua solicitação pendente na sessão demonstrativa. Ela não apresenta histórico concluído nem recomendações, pois o cenário não registra decisões nem possui regras de sugestão.

A página informativa `/demo/planos?context=...` usa `getConsumerPlanPolicy` por meio de `src/features/demo/planPresentation.ts`, sem repetir os valores temporais nos componentes. As políticas são exibidas somente para Consumidor; Empresa e Beneficiário recebem aviso de que suas condições seguem indefinidas. A página não contrata nem ativa planos e preserva o contexto ao retornar à demonstração.

## Estilos e acessibilidade

`src/shared/styles/tokens.css` centraliza tipografia, cores, espaçamento, bordas e sombras. `src/shared/styles/components.css` contém os estilos dos componentes UI compartilhados. A marca SVG é compartilhada por landing e demo sem alterar sua aparência aprovada na landing.

Os estilos institucionais permanecem sob `.site`. Todos os seletores de apresentação da demonstração, incluindo suas media queries, ficam sob `.demo-app`; resets, estilos de `body`, controles e fontes são definidos globalmente uma única vez.

Botões, badges e cards compartilhados são usados nos fluxos de campanha, benefícios, métricas e carteira. A navegação do demo informa seu estado expandido, permite fechar com Escape e mantém a sidebar navegável em telas pequenas. Os modais de campanha e de condições de adesão associam rótulos, movem o foco ao abrir, contêm a navegação por Tab, fecham com Escape e devolvem o foco ao controle de origem.

O cabeçalho institucional é sticky, o menu mobile expõe estado acessível, links usam âncoras internas e a rolagem respeita `prefers-reduced-motion`. Imagens secundárias usam lazy loading; a imagem principal recebe prioridade de carregamento.

## Configuração de plataforma futura

`VITE_PLATFORM_URL` está reservado em `.env.example`, mas não é consumido pelo código. Valores `VITE_*` são substituídos durante o build; trocar o destino sem rebuild exige uma solução de runtime ou configuração de hospedagem. Nenhum redirecionamento para plataforma externa deve ser ativado antes da confirmação do endereço.

## Validação local e CI

`npm run typecheck`, `npm run lint`, `npm test`, `npm run format:check` e `npm run build` são executados na integração contínua. A suíte cobre navegação institucional, CTA por perfil, menu, isolamento das rotas, CRUD demonstrativo e 404.

## Pendências antes de produção

- Substituir o recorte de hero (536 × 242 px) por recurso de resolução apropriada para telas grandes.
- Confirmar e aprovar canais oficiais, marcas/parcerias e políticas públicas.
- Definir o destino da plataforma e a estratégia de configuração de runtime antes de adicionar redirecionamentos.
