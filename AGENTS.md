# Selo — Agentes e Fluxo de Desenvolvimento

## Regras de Commit

1. **Commit por feature/tarefa:** Cada tarefa = um commit (ou múltiplos se muito grande)
2. **Mensagens claras:** Descreva o quê e por quê
3. **Formato:** `[FEATURE/FIX/DOCS/TEST] Nome da tarefa`

Exemplos:
```
[FEATURE] Criar painel de tenants (super-admin)
[FIX] Isolamento de dados por tenant em queries
[TEST] Testes de permissões granulares
[DOCS] Atualizar README com setup Render
```

## Fluxo de Push

- **Destino:** `main` branch
- **Frequência:** Um push por bloco entregável (feature completa)
- **Regra:** UM PUSH POR ENTREGA (não push a cada commit pequeno)

Exemplos de "um bloco":
- Tarefa #2: Autenticação super-admin + tenant login
- Tarefa #3: Painel tenants + criar novo tenant
- Tarefa #4: Gerenciar usuários + permissões

## Deploy em Render

- **Automático:** Render redeploy em cada push para `main`
- **Regra:** Todo push para `main` publica e reinicia o serviço
- **Sem downtime:** Render gerencia graceful restart

## Variáveis de Ambiente

**Desenvolvimento (.env.local):**
```
DATABASE_URL=postgresql://dev...
AWS_ACCESS_KEY_ID=dev...
JWT_SECRET=dev-secret
```

**Produção (Render):**
Configurar no painel Render → Environment variables

## Padrões de Código

### Imports
```typescript
import { prisma } from "@/lib/db";
import { verify } from "@/lib/auth";
import { S3Client } from "@aws-sdk/client-s3";
```

### API Routes (Tenant Context)
```typescript
// Sempre validar tenant_id no request
export async function POST(req: Request, { params }: { params: { tenant_slug: string } }) {
  const { tenant_slug } = params;
  const session = await getSession(req); // Valida JWT
  
  // Validar que tenant_id do session == tenant no URL
  if (session.tenant.slug !== tenant_slug) {
    return new Response("Forbidden", { status: 403 });
  }
  
  // Sua lógica aqui
}
```

### Permissões
```typescript
import { hasPermission } from "@/lib/permissions";

if (!await hasPermission(session.user.id, PERMISSIONS.FAZER_UPLOAD_DOCUMENTOS)) {
  return new Response("Sem permissão", { status: 403 });
}
```

### Audit Log (Append-Only)
```typescript
import { logAudit } from "@/lib/audit";

await logAudit({
  tenantId: session.tenant.id,
  usuarioId: session.user.id,
  acao: "upload_documento",
  recursoId: documento.id,
  detalhes: { nome: documento.nome, tamanho: documento.tamanho },
});
```

## Banco de Dados

### Migrations
```bash
# Criar migration
npx prisma migrate dev --name descricao_migracao

# Aplicar migrations (prod)
npx prisma migrate deploy
```

### Prisma Studio (desenvolvimento)
```bash
npx prisma studio
```

## Testes

**MVP:** Testes E2E manuais (Tarefa #8)

Futuro: Adicionar Jest + testes unitários

## Monitoramento (Render)

- Logs: Render Dashboard → Logs
- Métricas: CPU, RAM, requisições
- Alertas: Configurar se queda > 2 min

## Checklist de Deploy

- [ ] Código compilado sem erros (`npm run build`)
- [ ] Variáveis de ambiente configuradas em Render
- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Testes passando (ou marcados como skipped)
- [ ] URLs corretas em NEXT_PUBLIC_API_URL
- [ ] S3 bucket correto
- [ ] WhatsApp API key válida

---

**Última atualização:** 2026-09-17
