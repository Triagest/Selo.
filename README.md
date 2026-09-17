# Selo — Sistema de Assinatura Eletrônica TRIA

Selo é uma plataforma **multi-tenant SaaS** de assinatura eletrônica desenvolvida para resolver o problema de assinatura manual e física em processos de prestação de contas. Inicialmente desenvolvida para IGI (Instituto de Gestão Integrada), Selo foi arquitetado desde o início para ser vendido e replicado para outras instituições públicas e organizações sociais.

## Visão Geral

### O Problema

Instituições como IGI precisam de assinatura em documentos digitalizados como parte de processos de prestação de contas. Atualmente, isso exige:
- Impressão de documentos
- Assinatura física manual
- Digitalização novamente
- Rastreabilidade manual via planilhas

**Selo resolve** permitindo assinatura eletrônica com rastreabilidade completa, auditoria de conformidade com Lei 14.063, e workflow sequencial de múltiplos assinantes.

### Por que Multi-Tenant

Selo foi construído como **plataforma multi-tenant desde o início**, não como produto branco. Isso significa:
- IGI é a primeira *empresa cliente* (não uma instância separada)
- Cada empresa tem seus próprios usuários, documentos, e dados
- Segurança e isolamento de dados entre tenants via `tenantId` em todas as tabelas
- Uma única instância Selo serve múltiplos clientes com máxima eficiência

## Stack Tecnológico

### Frontend
- **Next.js 16** + React 19 + TypeScript
- **Tailwind CSS** para styling
- **react-pdf** + **pdfjs-dist** para visualização de PDFs

### Backend
- **Next.js API Routes** (serverless-friendly)
- **Autenticação stateless**: JWT com HttpOnly cookies
- **Middleware**: Validação de tenant isolation

### Banco de Dados
- **PostgreSQL** (gerenciado via Render)
- **Prisma ORM** para migrations e type-safety
- **Append-only Audit Log** para Lei 14.063 compliance

### Armazenamento
- **AWS S3** para documentos, logos, e assinaturas visuais
- **Signed URLs** para acesso seguro

### Notificações
- **Twilio WhatsApp API** para alertas

### Hospedagem
- **Render** com auto-deploy on push
- **Custom Domain**: selo.triagest.com

## Autenticação Dual

**Super-Admin (matriz Selo):**
- Login em `/admin/super-login`
- JWT: `selo_super_token` (24h expiration)
- Cria tenants, gerencia logos

**Tenant User (operador de empresa):**
- Login em `/{tenant_slug}/login`
- JWT: `selo_token` com `tenantId` no payload
- Acesso apenas à sua empresa

## Permissões Granulares

Cada usuário tem permissões específicas (não roles fixos):
- `criar_usuarios`
- `editar_usuarios`
- `deletar_usuarios`
- `gerenciar_documentos`
- `assinar_documentos`
- `visualizar_auditoria`

## Quick Start

### 1. Instalar dependências

```bash
npm install --legacy-peer-deps
```

### 2. Configurar `.env.local`

```bash
cp .env.example .env.local
# Editar com valores reais para: DATABASE_URL, JWT_SECRET, AWS_*, TWILIO_*
```

### 3. Criar banco de dados

