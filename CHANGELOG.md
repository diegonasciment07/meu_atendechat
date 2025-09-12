# 📋 CHANGELOG - CLIENTEJIMMY

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### 🚀 Adicionado
- Sistema de versionamento automático
- Script `build-and-version.bat` aprimorado
- Documentação de releases estruturada

### 🔧 Alterado
- Processo de build agora inclui controle de versão
- Estrutura de branches para melhor organização

---

## [6.0.0] - 2025-09-12

### 📦 Versão Base
- Sistema AtendJimmy completo
- Backend em TypeScript/Node.js
- Frontend em React.js 17.0.2
- Integração WhatsApp via Baileys
- Sistema multi-tenant
- Dashboard de métricas
- Sistema SPIN Selling
- Gestão de Leads

### 🏗️ Arquitetura
- **Backend:** Express + Sequelize + PostgreSQL
- **Frontend:** React + Material-UI
- **Cache:** Redis
- **Containerização:** Docker + Docker Compose
- **Process Manager:** PM2

### 🔐 Segurança
- Autenticação JWT
- Sistema de permissões por perfil
- Multi-tenancy com isolamento completo

---

## Tipos de Mudanças
- 🚀 **Adicionado** para novas funcionalidades
- 🔧 **Alterado** para mudanças em funcionalidades existentes
- ❌ **Descontinuado** para funcionalidades que serão removidas
- 🗑️ **Removido** para funcionalidades removidas
- 🐛 **Corrigido** para correções de bugs
- 🔒 **Segurança** para vulnerabilidades corrigidas

---

## Formato de Versionamento
- **MAJOR.MINOR.PATCH-ENVIRONMENT.BUILD**
- Exemplo: `6.1.0-prod.20250912`

### Ambientes:
- `prod` - Produção
- `dev` - Desenvolvimento  
- `staging` - Homologação
- `hotfix` - Correções urgentes
- `local` - Builds locais
