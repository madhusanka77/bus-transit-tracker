FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js historyStore.js ./
RUN mkdir /data && chown node:node /data
ENV NODE_ENV=production
ENV PORT=5000
ENV HISTORY_FILE=/data/location_history.json
USER node
EXPOSE 5000
CMD ["node", "server.js"]