```bash
npx prisma migrate dev --name init
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Abrir http://localhost:3000

## Fluxo de Assinatura

```
1. Admin cria tenant (empresa cliente) e loga logo
2. Master user é criado automaticamente com todas as permissões
3. Master user cria operadores com permissões específicas
4. Operador faz upload de PDF e seleciona assinantes
5. Sistema envia WhatsApp ao 1º assinante: "Doc XYZ pendente sua assinatura"
6. Assinante faz login, visualiza PDF, clica "Assinar"
7. Sistema registra: data_hora, IP, user_agent, assinatura_visual
8. Audit log registra: "ASSINOU_DOCUMENTO" (append-only)
9. Se há próximo assinante: notifica via WhatsApp
10. Se foi último: notifica operador que doc está COMPLETO
11. Operador faz download do PDF com assinaturas incorporadas
```

## Segurança & Lei 14.063

Selo cumpre requisitos mínimos de lei:

| Requisito | Implementação |
|-----------|---|
| Rastreamento | `assinaturas_realizadas.usuario_id` |
| Data/hora | `assinaturas_realizadas.data_hora` (UTC) |
| IP + User-Agent | Registrados em `assinaturas_realizadas` |
| Não-repúdio | Audit log append-only |
| Integridade | SHA-256 hash do PDF |

## Modelo de Dados Simplificado

```
SuperAdmin (id, username, password_hash, email)
Tenant (id, name, slug, logo_url, master_user_id)
User (id, tenant_id, nome, email, username, password_hash, phone_number, assinatura_visual_url)
UserPermission (usuario_id, permission)
Documento (id, tenant_id, nome, arquivo_url, s3_key, status, criado_por)
AssinaturaPendente (id, tenant_id, documento_id, usuario_responsavel_id, ordem_sequencia, assinado_em)
AssinaturaRealizada (id, tenant_id, assinatura_pendente_id, usuario_id, data_hora, ip_address, user_agent, assinatura_visual_url)
AuditLog (id, tenant_id, usuario_id, acao, recurso_id, detalhes, created_at) — APPEND ONLY
```

## Estrutura de Pastas

```
selo/
├── src/app/
│   ├── admin/super-login/page.tsx
│   ├── admin/tenants/page.tsx
│   ├── [tenant_slug]/login/page.tsx
│   ├── [tenant_slug]/usuarios/page.tsx
│   ├── [tenant_slug]/documentos/page.tsx
│   ├── [tenant_slug]/documentos/novo/page.tsx
│   ├── [tenant_slug]/documentos/[id]/page.tsx
│   ├── [tenant_slug]/pendentes/page.tsx
│   ├── [tenant_slug]/auditoria/page.tsx
│
├── src/api/
│   ├── auth/super-login/route.ts
│   ├── auth/login/route.ts
│   ├── admin/tenants/route.ts
│   ├── admin/tenants/create/route.ts
│   ├── [tenant_slug]/usuarios/route.ts
│   ├── [tenant_slug]/usuarios/create/route.ts
│   ├── [tenant_slug]/documentos/route.ts
│   ├── [tenant_slug]/documentos/create/route.ts
│   ├── [tenant_slug]/assinaturas/pendentes/route.ts
│   ├── [tenant_slug]/assinatura/create/route.ts
│   ├── [tenant_slug]/audit/route.ts
│
├── src/lib/
│   ├── auth.ts (JWT, passwords)
│   ├── db.ts (Prisma singleton)
│   ├── s3.ts (AWS S3)
│   ├── whatsapp.ts (Twilio)
│   ├── permissions.ts (hasPermission, etc)
│   ├── audit.ts (append-only logging)
│
├── src/components/
│   ├── PDFViewer.tsx
│   ├── NavBar.tsx
│
├── prisma/schema.prisma
├── .env.local
├── .env.example
├── .gitignore
├── package.json
├── DEPLOY.md
└── README.md
```

## Scripts Úteis

```bash
npm run dev                  # Rodar em desenvolvimento
npm run build              # Build para produção
npm run lint               # Linter
npx prisma migrate dev     # Criar/executar migrations
npx prisma studio         # UI do banco de dados
npx prisma migrate reset   # Resetar banco (dev only)
```

## Deployment

Veja **DEPLOY.md** para guia passo-a-passo no Render.

### Resumo:
1. PostgreSQL database no Render
2. Web Service Node.js
3. Environment variables (DATABASE_URL, AWS_*, TWILIO_*, JWT_SECRET)
4. Custom domain (selo.triagest.com)
5. Rodar migrations: `npx prisma migrate deploy`
6. Auto-deploy on push to main branch

## Troubleshooting

### "Cannot read properties of null (reading 'edgesOut')"
```bash
npm install --legacy-peer-deps
npm run dev --legacy-peer-deps
```

### Database connection refused
- Verificar `DATABASE_URL` está correto
- PostgreSQL deve estar rodando
- Esperar 2-3 min após criar DB no Render

### WhatsApp não funciona
- Verificar credenciais Twilio em `.env.local`
- Número em formato E.164: `+55XXXXXXXXXX`

### PDF não abre
- Verificar arquivo está em S3 corretamente
- Testar presigned URL
- Validar PDF não está corrompido

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Lei 14.063/2020](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp/api)
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/latest/developer-guide/welcome.html)

---

**Desenvolvido por TRIA Group — Versão 1.0.0 — Setembro 2026**
