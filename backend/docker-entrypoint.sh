#!/bin/sh
set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando backend...${NC}"

wait_for_service() {
  service=$1
  host=$2
  port=$3
  max_attempts=60
  attempt=1

  echo -e "${YELLOW}⏳ Aguardando $service em $host:$port...${NC}"

  while [ $attempt -le $max_attempts ]; do
    if nc -z "$host" "$port" 2>/dev/null; then
      echo -e "${GREEN}✅ $service está pronto!${NC}"
      return 0
    fi
    echo -e "${YELLOW}   Tentativa $attempt/$max_attempts...${NC}"
    sleep 1
    attempt=$((attempt + 1))
  done

  echo -e "${RED}❌ Timeout aguardando $service${NC}"
  return 1
}

# Aguarda PostgreSQL
if ! wait_for_service "PostgreSQL" "postgres" 5432; then
  echo -e "${RED}❌ Falha ao conectar com PostgreSQL${NC}"
  exit 1
fi

# Aguarda Redis
if ! wait_for_service "Redis" "redis" 6379; then
  echo -e "${RED}❌ Falha ao conectar com Redis${NC}"
  exit 1
fi

echo -e "${YELLOW}🔄 Executando migrações do banco de dados...${NC}"
if npx sequelize db:migrate --migrations-path dist/database/migrations; then
  echo -e "${GREEN}✅ Migrações executadas com sucesso${NC}"
else
  echo -e "${YELLOW}⚠️  Erro ao executar migrações (pode ser normal se já existirem)${NC}"
fi

echo -e "${YELLOW}🌱 Executando seeds do banco de dados...${NC}"
if npx sequelize db:seed:all --seeders-path dist/database/seeds; then
  echo -e "${GREEN}✅ Seeds executados com sucesso${NC}"
else
  echo -e "${YELLOW}⚠️  Erro ao executar seeds (pode ser normal)${NC}"
fi

echo -e "${YELLOW}🚀 Iniciando aplicação (npm start)...${NC}"
exec npm start
