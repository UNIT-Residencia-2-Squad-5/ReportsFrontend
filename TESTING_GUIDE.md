# Tutorial Completo: Testando o Frontend com o Backend

Este guia fornece instruções passo a passo para configurar, executar e testar a integração entre o frontend React e o backend Express.

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (v18+): https://nodejs.org/
- **npm** ou **yarn**: Vem com o Node.js
- **Git**: https://git-scm.com/
- **Docker** (opcional, mas recomendado para banco de dados): https://www.docker.com/
- **Postman** ou **Thunder Client** (para testar APIs): https://www.postman.com/

---

## Parte 1: Configurar e Rodar o Backend

### 1.1 Clonar o Repositório do Backend

\`\`\`bash
cd ~/projects
git clone <URL_REPOSITORIO_BACKEND>
cd ReportsAPImain6
\`\`\`

### 1.2 Instalar Dependências

\`\`\`bash
npm install
\`\`\`

### 1.3 Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto backend:

\`\`\`env
# Banco de Dados (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/reports_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=reports_db

# MinIO (Object Storage)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET_NAME=reports

# Redis (Cache)
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development
\`\`\`

### 1.4 Iniciar Banco de Dados e Serviços (com Docker Compose)

\`\`\`bash
# Se estiver usando Docker Compose (recomendado)
docker-compose up -d

# Verificar se os containers estão rodando
docker ps
\`\`\`

Você deverá ver containers para:
- PostgreSQL (porta 5432)
- MinIO (porta 9000)
- Redis (porta 6379)

### 1.5 Executar Migrações do Banco de Dados

\`\`\`bash
# Criar tabelas
npm run migrate

# Ou se usar um script específico
npx ts-node src/infrastructure/db/migrations/run.ts
\`\`\`

### 1.6 Iniciar o Backend

\`\`\`bash
npm run dev
\`\`\`

Você deverá ver algo como:

\`\`\`
Server running on http://localhost:3001
Swagger Documentation available at http://localhost:3001/api-docs
\`\`\`

**Verificar se o backend está rodando:**

\`\`\`bash
curl http://localhost:3001/api/health
\`\`\`

Resposta esperada:
\`\`\`json
{ "status": "ok" }
\`\`\`

---

## Parte 2: Configurar e Rodar o Frontend

### 2.1 Clonar o Repositório do Frontend

\`\`\`bash
cd ~/projects
git clone <URL_REPOSITORIO_FRONTEND>
cd reports-frontend
\`\`\`

### 2.2 Instalar Dependências

\`\`\`bash
npm install
\`\`\`

### 2.3 Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto frontend:

\`\`\`env
VITE_API_URL=http://localhost:3001/api
\`\`\`

### 2.4 Iniciar o Frontend

\`\`\`bash
npm run dev
\`\`\`

Você deverá ver:

\`\`\`
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
\`\`\`

---

## Parte 3: Acessar a Aplicação

### 3.1 Abrir no Navegador

1. Abra seu navegador
2. Acesse `http://localhost:5173/`
3. Você deve ver a página inicial do dashboard de relatórios

### 3.2 Estrutura de Páginas

- **Home** (`/`): Página inicial com introdução
- **Dashboard** (`/dashboard`): Visão geral de relatórios e turmas
- **Relatórios** (`/reports`): Criar e gerenciar relatórios

---

## Parte 4: Testando os Endpoints

### 4.1 Usando o Swagger (Documentação Interativa)

1. Acesse: `http://localhost:3001/api-docs`
2. Você verá todos os endpoints disponíveis
3. Clique em um endpoint para ver seus parâmetros
4. Clique em "Try it out" para testar diretamente

### 4.2 Usando Postman

1. Abra o Postman
2. Importe a coleção do Swagger:
   - Clique em "Import"
   - Cole a URL: `http://localhost:3001/api-docs`
   - Clique em "Import"

### 4.3 Testando Endpoints Principais

#### GET /turmas (Listar Turmas)

