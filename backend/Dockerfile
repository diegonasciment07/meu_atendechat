FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache git openssh-client netcat-openbsd tzdata
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN rm -f package-lock.json
COPY backend/package*.json ./
RUN yarn
COPY backend/ .
RUN git config --global url."https://".insteadOf ssh://
RUN yarn add fluent-ffmpeg @ffmpeg-installer/ffmpeg
COPY certificates ./certs-temp
COPY backend/copy_cert_assets.sh ./
RUN chmod +x copy_cert_assets.sh
ARG STACK_NAME
ENV STACK_NAME=$STACK_NAME
RUN ./copy_cert_assets.sh
RUN rm -rf ./certs-temp
RUN ./node_modules/.bin/tsc --skipLibCheck || true
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]
