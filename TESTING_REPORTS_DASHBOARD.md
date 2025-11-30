# 🧪 Guia Completo de Testes - Reports Dashboard

## Índice
1. [Pré-Requisitos](#pré-requisitos)
2. [Verificação da Conexão API](#verificação-da-conexão-api)
3. [Testes Manuais Step-by-Step](#testes-manuais-step-by-step)
4. [Verificação via Console](#verificação-via-console)
5. [Troubleshooting](#troubleshooting)

---

## Pré-Requisitos

### Backend em execução
\`\`\`bash
# Verifique se seu backend está rodando na porta 3000
curl http://localhost:3000/api/health
# Resposta esperada: { "status": "ok" }
\`\`\`

### Frontend em execução
\`\`\`bash
# No seu repositório frontend
npm run dev
# Deve estar rodando em http://localhost:5173
\`\`\`

### Variável de Ambiente
Verifique se a variável `VITE_API_URL` está configurada:
\`\`\`bash
# Crie um arquivo .env.local na raiz do projeto com:
VITE_API_URL=http://localhost:3000/api
\`\`\`

---

## Verificação da Conexão API

### 1. Verificar se a API é alcançável
**No Console do Navegador (F12 → Console):**

\`\`\`javascript
// Teste 1: Conectividade básica
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => console.log('[TEST] API Health:', data))
  .catch(err => console.error('[TEST] API Offline:', err.message))
\`\`\`

**Resultado esperado:**
\`\`\`
[TEST] API Health: { status: "ok" }
\`\`\`

### 2. Verificar se o endpoint de relatórios existe
\`\`\`javascript
// Teste 2: Listar relatórios
fetch('http://localhost:3000/api/reports')
  .then(res => res.json())
  .then(data => console.log('[TEST] Reports Endpoint:', data))
  .catch(err => console.error('[TEST] Error:', err.message))
\`\`\`

**Resultado esperado:**
\`\`\`
[TEST] Reports Endpoint: {
  data: [...],
  total: 0,
  page: 1,
  pageSize: 20
}
\`\`\`

---

## Testes Manuais Step-by-Step

### Teste 1: Carregar a Dashboard
1. Navegue para `http://localhost:5173`
2. Clique em "Relatórios" no menu
3. **Esperado:** A tabela carrega com lista de relatórios (vazia se for primeira vez)

**Verificar no Console:**
\`\`\`
[v0] API Base URL: http://localhost:3000/api
[v0] API Request: { method: "GET", url: "/reports", ... }
[v0] API Response: { status: 200, url: "/reports", data: {...} }
\`\`\`

### Teste 2: Criar um novo Relatório
1. Clique em "+ Novo Relatório"
2. Selecione uma Turma
3. Selecione um Tipo de Relatório (ex: PDF)
4. **Verifique:**
   - Nome do arquivo foi auto-gerado?
   - Pode editar o nome?
5. Clique em "Gerar Relatório"

**Verificar no Console:**
\`\`\`
[v0] API Request: {
  method: "POST",
  url: "/reports",
  data: {
    turmaId: "...",
    tipoRelatorio: "pdf"
  }
}
[v0] Report created successfully: <id-do-relatorio>
[v0] API Response: { status: 201, data: {...} }
\`\`\`

**Resultado esperado:**
- ✅ Toast de sucesso aparece
- ✅ Novo relatório com status "pending" aparece na tabela
- ✅ ID do relatório aparece no console

### Teste 3: Monitorar Status do Relatório
1. Após criar, observe o status do relatório na tabela
2. **Esperado:**
   - Status muda para "processing" (com progress bar)
   - Depois para "completed" (com data de conclusão)

**Verificar no Console:**
\`\`\`
[v0] API Request: { method: "GET", url: "/reports/<id>", ... }
[v0] Report status: processing
[v0] Report status: completed
\`\`\`

### Teste 4: Abrir Detalhes do Relatório
1. Clique em um relatório concluído
2. **Modal deve mostrar:**
   - Nome
   - Turma
   - Tipo
   - Status
   - Data de criação
   - Data de conclusão
   - Botão Download

### Teste 5: Download do Relatório
1. No modal de detalhes, clique em "Download"
2. **Esperado:**
   - Arquivo começa a baixar automaticamente
   - Toast de sucesso aparece

**Verificar no Console:**
\`\`\`
[v0] API Request: { method: "GET", url: "/reports/<id>/download", ... }
[v0] Download URL obtained: <url-do-arquivo>
\`\`\`

### Teste 6: Busca e Filtro
1. Digite texto na barra de search
2. **Esperado:** Tabela filtra por nome em tempo real
3. Clique em "Status" para filtrar
4. **Esperado:** Mostra apenas relatórios com status selecionado

### Teste 7: Erro ao Criar (simular backend offline)
1. Desligue seu backend
2. Clique em "+ Novo Relatório" e tente criar
3. **Esperado:**
   - Toast de erro aparece
   - Mensagem de erro do backend é exibida

**Verificar no Console:**
\`\`\`
[v0] API Error: {
  url: "/reports",
  status: 500,
  message: "Connect ECONNREFUSED"
}
\`\`\`

---

## Verificação via Console

### Verificar estado global do Zustand

\`\`\`javascript
// Importe o store (ou acesse diretamente)
import { useReportsStore } from '@/stores/reportsStore'

// Função para monitorar o estado
const { reports, isLoading, error } = useReportsStore()

// Teste de Log
console.log('[DEBUG] Reports:', reports)
console.log('[DEBUG] Is Loading:', isLoading)
console.log('[DEBUG] Error:', error)
\`\`\`

### Verificar toda a sequência de API

\`\`\`javascript
// Cole no console e execute
(async () => {
  console.log('=== TEST SEQUENCE ===')
  
  // 1. GET /reports
  const listRes = await fetch('http://localhost:3000/api/reports')
  const listData = await listRes.json()
  console.log('1. List Reports:', listData)
  
  // 2. POST /reports (criar novo)
  const createRes = await fetch('http://localhost:3000/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      turmaId: '1', // Ajuste conforme sua turma
      tipoRelatorio: 'pdf'
    })
  })
  const createData = await createRes.json()
  console.log('2. Create Report:', createData)
  const reportId = createData.data?.id || createData.id
  
  // 3. GET /reports/:id (verificar status)
  if (reportId) {
    const statusRes = await fetch(`http://localhost:3000/api/reports/${reportId}`)
    const statusData = await statusRes.json()
    console.log('3. Report Status:', statusData)
  }
  
  console.log('=== TEST COMPLETE ===')
})()
\`\`\`

---

## Checklist de Validação

- [ ] API responde em `http://localhost:3000/api`
- [ ] Frontend carrega lista de relatórios (mesmo que vazia)
- [ ] Consegue criar um novo relatório
- [ ] Status muda de "pending" → "processing" → "completed"
- [ ] Consegue abrir detalhes do relatório
- [ ] Consegue fazer download
- [ ] Busca funciona
- [ ] Filtro por status funciona
- [ ] Erro aparece quando backend está offline
- [ ] Console mostra logs `[v0] API Request` e `[v0] API Response`

---

## Troubleshooting

### ❌ Problema: "Failed to fetch" ou CORS error

**Solução:**
\`\`\`bash
# 1. Verifique se backend está rodando
curl http://localhost:3000/api/health

# 2. Verifique o VITE_API_URL
# Deve estar em .env.local

# 3. Se ainda assim falhar, seu backend pode precisar de CORS
# No seu backend (Express), adicione:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
\`\`\`

### ❌ Problema: "Erro ao carregar relatórios" na UI

**Debug no Console:**
\`\`\`javascript
// Veja qual é o erro real
fetch('http://localhost:3000/api/reports')
  .then(res => res.json())
  .catch(err => console.error('DETAILED ERROR:', err))
\`\`\`

### ❌ Problema: Criou relatório mas não aparece na tabela

**Solução:**
\`\`\`javascript
// Force refresh dos relatórios no console
import { useReportsStore } from '@/stores/reportsStore'
const { fetchReports } = useReportsStore()
await fetchReports()
\`\`\`

### ❌ Problema: Status não muda para "processing"

**Verifique:**
1. Seu backend está gerando o relatório?
2. O endpoint `GET /reports/:id` retorna o status correto?
3. Abra DevTools → Network e observe as requisições

\`\`\`javascript
// Monitore as requisições de status
setInterval(async () => {
  const res = await fetch('http://localhost:3000/api/reports/<seu-id>')
  const data = await res.json()
  console.log('[MONITOR] Status:', data.data?.status || data.status)
}, 2000)
\`\`\`

### ❌ Problema: Download não funciona

**Verifique:**
1. Relatório está com status "completed"?
2. Backend retorna uma URL válida em `GET /reports/:id/download`?

\`\`\`javascript
// Teste download manualmente
fetch('http://localhost:3000/api/reports/<seu-id>/download')
  .then(res => res.json())
  .then(data => {
    console.log('Download URL:', data.data?.downloadUrl)
    window.open(data.data?.downloadUrl)
  })
\`\`\`

---

## Próximos Passos

Após validar todos os testes:
1. ✅ Commit as mudanças
2. ✅ Faça deploy da interface
3. ✅ Teste novamente em produção

**Dúvidas?** Verifique os logs no console com `[v0]` e compare com as respostas esperadas!
