# Quick Start - Começar Rápido

## 1 Minuto: Setup Inicial

\`\`\`bash
# Terminal 1: Backend
cd ReportsAPImain6
npm install
docker-compose up -d
npm run dev

# Terminal 2: Frontend
cd reports-frontend
npm install
npm run dev
\`\`\`

## Acessar

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Swagger: `http://localhost:3001/api-docs`

## Testar Rapidamente

\`\`\`bash
# Terminal 3: Criar turma
curl -X POST http://localhost:3001/api/turmas \
  -H "Content-Type: application/json" \
  -d '{"nome":"Turma 1","descricao":"Teste"}'

# Listar turmas
curl http://localhost:3001/api/turmas

# Criar relatório (substitua turmaId)
curl -X POST http://localhost:3001/api/reports \
  -H "Content-Type: application/json" \
  -d '{"turmaId":1,"tipo":"pdf"}'

# Listar relatórios
curl http://localhost:3001/api/reports
\`\`\`

## Frontend - Primeiro Acesso

1. Abra `http://localhost:5173`
2. Clique em "Dashboard" para ver turmas
3. Clique em "Relatórios" para criar um novo
4. Preencha o formulário e clique "Gerar Relatório"
5. Aguarde o processamento e baixe quando pronto

Done! 🎉
