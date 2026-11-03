# Build com Node e FFmpeg; mídia e SQLite vivem no volume, nunca na imagem.
FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates openssl gosu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN npm ci --include=dev && npm run build

RUN mkdir -p /data && chown -R node:node /app /data

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["/bin/sh", "/app/scripts/entrada-docker.sh"]
CMD ["npm", "run", "iniciar:completo"]
