# 📋 GUIA DE IMPLEMENTAÇÃO - NOVA INSTALAÇÃO ATENDJIMMY

## 🎯 ESCOPO DA IMPLEMENTAÇÃO

### ✅ **IMPLEMENTAR APENAS:**
1. Criação do nível "Leader" no sistema de usuários
2. Correção das filas de atendimento (constraints por empresa)
3. Ajustes CORS para integração N8N externa

### ❌ **IGNORAR COMPLETAMENTE:**
- Sistema SPIN Selling
- Análises de atendimento
- Funcionalidades de IA/N8N para análise
- Gestão de Leads

---

## 👥 1. IMPLEMENTAÇÃO DO NÍVEL "LEADER"

### 1.1 Alterações no Banco de Dados

**Problema Identificado:**
- Sistema atual possui apenas: "admin", "user", "super"
- Necessário criar nível intermediário "Leader" com permissões específicas

**Solução - Migration SQL:**
```sql
-- Adicionar novo valor ao ENUM profile
ALTER TYPE enum_Users_profile ADD VALUE 'leader';

-- OU se não funcionar, recriar o ENUM:
ALTER TABLE "Users" ALTER COLUMN profile TYPE VARCHAR(20);
DROP TYPE IF EXISTS enum_Users_profile;
CREATE TYPE enum_Users_profile AS ENUM ('admin', 'user', 'super', 'leader');
ALTER TABLE "Users" ALTER COLUMN profile TYPE enum_Users_profile USING profile::enum_Users_profile;
```

### 1.2 Alterações no Modelo User (Backend)

**Arquivo:** `backend/src/models/User.ts`

**Localizar linha ~45:**
```typescript
@Column({
  type: DataType.ENUM("admin", "user", "super"),
  allowNull: false,
  defaultValue: "user"
})
profile: string;
```

**Alterar para:**
```typescript
@Column({
  type: DataType.ENUM("admin", "user", "super", "leader"),
  allowNull: false,
  defaultValue: "user"
})
profile: string;
```

### 1.3 Alterações no Frontend

**Arquivo:** `frontend/src/components/UserModal/index.js`

**Localizar seção de seleção de perfil (~linha 200):**
```javascript
<MenuItem value="admin">Admin</MenuItem>
<MenuItem value="user">User</MenuItem>
<MenuItem value="super">Super</MenuItem>
```

**Adicionar:**
```javascript
<MenuItem value="leader">Leader</MenuItem>
```

**Arquivo:** `frontend/src/rules.js`

**Adicionar permissões específicas para Leader:**
```javascript
const rules = {
  // ... regras existentes

  leader: {
    static: [
      "dashboard:view",
      "tickets:view",
      "tickets:edit",
      "contacts:view",
      "contacts:edit",
      "users:view",
      "queues:view",
      "whatsapp:view",
      "reports:view"
    ]
  }
};
```

### 1.4 Middleware de Autorização

**Criar novo middleware:** `backend/src/middleware/isLeader.ts`
```typescript
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

interface AuthenticatedRequest extends Request {
  user?: {
    profile: string;
  };
}

const isLeader = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const { profile } = req.user!;

  if (profile !== "leader" && profile !== "admin" && profile !== "super") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  return next();
};

export default isLeader;
```

---

## 🎯 2. CORREÇÃO DAS FILAS DE ATENDIMENTO

### 2.1 Problema Identificado

**Situação Atual:**
- Constraints únicos globais em `name` e `color` na tabela Queues
- Empresas diferentes não podem criar filas com mesmo nome/cor
- Erro: "duplicate key value violates unique constraint"

**Arquivo Problemático:** `backend/src/models/Queue.ts` (linhas 36-43)
```typescript
@Unique
@Column
name: string;

@Unique
@Column
color: string;
```

### 2.2 Solução - Migration de Correção

