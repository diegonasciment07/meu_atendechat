#!/usr/bin/env bash
set -euo pipefail

PROJ="/root/codatendechat"
ZIP_NEW="frontend_fale_direito_v2.zip"

echo "🟢 Iniciando migração automática para o tema Fale Direito..."
cd "$PROJ"

# 1️⃣ BACKUP
echo "📦 Criando backup..."
tar -czf "backup_$(date +%Y%m%d_%H%M).tar.gz" frontend docker-compose.yml
echo "✅ Backup salvo como $(ls -t backup_*.tar.gz | head -1)"

# 2️⃣ SUBSTITUIR FRONTEND
if [ ! -f "$ZIP_NEW" ]; then
  echo "❌ ERRO: arquivo $ZIP_NEW não encontrado em $PROJ"
  exit 1
fi
echo "📁 Aplicando novo frontend..."
unzip -o "$ZIP_NEW" -d "$PROJ" >/dev/null

# 3️⃣ AJUSTAR DOCKERFILE
echo "⚙️ Ajustando Dockerfile para Node 18..."
sed -i 's/FROM node:.*/FROM node:18-alpine/' frontend/Dockerfile || true
grep -q "SKIP_PREFLIGHT_CHECK" frontend/Dockerfile || echo -e '\nENV SKIP_PREFLIGHT_CHECK=true\nENV NODE_OPTIONS="--openssl-legacy-provider"' >> frontend/Dockerfile

# 4️⃣ VALIDAR package.json
echo "🔍 Validando package.json..."
cd frontend
python3 - <<'PY'
import json
try:
    json.load(open('package.json'))
    print("✅ package.json válido")
except Exception as e:
    print("❌ ERRO: package.json inválido ->", e)
    exit(1)
PY

# 5️⃣ BUILD LOCAL (opcional)
echo "🏗️ Gerando build local (para verificar)..."
export NODE_OPTIONS=--openssl-legacy-provider
export SKIP_PREFLIGHT_CHECK=true
yarn install --frozen-lockfile || npm install
yarn build || npm run build

# 6️⃣ REBUILD DOCKER
echo "🐳 Rebuildando Docker frontend..."
cd "$PROJ"
docker compose build --no-cache frontend

# 7️⃣ SUBINDO CONTAINERS
echo "🚀 Subindo containers..."
docker compose up -d

# 8️⃣ AUTO RESTART NO BOOT
echo "🔁 Garantindo restart automático..."
if ! grep -q "restart: always" docker-compose.yml; then
  sed -i '/frontend:/a\  restart: always' docker-compose.yml
  sed -i '/backend:/a\  restart: always' docker-compose.yml
  sed -i '/postgres:/a\  restart: always' docker-compose.yml
  sed -i '/redis:/a\  restart: always' docker-compose.yml
fi
systemctl enable docker >/dev/null 2>&1 || true

# 9️⃣ STATUS FINAL
echo "✅ Containers ativos:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "🌐 Frontend disponível em: http://$(hostname -I | awk '{print $1}'):3001"
echo "💚 Migração Fale Direito concluída!"
