# Vinkar — site institucional e demonstração

Site institucional da Vinkar e demonstração navegável do MVP. A demonstração usa dados fictícios e não implementa autenticação, persistência ou operações reais.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Desenvolvimento

```bash
npm ci
npm run dev
```

O Vite informa a URL local, normalmente `http://localhost:5173`.

## Comandos

| Comando                | Uso                                                   |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Inicia o servidor de desenvolvimento                  |
| `npm run build`        | Executa o build TypeScript e o build de produção Vite |
| `npm run preview`      | Serve localmente o build de produção                  |
| `npm run typecheck`    | Verifica os tipos TypeScript                          |
| `npm test`             | Executa os testes Vitest                              |
| `npm run test:watch`   | Executa Vitest em modo de observação                  |
| `npm run lint`         | Executa ESLint                                        |
| `npm run format`       | Formata os arquivos com Prettier                      |
| `npm run format:check` | Verifica a formatação                                 |

## Rotas

### Institucional

- `/` — landing page com história, soluções, segmentos, missão, visão, valores e contato.

### Demonstração

- `/demo` — redireciona para a demonstração de benefícios
- `/demo/consumidor` — painel do consumidor
- `/demo/empresa` — painel empresarial
- `/demo/campanhas` — cadastro, edição e exclusão em memória
- `/demo/beneficios` — catálogo demonstrativo
- `/demo/carteira` — pontos e extrato fictícios
- `/demo/parcerias` — segmentos e parceiros fictícios
- `/demo/login` e `/demo/cadastro` — navegação demonstrativa, sem autenticação

Rotas não encontradas exibem uma página 404. Os caminhos internos centralizados estão em `src/shared/config/routes.ts`.

## Estrutura

```text
public/images/          Imagens WebP organizadas por seção da landing
src/app/                Roteador e layouts
src/features/landing/   Componentes e seções institucionais
src/features/demo/      Páginas e estilos da demonstração existente
src/shared/config/      Rotas e configuração compartilhada
src/shared/styles/      Tokens e estilos globais
src/test/               Configuração dos testes
```

## Imagens e conteúdo

As imagens aprovadas ficam em `public/images/`, agrupadas em `hero`, `backgrounds`, `about`, `concepts`, `solutions`, `cta`, `segments`, `values` e `contact`. Elas são recursos conceituais e não representam clientes, parceiros ou telas operacionais. O pacote fornecido informa que os recortes têm resolução limitada; a imagem de hero é de 536 × 242 px e deve ser substituída por uma versão maior antes de uma publicação de alta resolução.

Os segmentos exibidos na landing são barbearia, supermercado, academia e provedora de internet, identificados como negócios participantes da fase de validação. Nenhum nome comercial, depoimento, logotipo, métrica ou parceria real é afirmado.

## Limites da demonstração

- Login e cadastro não criam contas nem autenticam usuários.
- Campanhas podem ser criadas, editadas e excluídas somente em estado React. Recarregar a página restaura os dados iniciais.
- Pontos, resgates e extratos são fictícios e não representam valor financeiro.
- Não use dados pessoais reais. O formulário institucional apenas valida os campos no navegador; ele não envia nem armazena mensagens.
- Canais de contato, termos de uso e política de privacidade permanecem pendentes de confirmação/publicação.

## Configuração futura da plataforma

`.env.example` contém `VITE_PLATFORM_URL` como configuração opcional futura. Essa variável ainda não é usada para redirecionar: a plataforma externa não foi confirmada. Variáveis `VITE_*` são incorporadas no build; para mudar o destino sem rebuild será necessária uma configuração de runtime ou da hospedagem.

## Git e integração

O fluxo pretendido é desenvolver em branches `feature/*` ou `fix/*`, integrar em `develop` e promover para `master` somente após validação. Não faça push ou merge sem autorização. O estado local do Git deve ser reconciliado com esse fluxo antes da criação das branches de integração.
