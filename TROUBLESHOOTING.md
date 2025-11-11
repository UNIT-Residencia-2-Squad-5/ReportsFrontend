#  - Guia de Problemas Comuns

## Problema 1: CORS Error no Console do Navegador

### Mensagem de Erro
\`\`\`
Access to XMLHttpRequest at 'http://localhost:3001/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
\`\`\`

### Causas Possíveis
1. Backend não tem CORS configurado
2. URL do backend incorreta
3. Backend não está rodando

### Soluções

**Solução 1: Verificar Backend CORS**
\`\`\`bash
# Verifique se o backend tem cors configurado em src/app.ts
grep -n "cors" src/app.ts
\`\`\`

**Solução 2: Verificar Variável de Ambiente**
\`\`\`bash
# No terminal do frontend
echo $VITE_API_URL

# Deve ser: http://localhost:3001/api
\`\`\`

**Solução 3: Verificar se Backend Está Rodando**
\`\`\`bash
curl http://localhost:3001/api/health
\`\`\`

---

## Problema 2: Backend não conecta ao Banco de Dados

### Mensagem de Erro
\`\`\`
Error: connect ECONNREFUSED 127.0.0.1:5432
\`\`\`

### Causas Possíveis
1. PostgreSQL não está rodando
2. Credenciais do banco incorretas
3. `.env` não está configurado

### Soluções

**Solução 1: Verificar Docker Compose**
\`\`\`bash
# Verifique se os containers estão rodando
docker ps

# Se não estiver, inicie
docker-compose up -d
\`\`\`

**Solução 2: Verificar Variáveis de Ambiente**
\`\`\`bash
# Abra o arquivo .env e verifique:
cat .env

# Deve ter DATABASE_URL com valores corretos
\`\`\`

**Solução 3: Testar Conexão do Banco**
\`\`\`bash
# Se tem psql instalado
psql -U postgres -h localhost -d reports_db

# Dentro do psql
\l  # Lista databases
\q  # Sair
\`\`\`

---

## Problema 3: Fila de Relatórios (BullMQ) não Processa

### Sintomas
- Relatório fica com status "processing" por muito tempo
- Não há arquivo gerado

### Causas Possíveis
1. Redis não está rodando
2. Fila não foi iniciada
3. Worker de processamento não está rodando

### Soluções

**Solução 1: Verificar Redis**
\`\`\`bash
# Verifique se Redis está rodando
docker ps | grep redis

# Se não estiver
docker-compose up -d redis
\`\`\`

**Solução 2: Verificar Conexão Redis**
\`\`\`bash
# Tente conectar ao Redis
redis-cli ping
# Resposta esperada: PONG
\`\`\`

**Solução 3: Reiniciar Backend**
\`\`\`bash
# Interrompa o backend
Ctrl + C

# E reinicie
npm run dev
\`\`\`

---

## Problema 4: Arquivo não é Gerado (MinIO)

### Mensagens de Erro
- Relatório completa mas arquivo não existe
- Erro ao fazer download

### Causas Possíveis
1. MinIO não está rodando
2. Credenciais MinIO incorretas
3. Bucket não foi criado

### Soluções

**Solução 1: Verificar MinIO**
\`\`\`bash
# Verifique se MinIO está rodando
docker ps | grep minio

# Se não estiver
docker-compose up -d minio
\`\`\`

**Solução 2: Acessar Console MinIO**
\`\`\`
URL: http://localhost:9000
User: minioadmin
Password: minioadmin
\`\`\`

**Solução 3: Criar Bucket Manualmente**
\`\`\`bash
# Se usar aws-cli
aws --endpoint-url http://localhost:9000 s3 mb s3://reports \
  --access-key minioadmin \
  --secret-key minioadmin
\`\`\`

---

## Problema 5: Frontend não consegue fazer Download do Relatório

### Mensagem de Erro
\`\`\`
Failed to fetch resource - Error: net::ERR_UNKNOWN_URL_SCHEME
\`\`\`

### Causas Possíveis
1. URL de download incorreta
2. Arquivo não existe em MinIO
3. Timeout na requisição

### Soluções

**Solução 1: Verificar URL no Console**
\`\`\`javascript
// No console do navegador (F12)
console.log(useReportsStore.getState())
// Verifique se reports têm url de download correta
\`\`\`

**Solução 2: Testar Download com Curl**
\`\`\`bash
# Teste se o endpoint retorna o arquivo
curl -X GET http://localhost:3001/api/reports/1/download \
  -o test_report.pdf

# Verifique se o arquivo foi criado
ls -lh test_report.pdf
\`\`\`

**Solução 3: Aumentar Timeout**
\`\`\`typescript
// Em src/lib/api.ts, aumente timeout para download
this.client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 segundos para downloads grandes
})
\`\`\`

---

## Problema 6: Página em Branco no Frontend

### Sintomas
- Frontend abre mas não mostra conteúdo
- Apenas fundo branco

### Causas Possíveis
1. Erro em JavaScript no console
2. Componente não está renderizando
3. Erro no CSS

### Soluções

**Solução 1: Verificar Console**
\`\`\`javascript
// Abra DevTools (F12) → Console
// Procure por erros vermelhos
// Clique no erro para ver stack trace completo
\`\`\`

**Solução 2: Verificar Network**
\`\`\`
DevTools (F12) → Network
Procure por requisições em vermelho (erros)
Clique nelas para ver detalhes
\`\`\`

**Solução 3: Limpar Cache**
\`\`\`bash
# Limpe cache do navegador
Ctrl + Shift + Delete  # Windows/Linux
Cmd + Shift + Delete   # Mac

# Ou hard refresh
Ctrl + F5  # Windows/Linux
Cmd + Shift + R  # Mac
\`\`\`

**Solução 4: Reconstruir Frontend**
\`\`\`bash
# Interrompa o servidor
Ctrl + C

# Delete node_modules e cache
rm -rf node_modules .vite

# Reinstale
npm install

# Reinicie
npm run dev
\`\`\`

---

## Problema 7: Relatório Não Aparece na Lista

### Sintomas
- Criar relatório funciona (retorna 200)
- Mas ele não aparece na lista

### Causas Possíveis
1. Dados não estão sendo salvos no banco
2. Frontend não está refetchando
3. Filtro esconde o relatório

### Soluções

**Solução 1: Verificar Banco Diretamente**
\`\`\`bash
# Conecte ao PostgreSQL
psql -U postgres -h localhost -d reports_db

# Verifique tabela de relatórios
SELECT * FROM reports;

# Veja últimos adicionados
SELECT * FROM reports ORDER BY created_at DESC LIMIT 5;
\`\`\`

**Solução 2: Forçar Refetch no Frontend**
\`\`\`javascript
// No console do navegador
const { fetchReports } = useReportsStore.getState()
fetchReports()
\`\`\`

**Solução 3: Verificar Filtros**
\`\`\`
Frontend → Verifique se há filtros ativos
Remova todos os filtros e tente novamente
\`\`\`

---

## Problema 8: Turmas não aparecem no Dropdown

### Sintomas
- Dropdown está vazio
- Ou mostra "Carregando..." permanentemente

### Causas Possíveis
1. Banco não tem turmas
2. Endpoint GET /turmas retorna erro
3. Frontend não consegue processar resposta

### Soluções

**Solução 1: Verificar Turmas no Banco**
\`\`\`bash
psql -U postgres -h localhost -d reports_db
SELECT * FROM turmas;
\`\`\`

**Solução 2: Testar Endpoint Manualmente**
\`\`\`bash
curl -X GET http://localhost:3001/api/turmas
\`\`\`

**Solução 3: Criar Turmas**
\`\`\`bash
curl -X POST http://localhost:3001/api/turmas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Turma Teste",
    "descricao": "Turma para testes"
  }'
\`\`\`

**Solução 4: Verificar Store**
\`\`\`javascript
// No console do navegador
console.log(useTurmasStore.getState())
// Verifique se turmas estão carregadas
\`\`\`

---

## Problema 9: Erros Estranhos ao Criar Relatório

### Mensagens
- "Unexpected token" 
- "Cannot read property..."
- Erro genérico

### Soluções

**Solução 1: Limpar Dados Locais**
\`\`\`javascript
// No console do navegador
localStorage.clear()
// Recarregue a página
location.reload()
\`\`\`

**Solução 2: Verificar Payload**
\`\`\`javascript
// No console, monitore requisição
const { createReport } = useReportsStore.getState()
console.log("Creating with turmaId:", turmaId)
createReport(turmaId, "pdf")
\`\`\`

**Solução 3: Verificar Resposta da API**
\`\`\`
DevTools → Network → Clique em POST /reports
Verifique a aba "Response" para ver dados retornados
\`\`\`

---

## Problema 10: Performance Lenta

### Sintomas
- App demora para abrir
- Ações são lentas
- Muitos relatórios congelam o app

### Soluções

**Solução 1: Verificar Bundle Size**
\`\`\`bash
npm run build
# Verifique tamanho dos arquivos em dist/
\`\`\`

**Solução 2: Monitorar Requisições**
\`\`\`
DevTools → Network
Classifique por tamanho (Size column)
Procure por requisições muito grandes
\`\`\`

**Solução 3: Otimizar Paginação**
\`\`\`
Backend: Adicione paginação ao GET /reports
Frontend: Implemente infinite scroll ou paginação
\`\`\`

---

## Checklist de Debug

1. [ ] Backend está rodando? `curl http://localhost:3001/api/health`
2. [ ] Frontend está rodando? Abra `http://localhost:5173`
3. [ ] Variáveis de ambiente estão corretas?
4. [ ] Banco de dados conectado?
5. [ ] Redis rodando?
6. [ ] MinIO rodando?
7. [ ] Swagger acessível? `http://localhost:3001/api-docs`
8. [ ] Console do navegador sem erros? (F12)
9. [ ] Network mostra respostas 200? (DevTools → Network)
10. [ ] Dados aparecem no banco? (psql)

---

Se o problema persistir, colete as seguintes informações:

1. **Mensagem de erro completa** (do console ou terminal)
2. **Versões** (`node -v`, `npm -v`)
3. **Sistema operacional** (Windows, Mac, Linux)
4. **Screenshots** de DevTools (Network, Console)
5. **Resposta do Swagger** (http://localhost:3001/api-docs)

Boa sorte!
