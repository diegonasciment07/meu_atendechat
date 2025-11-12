# 📊 PLANS AFTER NORMALIZATION

**Data da Consulta**: 12/11/2025, 00:56:44
**Banco**: Supabase PostgreSQL (cgnjnxkoybrmtinvluus.supabase.co)
**Total de Registros**: 3
**Status**: Planos normalizados com limites e overages JSONB

---

## 1. STARTER (ID: 1)

### 💰 Financeiro
- **Preço**: R$ 297

### 👥 Limites Básicos
- **Usuários**: 2
- **Instâncias WhatsApp**: 1
- **Filas**: 1

### 🎯 Limites JSONB
```json
{
  "users": 2,
  "webhooks": 0,
  "ai_enabled": false,
  "automations": 2,
  "whatsapp_instances": 1,
  "data_retention_days": 30,
  "ai_requests_included": 0
}
```

**Resumo dos Limites**:
- Usuários: 2
- WhatsApp: 1
- Automações: 2
- Webhooks: 0
- IA Requests: 0
- IA Habilitado: ❌
- Retenção: 30 dias

### 💸 Overage JSONB
```json
{
  "extra_user": 19.9,
  "ai_requests": null,
  "extra_whatsapp_instance": 49.9
}
```

**Preços de Overage**:
- IA Requests: N/A
- Usuário Extra: R$ 19.9
- WhatsApp Extra: R$ 49.9

### ⚙️ Features
- Campaigns: ✅
- External API: ✅
- Internal Chat: ✅
- Schedules: ✅
- Kanban: ✅
- Integrations: ✅
- OpenAI: ❌

### 🕒 Timestamps
- **Criado**: 11/11/2025, 20:27:50
- **Atualizado**: 12/11/2025, 00:55:06

---

## 2. PRO (ID: 2)

### 💰 Financeiro
- **Preço**: R$ 697

### 👥 Limites Básicos
- **Usuários**: 5
- **Instâncias WhatsApp**: 2
- **Filas**: 3

### 🎯 Limites JSONB
```json
{
  "users": 5,
  "webhooks": 3,
  "ai_enabled": true,
  "automations": 5,
  "whatsapp_instances": 2,
  "data_retention_days": 90,
  "ai_requests_included": 300
}
```

**Resumo dos Limites**:
- Usuários: 5
- WhatsApp: 2
- Automações: 5
- Webhooks: 3
- IA Requests: 300
- IA Habilitado: ✅
- Retenção: 90 dias

### 💸 Overage JSONB
```json
{
  "extra_user": 19.9,
  "ai_requests": 0.29,
  "extra_whatsapp_instance": 49.9
}
```

**Preços de Overage**:
- IA Requests: R$ 0.29
- Usuário Extra: R$ 19.9
- WhatsApp Extra: R$ 49.9

### ⚙️ Features
- Campaigns: ✅
- External API: ✅
- Internal Chat: ✅
- Schedules: ✅
- Kanban: ✅
- Integrations: ✅
- OpenAI: ✅

### 🕒 Timestamps
- **Criado**: 11/11/2025, 20:27:50
- **Atualizado**: 12/11/2025, 00:55:07

---

## 3. ENTERPRISE (ID: 3)

### 💰 Financeiro
- **Preço**: R$ 1497

### 👥 Limites Básicos
- **Usuários**: 10
- **Instâncias WhatsApp**: 5
- **Filas**: 10

### 🎯 Limites JSONB
```json
{
  "users": 10,
  "webhooks": 10,
  "ai_enabled": true,
  "automations": 10,
  "whatsapp_instances": 5,
  "data_retention_days": 365,
  "ai_requests_included": 1500
}
```

**Resumo dos Limites**:
- Usuários: 10
- WhatsApp: 5
- Automações: 10
- Webhooks: 10
- IA Requests: 1500
- IA Habilitado: ✅
- Retenção: 365 dias

### 💸 Overage JSONB
```json
{
  "extra_user": 19.9,
  "ai_requests": 0.19,
  "extra_whatsapp_instance": 49.9
}
```

**Preços de Overage**:
- IA Requests: R$ 0.19
- Usuário Extra: R$ 19.9
- WhatsApp Extra: R$ 49.9

### ⚙️ Features
- Campaigns: ✅
- External API: ✅
- Internal Chat: ✅
- Schedules: ✅
- Kanban: ✅
- Integrations: ✅
- OpenAI: ✅

### 🕒 Timestamps
- **Criado**: 11/11/2025, 20:27:50
- **Atualizado**: 12/11/2025, 00:55:07

---

## 📊 Tabela Comparativa Final

| Plano | Preço | Usuários | WhatsApp | Automações | Webhooks | IA Requests | Retenção | OpenAI |
|-------|-------|----------|----------|------------|----------|-------------|----------|--------|
| STARTER | R$ 297 | 2 | 1 | 2 | N/A | N/A | 30 dias | ❌ |
| PRO | R$ 697 | 5 | 2 | 5 | 3 | 300 | 90 dias | ✅ |
| ENTERPRISE | R$ 1497 | 10 | 5 | 10 | 10 | 1500 | 365 dias | ✅ |

## 💸 Tabela de Overages

| Plano | IA Request | Usuário Extra | WhatsApp Extra |
|-------|------------|---------------|----------------|
| STARTER | N/A | R$ 19.9 | R$ 49.9 |
| PRO | R$ 0.29 | R$ 19.9 | R$ 49.9 |
| ENTERPRISE | R$ 0.19 | R$ 19.9 | R$ 49.9 |

---

**✅ Status**: Normalização concluída com sucesso
**🎯 Estrutura**: Limites e overages em formato JSONB
**📈 Compatibilidade**: planLimitGuard + UsageCounter ready
