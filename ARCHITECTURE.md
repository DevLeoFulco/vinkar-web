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

## Fundação cadastral e identidade

`PersonIdentity` é a identidade canônica da Pessoa Física: seu ID interno imutável é distinto do código público Vinkar, e o cadastro concentra nome, identificador fiscal nacional opcional, contatos, estado cadastral e instantes UTC. A validação normaliza valores e não registra dados pessoais em eventos de auditoria. `InMemoryPersonIdentityRepository` demonstra unicidade por ID, código público e par país/identificador fiscal; é somente um índice local, não substitui restrições transacionais e validação de identidade no backend. Os cenários continuam fictícios e não contêm CPF/CNPJ.

`PersonalProfile` é associado a uma identidade e representa apenas `CONSUMER` ou `BENEFICIARY`; a política não permite os dois perfis ativos ao mesmo tempo. Perfis e cadastro da identidade têm estados próprios. O estado de cadastro não é autenticação e não cria `MainCompanyMembership`, não aprova solicitação de vínculo e não concede elegibilidade de campanha. A identidade única também pode ter atribuições organizacionais, sem criar uma identidade de administrador separada.

`OrganizationRegistration` associa um pedido cadastral à entidade `Organization` já usada pelo catálogo e pelas conexões da Etapa 02, preservando o mesmo ID. Solicitante e responsável devem ser Pessoas Físicas existentes. O papel `ADMINISTRATOR` fica `PENDING` até a organização estar ativa; o fluxo empresarial separado passa por submissão, análise, decisão de validação por identidade ativa distinta do responsável, evidência referenciada e ativação. O responsável não pode validar a própria organização, e o cadastro por si só não comprova poderes legais. Bloqueio suspende a atribuição administrativa; decisões administrativas também conferem identidade ativa e estado ativo da organização. As regras reais de evidência documental, identidade/autorização do revisor e poderes de representação precisam ser definidas e aplicadas pelo backend.

Preferências do Consumidor são opcionais e separadas de requisitos do cadastro básico. `DeclaredConsumptionData` representa somente respostas autodeclaradas; `ObservedConsumptionData` exige referência de evidência e instante de observação distintos. Declarações não viram consumo comprovado. A demonstração não infere comportamento nem implementa IA.

Os contratos de privacidade separam finalidade, base legal e escolha de consentimento, quando aplicável. A política de acesso a dados exige papel administrativo ativo na organização específica, identidade ativa do ator, organização ativa, concessão explícita, finalidade registrada correspondente, validade UTC e atributos minimizados; afiliação ou conexão empresarial não concede acesso. Os seletores de rede projetam organizações apenas para ID e nome, sem repassar campos cadastrais adicionais. Resumos públicos de identidade omitem ID interno, nome, contatos e identificador fiscal. Eventos de auditoria registram ação, ator, instante e referência, nunca valores de CPF, contatos ou outros atributos. Pedidos de correção referenciam os campos a corrigir, enquanto a atualização passa por validação de domínio. Nenhum dado é compartilhado com empresas conectadas.

Decisões pendentes para o backend: validação nacional por jurisdição e unicidade concorrente; autenticação e recuperação de conta; critérios de ativação de Pessoa e organização; bases legais, textos e versionamento de consentimentos; papéis e segregação dos revisores; evidências aceitas, retenção e auditoria; autorização e atendimento de correção/atualização; política de minimização por finalidade. A demonstração não substitui parecer jurídico nem define essas regras comerciais ou legais.

## Onboarding demonstrativo do Consumidor

A rota `src/features/demo/ConsumerRegistrationPage.tsx` implementa cinco etapas: identificação, contato, preferências opcionais, escolhas de privacidade e revisão/conclusão. Identificação e contato usam as validações puras de `registration.ts`; a conclusão usa `InMemoryPersonIdentityRepository.registerConsumer`, que valida a identidade, percorre as transições cadastrais e ativa o perfil `CONSUMER` antes de inserir o resultado no repositório. Identidade e perfil são criados juntos ou nenhum deles é registrado. O código público e IDs demonstrativos são gerados no provider; não se solicita CPF/CNPJ.

`ConsumerRegistrationProvider` mantém cadastros e perfis somente em memória enquanto a demonstração está montada. Reserva no repositório os IDs e códigos públicos dos cenários existentes, e a geração de códigos avança em caso de colisão. Não usa armazenamento do navegador, não modifica os cenários existentes e não estabelece sessão autenticada. O link de descoberta avisa que abre o cenário fictício pré-configurado: não envia a identidade recém-criada, não muda silenciosamente o `DemoScenarioContext` e não a conecta a Membership ou a uma rede elegível.

Preferências podem ser ignoradas, revistas antes da conclusão e atualizadas depois pelo comando em memória `updateConsumerProfileData`, sem alterar identidade ou perfil. Frequência e faixa de gasto ficam marcadas como dados `DECLARED`, separados de qualquer consumo observado. As escolhas de personalização e comunicação promocional por e-mail começam desmarcadas e são opcionais; indicar uma preferência não envia mensagens nem representa consentimento jurídico. As informações necessárias à demonstração são explicadas separadamente. A tela informa que não implementa conformidade legal, envio a terceiros ou persistência.

O fluxo usa componentes compartilhados, rótulos e mensagens associadas aos campos, foco no primeiro campo inválido, indicadores de etapa e layout responsivo. O ponto futuro de integração é uma camada de aplicação que, após autenticação e validação no backend, associe explicitamente a identidade persistida à sessão e habilite operações Membership para essa identidade; a tela não deve inferir tal associação a partir do cadastro demonstrativo. Decisões pendentes para backend incluem autenticação, recuperação de conta, persistência e unicidade concorrente, verificação de contatos, bases legais e gestão formal de consentimentos, além de políticas definitivas de retenção e atualização cadastral.

