# Selo — Render Deployment Guide

## Pré-requisitos

- Conta Render (https://render.com)
- Repositório GitHub com o código do Selo
- AWS S3 bucket (`selo-tria`) com credenciais
- Twilio account (opcional, para WhatsApp)

## Passo 1: Criar PostgreSQL Database no Render

1. Acesse https://dashboard.render.com
2. Clique em **New +** → **PostgreSQL**
3. Configure:
   - **Name:** `selo-db`
   - **Database:** `selo`
   - **User:** `postgres`
   - **Region:** `São Paulo (sa-east-1)` (mais perto do Brasil)
   - **Plan:** Starter (free tier)
4. Clique **Create Database**
5. Copie a **Internal Database URL** (algo como `postgresql://user:pass@host:5432/selo`)
   - Salve para usar no Web Service

## Passo 2: Criar Web Service (Node.js)

1. Clique **New +** → **Web Service**
2. Conecte seu repositório GitHub do Selo
3. Configure:
   - **Name:** `selo`
   - **Environment:** `Node`
   - **Build Command:** `npm install --legacy-peer-deps && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter (free tier)

## Passo 3: Configurar Environment Variables

No painel do Web Service, vá para **Environment** e adicione:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://selo-XXXX.onrender.com

DATABASE_URL=postgresql://user:pass@dpg-XXXXX.postgres.render.com:5432/selo

JWT_SECRET=seu-jwt-secret-aleatorio-muito-longo

AWS_REGION=us-east-1
AWS_S3_BUCKET=selo-tria
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key

TWILIO_ACCOUNT_SID=sua-account-sid
TWILIO_AUTH_TOKEN=seu-auth-token
TWILIO_PHONE_NUMBER=+55-seu-numero-whatsapp
```

**Importante:** Substitua valores com dados reais.

## Passo 4: Configurar Database Connection

1. Vá para o Database criado (`selo-db`)
2. Copie a **Internal Database URL**
3. No Web Service, adicione como `DATABASE_URL`

## Passo 5: Auto-Deploy

Render faz auto-deploy quando você faz push para `main`:

```bash
git add .
git commit -m "Deploy Selo to Render"
git push origin main
```

O Render automaticamente:
- Cria build (`npm install --legacy-peer-deps && npm run build`)
- Roda migrations Prisma (via `npm start`)
- Inicia aplicação em `https://selo-XXXX.onrender.com`

## Passo 6: Migrations & Banco de Dados

Na primeira vez, você precisa rodar as migrations Prisma:

```bash
# Local (antes de fazer push)
npx prisma migrate dev --name init

# Ou no Render (via SSH/CLI)
render exec -s selo "npx prisma migrate deploy"
```

Para resetar banco em development:
```bash
npx prisma migrate reset
```

## Passo 7: Conectar Custom Domain

Para usar `selo.triagest.com`:

1. No painel Web Service, vá para **Settings**
2. Clique **Add Custom Domain**
3. Digite `selo.triagest.com`
4. Render gera um CNAME (ex: `gw.onrender.com`)
5. Adicione no DNS do seu domínio:
   ```
   CNAME selo -> gw.onrender.com
   ```
6. Espere 1-2 minutos pela propagação

## Passo 8: Monitoramento

No Render Dashboard:
- **Logs:** Veja erros em tempo real
- **Metrics:** CPU, memória, requisições
- **Deploys:** Histórico de deployments

## Rollback (se necessário)

Se um deploy quebrou:

1. Vá para **Deploys** no Web Service
2. Clique em um deploy anterior
3. Clique **Redeploy**

## Troubleshooting

### "Cannot find module X"
Rode `npm install --legacy-peer-deps` localmente e faça push.

### Database connection refused
- Verifique se `DATABASE_URL` está correto
- Confirme que PostgreSQL está running
- Espere 2-3 minutos após criar DB

### Prisma migration fails
```bash
# Force update schema no banco
npx prisma migrate deploy --skip-generate
```

### WhatsApp not working
- Verifique credenciais Twilio em Environment
- Confirme que `TWILIO_PHONE_NUMBER` está em formato correto: `+55XXXXXXXXXX`

## Custos Render

- **Web Service (Starter):** Free (com dormência após 15 min inatividade)
- **PostgreSQL (Starter):** Free (com limites: 256 MB, 1 GB storage)
- **Para produção:** Upgrade para pagar planos ($7-50/mês)

## Pro Tips

1. **Cron Jobs:** Use Render Cron Job para limpar audit logs antigos
2. **Backup:** PostgreSQL do Render faz backups automáticos
3. **SSL:** Render fornece HTTPS automático
4. **Scaling:** Upgrade plan se atingir limites de dormência

---

**Resumo do Deploy:**
1. ✅ PostgreSQL no Render
2. ✅ Web Service com auto-deploy
3. ✅ Environment variables (secrets seguros)
4. ✅ Custom domain apontado
5. ✅ Migrations rodadas
6. ✅ Monitoramento ativo

Seu Selo está pronto para produção! 🚀
