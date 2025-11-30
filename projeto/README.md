# Projeto: Gestão Financeira Pessoal

Protótipo de aplicação para gestão financeira pessoal.

Stack:
- Backend: Node.js + Express
- DB: MySQL
- Frontend: HTML/CSS/Vanilla JS
- Autenticação: JWT

Estrutura:
- `backend/` - servidor express
- `frontend/` - páginas estáticas
- `database/schema.sql` - schema para criar DB/tabelas

Setup (Windows PowerShell):

1. Criar banco e tabelas
   - Abra seu cliente MySQL e execute o arquivo `database/schema.sql`.

2. Configurar variáveis de ambiente
   - Copie `backend/.env.example` para `backend/.env` e preencha as credenciais:
     - PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET

3. Instalar dependências e rodar servidor

```powershell
cd .\projeto\backend
npm install
npm start
```

4. Abrir frontend
- Você pode abrir `frontend/index.html` diretamente no navegador.
- Recomendo servir a pasta `frontend` com um servidor estático (por exemplo, `npx serve frontend`) para evitar problemas de CORS quando integrar com APIs locais.

Notas:
- Endpoints principais: `/api/auth`, `/api/transactions`, `/api/debtors`, `/api/debt_history`, `/api/settings`.
- Algumas funcionalidades (agregações para gráficos, pesquisas avançadas) são esqueleto e podem ser estendidas.
 - Endpoints de agregação para o dashboard:
    - `GET /api/transactions/aggregates/categories?type=expense` -> distribuição por categoria
    - `GET /api/transactions/aggregates/monthly` -> saldo mensal (lista year-month, income, expense, balance)

Próximos passos recomendados:
- Adicionar testes automatizados básicos (supertest / jest)
- Melhorar validação (Joi / express-validator)
- Implementar paginação e endpoints agregados para os gráficos
 - Melhorar interface do frontend, toasts e validações