As políticas puras ficam em `src/features/demo/domain/policies.ts` e se aplicam somente aos planos de consumidor. Cada lote calcula sua validade a partir do instante de crédito; cada adesão calcula sua carência a partir do instante de ativação. Os cálculos usam epoch UTC e intervalos exatos de 24 horas, sem consultar o relógio do sistema. PREMIUM representa pontos sem expiração e carência zero.

Essas durações são premissas técnicas temporárias para a demonstração, sujeitas à homologação dos sócios. Não há nesta etapa regras de planos para Empresa ou Beneficiário, nem políticas de upgrade ou downgrade.

O catálogo determinístico dos cenários demonstrativos fica em `src/features/demo/mocks/demoScenarios.ts`, separado dos mocks de campanhas. Ele define uma sessão de Consumidor com plano FREE, uma Empresa com identidade de administrador separada da organização e um Beneficiário com perfil pessoal próprio. `OrganizationAffiliation` representa somente o vínculo demonstrativo com uma organização; não implica elegibilidade, benefícios, pontos ou regras comerciais. Não há perfil pessoal `COMPANY`, nem plano empresarial definido.

As conexões diretas entre organizações e o catálogo fictício de empresas ficam em `src/features/demo/mocks/companyNetwork.ts`. `OrganizationConnection` referencia duas organizações; consultas não inferem conexões transitivas nem ligam organizações a identidades pessoais. As listas de descoberta do Consumidor e de parcerias da Empresa compartilham esses mocks.

`src/features/demo/domain/networkEligibility.ts` calcula a união da rede de uma identidade usando somente seus vínculos `ACTIVE`, as organizações e as conexões diretas do catálogo compartilhado. Organizações principais são deduplicadas; uma organização ligada diretamente a mais de uma principal aparece uma vez e preserva todas as origens. Solicitações pendentes, devolvidas ou rejeitadas não são entradas para a política e não criam alcance de rede. Não há expansão transitiva.

As ofertas demonstrativas em `src/features/demo/demoData.ts` distinguem `GENERAL_CAMPAIGN`, `NETWORK_BENEFIT` e `MAIN_COMPANY_EXCLUSIVE`; categoria não é o resultado da consulta de elegibilidade. Campanhas gerais e benefícios de rede usam a união das empresas principais ativas e de suas conexões diretas. Benefícios exclusivos exigem vínculo principal ativo diretamente com a organização promotora. A consulta respeita o status existente (`Ativa`, `Rascunho` ou `Encerrada`), não infere conexões transitivas e não duplica uma organização alcançada por mais de uma rede. O resultado é isolado por `PersonIdentityId` e inclui a relação e as empresas principais de origem.

Elegibilidade de rede e de oferta permanecem distintas de participação em campanha, crédito confirmado de pontos e autorização de resgate. Campanhas gerais podem ter participação potencial sem exigência de compra recente ou saldo; nenhuma participação é registrada automaticamente. Benefícios de rede e exclusivos podem ter acesso potencial, mas saldo e regras de resgate ficam como requisitos pendentes, sem autorização definitiva. A interface identifica a organização promotora, categoria, origem, situação e requisitos ainda não verificados. Nenhuma consulta concede, credita ou movimenta pontos.

Essas regras não substituem público-alvo, vigência, limites ou demais condições de oferta ainda não modeladas. Classificações e interpretações comerciais que não estejam homologadas permanecem decisões pendentes. Não há carteira ou resgate implementados. A elegibilidade demonstrativa não compartilha dados pessoais com organizações conectadas. Qualquer futura verificação de vínculo ou acesso a dados dependerá de finalidade definida, base legal aplicável, minimização de dados e controles de acesso; não se presume autorização para expor cadastros completos.

As solicitações demonstrativas de adesão ficam em memória no `DemoMembershipRequestProvider`, associadas ao `PersonIdentityId`. O domínio valida perfil consumidor, organização existente, vínculo já ativo, capacidade do plano, estado da solicitação e instante UTC injetado. Cada comando recebe um identificador idempotente; reutilizá-lo com outro conteúdo é rejeitado. A capacidade é derivada de `PlanPolicy` (FREE: 1, PRO: 3, PREMIUM: 5) e considera solicitações pendentes/devolvidas e vínculos ativos.

O ciclo demonstrativo suporta `PENDING`, `RETURNED`, `REJECTED` e `APPROVED`. A organização pode devolver uma solicitação com motivo para correção, rejeitá-la ou aprová-la. A aprovação registra uma `OrganizationAffiliation` ativa, com plano e instante UTC de ativação, e a carência é calculada a partir dessa ativação; a solicitação pendente não inicia carência. Cada submissão, decisão, retorno e reenvio gera um registro de auditoria. As operações de estado são aplicadas como uma única atualização imutável do provider, que permanece apenas em memória e é perdida ao recarregar a aplicação.

O cenário usa um perfil de Consumidor demonstrativo com dados fictícios e código público próprio; não utiliza CPF, CNPJ ou dados pessoais reais. A mesma organização demonstrativa é compartilhada pelo catálogo e pelo cenário empresarial. A página empresarial `/demo/empresa/solicitacoes` limita a análise à organização do cenário ativo e exige papel administrativo para decisões no domínio. `/demo/solicitacoes` permite ao Consumidor consultar o estado, corrigir os dados após devolução, reenviar e acompanhar vínculo/capacidade; essas telas não afirmam elegibilidade automática a benefícios. A área não inventa histórico de encerramentos fora dos registros do cenário nem sugestões comerciais.

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
