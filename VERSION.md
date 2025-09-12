# 🏷️ CONTROLE DE VERSÕES - CLIENTEJIMMY

## 📊 Versão Atual: **6.0.0**

### 📅 Última Atualização: 12/09/2025
### 🏗️ Build: Local
### 🌍 Ambiente: Desenvolvimento

---

## 📋 HISTÓRICO DE RELEASES

### v6.0.0-local.20250912
- **Data:** 12/09/2025
- **Tipo:** Versão Base
- **Ambiente:** Local
- **Descrição:** Sistema base AtendJimmy com todas as funcionalidades principais
- **Arquivos:**
  - `backend/dist/` - Compilado TypeScript
  - `frontend/build/` - Build React otimizado
- **Deploy:** Pendente
- **Notas:** Primeira versão com controle de versionamento estruturado

---

## 🎯 PRÓXIMAS VERSÕES PLANEJADAS

### v6.0.1 (Patch)
- **Tipo:** Correções de bugs
- **Previsão:** A definir
- **Escopo:** Correções menores e otimizações

### v6.1.0 (Minor)
- **Tipo:** Novas funcionalidades
- **Previsão:** A definir
- **Escopo:** 
  - Implementação nível "Leader"
  - Correção constraints filas
  - Ajustes CORS para N8N

### v7.0.0 (Major)
- **Tipo:** Breaking changes
- **Previsão:** A definir
- **Escopo:** Arquitetura omnichannel completa

---

## 📝 COMO USAR O CONTROLE DE VERSÕES

### 1. Build com Versionamento
```bash
# Execute o script aprimorado
build-and-version.bat

# Escolha o tipo:
# 1 = Patch (bug fix)
# 2 = Minor (nova funcionalidade)  
# 3 = Major (breaking change)
# 4 = Build apenas
```

### 2. Push para GitHub
```bash
# Após o build, faça push das tags
git push origin main --tags
```

### 3. Documentar Mudanças
- Atualizar `CHANGELOG.md` com detalhes
- Atualizar este arquivo `VERSION.md`
- Criar release no GitHub se necessário

---

## 🔄 PROCESSO DE RESTORE

### Para Restaurar uma Versão:

1. **Listar versões disponíveis:**
```bash
git tag -l
```

2. **Restaurar versão específica:**
```bash
git checkout v6.0.0-local.20250912
```

3. **Criar branch da versão:**
```bash
git checkout -b restore-v6.0.0 v6.0.0-local.20250912
```

4. **Rebuild se necessário:**
```bash
build-local.bat
```

---

## 📊 ESTATÍSTICAS

- **Total de Releases:** 1
- **Última Release:** v6.0.0-local.20250912
- **Próxima Release:** v6.0.1 ou v6.1.0
- **Ambiente Principal:** Local → Servidor Linux

---

## 🎯 CONVENÇÕES

### Formato de Tags:
- `v{MAJOR}.{MINOR}.{PATCH}-{ENV}.{DATE}`
- Exemplo: `v6.1.0-prod.20250915`

### Ambientes:
- `local` - Builds locais de desenvolvimento
- `dev` - Ambiente de desenvolvimento
- `staging` - Ambiente de homologação  
- `prod` - Ambiente de produção
- `hotfix` - Correções urgentes

### Tipos de Commit:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção
