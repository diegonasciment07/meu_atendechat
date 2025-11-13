# -----------------------------------------------------------------
# DOCKERFILE ESTÁVEL PARA O FRONTEND - FALE DIREITO
# Compatível com dependências antigas e novas
# Node 18 (seguro) + Yarn com tolerância de engines
# -----------------------------------------------------------------
FROM node:18-alpine

WORKDIR /app

# -----------------------------------------------------------------
# 1️⃣ Instala o "serve" (para servir o build final)
# -----------------------------------------------------------------
RUN npm install -g serve

# -----------------------------------------------------------------
# 2️⃣ Copia o package.json (sem usar package-lock, pois o projeto é Yarn)
# -----------------------------------------------------------------
COPY frontend/package.json ./

# -----------------------------------------------------------------
# 3️⃣ Define variáveis para evitar erros de build e engines incompatíveis
# -----------------------------------------------------------------
ENV YARN_IGNORE_ENGINES=true
ENV SKIP_PREFLIGHT_CHECK=true
ENV NODE_OPTIONS=--openssl-legacy-provider

# -----------------------------------------------------------------
# 4️⃣ Instala dependências de forma tolerante e confiável
# -----------------------------------------------------------------
RUN yarn install --ignore-engines --network-timeout 600000

# -----------------------------------------------------------------
# 5️⃣ Copia o resto do código do frontend
# -----------------------------------------------------------------
COPY frontend/ ./
COPY brands ./brands

# -----------------------------------------------------------------
# 6️⃣ Executa scripts de personalização (cores, marca, etc)
# -----------------------------------------------------------------
RUN rm -f .env

COPY frontend/update_tab_name.sh ./update_tab_name.sh
RUN chmod +x update_tab_name.sh && ./update_tab_name.sh

COPY frontend/update_app_color.sh ./update_app_color.sh
RUN chmod +x update_app_color.sh && ./update_app_color.sh

COPY frontend/copy_brand_assets.sh ./copy_brand_assets.sh
RUN chmod +x copy_brand_assets.sh && ./copy_brand_assets.sh

RUN rm -rf ./brands

# -----------------------------------------------------------------
# 7️⃣ Configura variáveis de ambiente para build React
# -----------------------------------------------------------------
ENV BABEL_ENV=production
ENV CI=false
ENV HOST=0.0.0.0
ENV GENERATE_SOURCEMAP=false

# -----------------------------------------------------------------
# 8️⃣ Gera o build otimizado (com suporte legacy SSL e Babel)
# -----------------------------------------------------------------
RUN yarn run build || npm run build

# -----------------------------------------------------------------
# 9️⃣ Expõe a porta e define o comando final
# -----------------------------------------------------------------
EXPOSE 3001
CMD ["serve", "-s", "build", "-l", "3001"]