**Criar migration:** `backend/src/database/migrations/20250904135300-fix-queue-unique-constraints.js`

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remover constraints únicos globais existentes
    try {
      await queryInterface.removeConstraint('Queues', 'Queues_name_key');
    } catch (error) {
      console.log('Constraint Queues_name_key não encontrada ou já removida');
    }
    
    try {
      await queryInterface.removeConstraint('Queues', 'Queues_color_key');
    } catch (error) {
      console.log('Constraint Queues_color_key não encontrada ou já removida');
    }

    // Criar índices únicos compostos (nome + empresa)
    await queryInterface.addIndex('Queues', ['name', 'companyId'], {
      unique: true,
      name: 'queues_name_company_unique'
    });

    await queryInterface.addIndex('Queues', ['color', 'companyId'], {
      unique: true,
      name: 'queues_color_company_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: remover índices compostos
    await queryInterface.removeIndex('Queues', 'queues_name_company_unique');
    await queryInterface.removeIndex('Queues', 'queues_color_company_unique');

    // Recriar constraints globais (se necessário)
    await queryInterface.addConstraint('Queues', {
      fields: ['name'],
      type: 'unique',
      name: 'Queues_name_key'
    });

    await queryInterface.addConstraint('Queues', {
      fields: ['color'],
      type: 'unique',
      name: 'Queues_color_key'
    });
  }
};
```

### 2.3 Alteração no Modelo Queue

**Arquivo:** `backend/src/models/Queue.ts`

**Localizar e REMOVER as linhas:**
```typescript
@Unique  // <- REMOVER esta linha
@Column
name: string;

@Unique  // <- REMOVER esta linha
@Column
color: string;
```

**Substituir por:**
```typescript
@Column
name: string;

@Column
color: string;
```

**Adicionar no final da classe, antes do fechamento:**
```typescript
// Índices únicos compostos definidos na migration
// name + companyId deve ser único
// color + companyId deve ser único
```

### 2.4 Validação nos Services

**Verificar arquivo:** `backend/src/services/QueueService/CreateQueueService.ts`

**Confirmar que a validação já filtra por empresa:**
```typescript
const queueWithSameName = await Queue.findOne({
  where: { name, companyId }  // <- Deve ter companyId
});

const queueWithSameColor = await Queue.findOne({
  where: { color, companyId }  // <- Deve ter companyId
});
```

---

## 🌐 3. AJUSTES CORS PARA INTEGRAÇÃO N8N

### 3.1 Problema Identificado

**Situação:**
- Requisições de URLs externas do N8N são bloqueadas por CORS
- Headers personalizados não são aceitos
- Webhooks externos não conseguem acessar a API

### 3.2 Configuração CORS no Backend

**Arquivo:** `backend/src/app.ts`

**Localizar configuração atual do CORS e substituir por:**
```typescript
import cors from 'cors';

// Configuração CORS expandida para N8N
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://seu-dominio-frontend.com',
    'https://n8n-n8n.jehlkg.easypanel.host',  // N8N externo
    'https://hooks.zapier.com',               // Zapier (se usar)
    'https://api.make.com'                    // Make.com (se usar)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Evaluating-Token',     // Header customizado para N8N
    'X-Webhook-Token',        // Header para webhooks
    'Origin',
    'Accept'
  ],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400 // Cache preflight por 24h
};

app.use(cors(corsOptions));

// Middleware adicional para OPTIONS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Evaluating-Token,X-Webhook-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});
```

### 3.3 Configuração Nginx (Se Aplicável)

**Arquivo:** `/etc/nginx/sites-available/seu-site`

**Adicionar headers CORS no bloco server:**
```nginx
server {
    # ... configurações existentes

    # Headers CORS globais
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Evaluating-Token' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

    # Tratar requisições OPTIONS
    location / {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Evaluating-Token';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # ... resto da configuração
    }
}
```

### 3.4 Variáveis de Ambiente

**Arquivo:** `backend/.env`

**Adicionar configurações para URLs externas:**
```env
# URLs permitidas para CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://seu-dominio.com,https://n8n-n8n.jehlkg.easypanel.host

# Configurações N8N (se necessário)
N8N_WEBHOOK_URL=https://n8n-n8n.jehlkg.easypanel.host/webhook
N8N_API_KEY=sua_chave_api_aqui

# Headers customizados permitidos
CUSTOM_HEADERS=X-Evaluating-Token,X-Webhook-Token,X-Custom-Auth
```

### 3.5 Middleware de Validação para Webhooks

**Criar:** `backend/src/middleware/validateWebhook.ts`
```typescript
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";

interface WebhookRequest extends Request {
  headers: {
    'x-evaluating-token'?: string;
    'x-webhook-token'?: string;
  };
}

const validateWebhook = (req: WebhookRequest, res: Response, next: NextFunction): void => {
  const evaluatingToken = req.headers['x-evaluating-token'];
  const webhookToken = req.headers['x-webhook-token'];
  
  // Validar se pelo menos um token está presente
  if (!evaluatingToken && !webhookToken) {
    throw new AppError("ERR_WEBHOOK_TOKEN_REQUIRED", 401);
  }

  // Validar token específico do N8N
  if (evaluatingToken && evaluatingToken !== process.env.EVALUATING_AGENT_TOKEN) {
    throw new AppError("ERR_INVALID_WEBHOOK_TOKEN", 401);
  }

  return next();
};

