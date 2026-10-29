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
      components/  Cabeçalho, marca e rodapé
      sections/    Hero, história, soluções, segmentos, valores e contato
    demo/           Páginas, dados locais, estilos e testes da demonstração
  shared/
    config/         Rotas e âncoras centralizadas
    styles/         Tokens de design globais
  test/             Setup de Vitest e Testing Library
```

As ilustrações são servidas diretamente de `public/images/`, agrupadas por finalidade. Não há dependência de backend nem cliente de API.

## Conteúdo e dados

Os registros de campanha e parceiros da demo continuam fictícios e ficam em `src/features/demo/demoData.ts`. O estado do CRUD permanece local ao componente, sem persistência. A landing usa textos de validação e cartões de segmento sem nomes comerciais ou marcas.

O formulário de contato usa validação do navegador, não envia dados e não simula entrega. Endereço de e-mail, telefone, localização e redes sociais oficiais aguardam confirmação. Termos e política só devem ganhar links quando suas páginas forem publicadas.

## Estilos e acessibilidade

`src/shared/styles/tokens.css` centraliza as decisões globais de tipografia, cores, espaçamento, bordas e sombras. Os estilos da landing usam o escopo `.site`; o CSS original da demonstração permanece separado em `src/features/demo/demo.css` para reduzir regressões visuais.

O cabeçalho institucional é sticky, o menu mobile expõe estado acessível, links usam âncoras internas e a rolagem respeita `prefers-reduced-motion`. Imagens secundárias usam lazy loading; a imagem principal recebe prioridade de carregamento.

## Configuração de plataforma futura

`VITE_PLATFORM_URL` está reservado em `.env.example`, mas não é consumido pelo código. Valores `VITE_*` são substituídos durante o build; trocar o destino sem rebuild exige uma solução de runtime ou configuração de hospedagem. Nenhum redirecionamento para plataforma externa deve ser ativado antes da confirmação do endereço.

## Validação local e CI

`npm run typecheck`, `npm run lint`, `npm test`, `npm run format:check` e `npm run build` são executados na integração contínua. A suíte cobre navegação institucional, CTA por perfil, menu, isolamento das rotas, CRUD demonstrativo e 404.

## Pendências antes de produção

- Substituir o recorte de hero (536 × 242 px) por recurso de resolução apropriada para telas grandes.
- Confirmar e aprovar canais oficiais, marcas/parcerias e políticas públicas.
- Definir o destino da plataforma e a estratégia de configuração de runtime antes de adicionar redirecionamentos.
