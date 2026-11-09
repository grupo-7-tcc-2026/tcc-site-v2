# TCC Site v2

Aplicação web em React + TypeScript para visualização de dados de precipitação e indicadores de risco por distrito. A interface é feita com Vite e React, enquanto `server.ts` fornece um servidor Node/Express para endpoints e/ou servirmos os arquivos em produção.

## Tecnologias
- Frontend: React, TypeScript, Vite
- UI: Tailwind CSS (configurada via dependências), componentes customizados
- Gráficos: Recharts
- Backend/Server: Express (arquivo `server.ts`)

## Pré-requisitos
- Node.js (recomendado >= 18)
- npm (ou pnpm/yarn se preferir)

## Instalação
1. Clone o repositório.
2. No diretório do projeto, instale as dependências:

```bash
npm install
```

3. Configure a URL da API de previsão no arquivo `.env.local` na raiz:

```env
VITE_APP_URL=http://127.0.0.1:8000
```

Inicie também a API nessa URL. Ela deve fornecer os endpoints `/distritos` e `/prever-distrito/:distrito`. Reinicie o servidor de desenvolvimento após alterar a configuração e acesse `http://localhost:4200`. A API precisa permitir essa origem via CORS.

Para cadastro, login e histórico, configure também o MySQL e as tabelas conforme o README da `prevision-api`. Na aba Rua, o relatório é demonstrativo: a foto ainda não é analisada e a probabilidade exibida é fictícia. No histórico, abra um relatório salvo para visualizá-lo com sua imagem e exportá-lo. O botão "Imprimir / salvar PDF" abre a impressão do navegador; selecione "Salvar como PDF". O histórico exibe os últimos 100 registros e permite excluir relatórios e imagens.

## Scripts úteis
Os scripts definidos em `package.json` são:

- `npm run dev` — inicia o servidor de desenvolvimento via `tsx server.ts`. Use este comando durante desenvolvimento.
- `npm run build` — executa `vite build` (frontend) e empacota o servidor com `esbuild` para `dist/server.cjs`.
- `npm run start` — executa o servidor empacotado em produção (`node dist/server.cjs`).
- `npm run clean` — remove artefatos de build (`dist`, `server.js`).
- `npm run lint` — executa `tsc --noEmit` para checar tipos e possíveis erros de compilação.

Exemplos de uso:

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar versão empacotada
npm run start
```

## Estrutura do projeto
- `src/` — código fonte do frontend (componentes React, estilos, etc.)
- `server.ts` — servidor Express/Node usado em desenvolvimento e empacotado para produção
- `assets/` — arquivos estáticos

Principais arquivos do frontend:
- `src/App.tsx` — entrada da aplicação React
- `src/components/` — componentes principais: `DistrictSelector`, `PrecipitationChart`, `RiskWidget`

## Desenvolvendo
- Edite os componentes em `src/components/` e recarregue o servidor de desenvolvimento com `npm run dev`.
- Para mudanças que exigem rebuild do servidor, rode `npm run build` e `npm run start` para testar o bundle de produção.

## Deploy
- Faça `npm run build` em um ambiente CI/CD ou máquina de build.
- Em seguida, rode `npm run start` no servidor de produção (assegure que as variáveis de ambiente necessárias estejam configuradas).

## Observações
- Verifique e configure o arquivo `.env` conforme necessário antes de executar em produção.
- A integração com o Gemini no servidor Express está desativada. Seu endpoint `/api/previsao` usa dados locais simulados, que não são previsões meteorológicas reais. O frontend consulta a API configurada em `VITE_APP_URL`.
- Se usar outro gerenciador de pacotes (pnpm/yarn), adapte os comandos equivalentes.

## Contribuição
- Abra issues ou envie PRs com melhorias ou correções.

---
