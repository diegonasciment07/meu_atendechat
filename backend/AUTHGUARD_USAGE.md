# authGuard Middleware - Exemplo de Uso

O middleware `authGuard.ts` foi criado com sucesso e está pronto para uso.

## ✅ Funcionalidades Implementadas

### 1. **Validação de Token JWT do Supabase**
- Extrai o token do header `Authorization: Bearer <token>`
- Valida o token usando `SUPABASE_JWT_SECRET`
- Retorna HTTP 401 com `{ error: "Unauthorized" }` se ausente ou inválido

### 2. **Decodificação e Anexação de Claims**
- Decodifica o JWT e extrai as claims do Supabase
- Anexa as informações do usuário em `req.user`
- Chama `next()` para continuar o fluxo

### 3. **Estrutura do req.user**
```typescript
req.user = {
  id: string,           // User ID (sub)
  email: string,        // Email do usuário
  profile: string,      // Perfil do usuário
  companyId: number,    // ID da empresa
  tenantId: string,     // ID do tenant
  roles: string[],      // Roles do usuário
  supabaseUser: any     // Claims completas do JWT
}
```

## 🚀 Exemplo de Uso

```typescript
import express from "express";
import authGuard from "./middleware/authGuard";

const router = express.Router();

// Aplicar o middleware authGuard
router.use(authGuard);

// Agora todas as rotas abaixo estão protegidas
router.get("/protected", (req, res) => {
  // req.user contém as informações do usuário autenticado
  res.json({
    message: "Acesso autorizado",
    user: req.user
  });
});
```

## 📋 Requisitos de Ambiente

Certifique-se de que a variável `SUPABASE_JWT_SECRET` está configurada no `.env`:

```env
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

## ✅ Status da Implementação

- ✅ Middleware criado: `src/middleware/authGuard.ts`
- ✅ Tipagem TypeScript correta
- ✅ Validação de JWT implementada
- ✅ Tratamento de erros adequado
- ✅ Compilação TypeScript bem-sucedida
- ✅ Compatível com interface Express existente