\`\`\`bash
curl -X GET http://localhost:3001/api/turmas \
  -H "Content-Type: application/json"
\`\`\`

Resposta esperada:
\`\`\`json
{
  "data": [
    {
      "id": 1,
      "nome": "Turma A",
      "descricao": "Turma exemplo"
    }
  ]
}
\`\`\`

#### POST /reports (Criar Relatório)

\`\`\`bash
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "turmaId": 1,
    "tipo": "pdf",
    "filtros": {
      "dataInicio": "2024-01-01",
      "dataFim": "2024-12-31"
    }
  }'
\`\`\`

Resposta esperada:
\`\`\`json
{
  "id": 1,
  "turmaId": 1,
  "status": "processing",
  "tipo": "pdf",
  "criadoEm": "2024-01-15T10:00:00Z"
}
\`\`\`

#### GET /reports (Listar Relatórios)

\`\`\`bash
curl -X GET http://localhost:3001/api/reports \
  -H "Content-Type: application/json"
\`\`\`

#### GET /reports/:id (Obter Relatório Específico)

\`\`\`bash
curl -X GET http://localhost:3001/api/reports/1 \
  -H "Content-Type: application/json"
\`\`\`

#### GET /reports/:id/download (Baixar Arquivo)

\`\`\`bash
curl -X GET http://localhost:3001/api/reports/1/download \
  -o report.pdf
\`\`\`

---

## Parte 5: Fluxo de Teste Completo

Siga este fluxo para testar toda a integração:

### 5.1 Teste 1: Listar Turmas

1. No frontend, acesse `/dashboard`
2. Você deve ver uma lista de turmas disponíveis
3. No console do navegador (F12), você deve ver a requisição:
   \`\`\`
   GET http://localhost:3001/api/turmas
   \`\`\`

### 5.2 Teste 2: Criar um Relatório

1. Navegue para `/reports`
2. Preencha o formulário:
   - Selecione uma turma
   - Escolha o tipo (PDF ou Excel)
   - Defina filtros se necessário
3. Clique em "Gerar Relatório"
4. Você deve ver a requisição no console:
   \`\`\`
   POST http://localhost:3001/api/reports
   \`\`\`

### 5.3 Teste 3: Acompanhar Status

1. Após criar um relatório, você deve ver um card com status "processing"
2. O frontend faz polling a cada 3 segundos para atualizar o status
3. Quando o relatório estiver pronto, o status muda para "completed"

### 5.4 Teste 4: Baixar Relatório

1. Clique no botão "Baixar" no relatório completado
2. O arquivo deve baixar automaticamente
3. A requisição deve ser:
   \`\`\`
   GET http://localhost:3001/api/reports/:id/download
   \`\`\`

---

## Parte 6: Debugging e Troubleshooting

### 6.1 Ver Logs do Backend

No terminal onde o backend está rodando, você verá logs detalhados:

\`\`\`
[2024-01-15 10:30:00] POST /api/reports - 200 OK
[2024-01-15 10:30:05] GET /api/reports/1 - 200 OK
[2024-01-15 10:30:10] GET /api/reports/1/download - 200 OK
\`\`\`

### 6.2 Ver Logs do Frontend

No console do navegador (F12):

\`\`\`javascript
// Para ver requisições da API
console.log(apiClient)

// Para verificar stores (Zustand)
console.log(useReportsStore.getState())
console.log(useTurmasStore.getState())
\`\`\`

### 6.3 Erros Comuns

#### Erro: "Cannot GET /api/turmas"

**Causa**: Backend não está rodando

**Solução**:
\`\`\`bash
# Verifique se o backend está rodando
curl http://localhost:3001/api/health

# Se não funcionar, inicie o backend
npm run dev
\`\`\`

#### Erro: "CORS error"

**Causa**: Frontend e backend não estão na mesma porta ou CORS não configurado

**Solução**: Verifique `src/lib/api.ts` e certifique-se que `VITE_API_URL` está correto

\`\`\`bash
# Verifique a variável de ambiente
echo $VITE_API_URL
# Deve ser: http://localhost:3001/api
\`\`\`

#### Erro: "Network request failed"

**Causa**: Banco de dados ou Redis não está rodando

**Solução**:
\`\`\`bash
# Verifique containers Docker
docker ps

# Reinicie os serviços
docker-compose down
docker-compose up -d
\`\`\`

#### Erro: "Cannot read property 'data' of undefined"

**Causa**: Resposta da API não tem o formato esperado

**Solução**: Verifique o Swagger (`http://localhost:3001/api-docs`) para ver o formato correto da resposta