export default validateWebhook;
```

---

## 📋 RESUMO DOS ARQUIVOS A MODIFICAR

### Backend:
1. `src/models/User.ts` - Adicionar "leader" ao ENUM
2. `src/models/Queue.ts` - Remover @Unique de name e color
3. `src/app.ts` - Configurar CORS expandido
4. `src/middleware/isLeader.ts` - Novo middleware (criar)
5. `src/middleware/validateWebhook.ts` - Novo middleware (criar)
6. `src/database/migrations/[timestamp]-fix-queue-constraints.js` - Nova migration (criar)
7. `.env` - Adicionar variáveis CORS e N8N

### Frontend:
1. `src/components/UserModal/index.js` - Adicionar opção Leader
2. `src/rules.js` - Definir permissões Leader

### Servidor:
1. `/etc/nginx/sites-available/seu-site` - Headers CORS (se aplicável)

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

1. **Migration para ENUM User profile** (SQL direto no banco)
2. **Alterações no modelo User** (backend/src/models/User.ts)
3. **Migration para constraints Queue** (criar migration file)
4. **Alterações no modelo Queue** (backend/src/models/Queue.ts)
5. **Configuração CORS** (backend/src/app.ts)
6. **Middlewares de validação** (criar novos arquivos)
7. **Alterações frontend** (UserModal e rules.js)
8. **Executar migrations** (`npm run db:migrate`)
9. **Build e deploy** (testar funcionalidades)
10. **Testes de validação** (criar usuário Leader, filas com mesmo nome, requisições CORS)

---

## ✅ VALIDAÇÃO PÓS-IMPLEMENTAÇÃO

### Testes Obrigatórios:

1. **Nível Leader:**
   - [ ] Criar usuário com perfil "leader"
   - [ ] Verificar permissões específicas
   - [ ] Testar acesso a funcionalidades

2. **Filas de Atendimento:**
   - [ ] Criar fila com mesmo nome em empresas diferentes
   - [ ] Verificar que não há erro de constraint
   - [ ] Confirmar que dentro da mesma empresa nomes permanecem únicos

3. **CORS N8N:**
   - [ ] Testar requisição de URL externa do N8N
   - [ ] Verificar headers customizados aceitos
   - [ ] Confirmar que webhooks funcionam

### Comandos de Teste:
```bash
# Testar CORS
curl -X OPTIONS https://seu-dominio.com/api/test \
  -H "Origin: https://n8n-n8n.jehlkg.easypanel.host" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Evaluating-Token"

# Verificar migrations
npm run db:migrate:status

# Build e restart
npm run build
pm2 restart all
```

---

## 📞 TEXTO PARA NOVA CONVERSA

```
Preciso implementar 3 funcionalidades específicas no sistema AtendJimmy:

1. CRIAÇÃO DO NÍVEL "LEADER":
   - Adicionar novo perfil "leader" ao ENUM de usuários no banco
   - Alterar modelo User.ts para incluir "leader" 
   - Atualizar frontend (UserModal) para mostrar opção Leader
   - Criar middleware isLeader.ts para controle de acesso
   - Definir permissões específicas em rules.js

2. CORREÇÃO DAS FILAS DE ATENDIMENTO:
   - Problema: Constraints únicos globais em name/color impedem empresas diferentes de usar mesmo nome
   - Solução: Remover @Unique do modelo Queue.ts
   - Criar migration para remover constraints globais e criar índices únicos compostos (name+companyId, color+companyId)
   - Permitir que empresas diferentes tenham filas com mesmo nome/cor

3. AJUSTES CORS PARA N8N EXTERNO:
   - Configurar CORS no backend (app.ts) para aceitar URLs do N8N
   - Adicionar headers customizados: X-Evaluating-Token, X-Webhook-Token
   - Configurar Nginx com headers CORS (se aplicável)
   - Criar middleware validateWebhook.ts para validar tokens de webhook
   - Adicionar variáveis de ambiente para URLs permitidas

IMPORTANTE: Ignorar completamente sistema SPIN Selling, análises de IA, gestão de leads. Focar apenas nas 3 funcionalidades listadas.

Preciso das implementações detalhadas com código específico para cada alteração.
```

---

**Documento gerado em:** 12/09/2025  
**Versão:** 1.0  
**Sistema:** AtendJimmy - Nova Instalação