### 6.4 Usando o DevTools do Navegador

1. Abra o DevTools (F12)
2. Vá até a aba "Network"
3. Faça uma ação no app (exemplo: criar relatório)
4. Você verá as requisições HTTP:
   - Clique em uma requisição para ver:
     - Headers
     - Request Body
     - Response
     - Status Code

### 6.5 Testando com Thunder Client (VS Code)

1. Instale a extensão "Thunder Client" no VS Code
2. Abra a extensão (ícone de raio)
3. Crie uma nova requisição:
   - Método: GET
   - URL: `http://localhost:3001/api/turmas`
   - Clique em "Send"

---

## Parte 7: Testando com Dados Reais

### 7.1 Seed do Banco de Dados

Se o projeto tiver um script de seed:

\`\`\`bash
npm run seed
\`\`\`

### 7.2 Criar Turmas Manualmente

\`\`\`bash
curl -X POST http://localhost:3001/api/turmas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Turma Teste",
    "descricao": "Turma para teste",
    "ano": 2024
  }'
\`\`\`

### 7.3 Criar Relatórios de Teste

\`\`\`bash
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "turmaId": 1,
    "tipo": "pdf"
  }'
\`\`\`

---

## Parte 8: Performance e Monitoramento

### 8.1 Verificar Uso de Recursos

\`\`\`bash
# Backend
# Ver logs detalhados
npm run dev -- --debug

# Frontend
# Ver tamanho do bundle
npm run build
\`\`\`

### 8.2 Testar Múltiplos Relatórios

1. Crie 5 relatórios diferentes
2. Observe o status de cada um
3. Verifique o uso de CPU e memória no terminal
4. Todos devem ser processados pela fila BullMQ

### 8.3 Testar com Dados Grandes

1. Crie um relatório para uma turma com muitos dados
2. Monitore o tempo de processamento
3. Verifique o arquivo gerado

---

## Parte 9: Parar e Limpar

### 9.1 Parar Frontend

\`\`\`bash
# No terminal do frontend
Ctrl + C
\`\`\`

### 9.2 Parar Backend

\`\`\`bash
# No terminal do backend
Ctrl + C
\`\`\`

### 9.3 Parar Containers Docker

\`\`\`bash
docker-compose down
\`\`\`

### 9.4 Limpar Dados (Opcional)

\`\`\`bash
# Remove volumes (CUIDADO: apaga dados)
docker-compose down -v
\`\`\`

---

## Parte 10: Checklist de Teste Completo

Use este checklist para garantir que tudo está funcionando:

- [ ] Backend rodando em `http://localhost:3001`
- [ ] Frontend rodando em `http://localhost:5173`
- [ ] Banco de dados conectado e rodando
- [ ] Redis rodando (para fila de jobs)
- [ ] MinIO rodando (para armazenamento de arquivos)
- [ ] Swagger disponível em `http://localhost:3001/api-docs`
- [ ] Endpoint GET /turmas retorna dados
- [ ] Endpoint POST /reports cria um relatório
- [ ] Status do relatório muda de "processing" para "completed"
- [ ] Arquivo de relatório pode ser baixado
- [ ] Não há erros de CORS no console
- [ ] Não há erros de rede no DevTools
- [ ] Turmas aparecem no dropdown do formulário
- [ ] Relatórios aparecem na lista

---

## Parte 11: Próximos Passos

Após completar todos os testes:

1. **Deploy**: Prepare para deploy em produção
2. **Testes Automatizados**: Adicione testes unitários e E2E
3. **Documentação**: Atualize README e documentação da API
4. **CI/CD**: Configure GitHub Actions para testes automáticos

---

## Links Úteis

- **Frontend**: `http://localhost:5173/`
- **Backend**: `http://localhost:3001/`
- **Swagger**: `http://localhost:3001/api-docs`
- **MinIO**: `http://localhost:9000/` (user: minioadmin, pass: minioadmin)
- **Redis Commander** (opcional): `http://localhost:8081/`

---

## Suporte

Se encontrar problemas:

1. Verifique os logs do terminal
2. Use o DevTools do navegador (F12)
3. Teste endpoints com Postman ou Thunder Client
4. Verifique se todas as variáveis de ambiente estão corretas
5. Reinicie os containers Docker se necessário

Boa sorte com seus testes!
