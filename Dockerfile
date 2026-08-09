FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN mkdir -p /app/contact-page && touch /app/contact-page/contact_store.json

EXPOSE 3000

CMD ["node", "server.js"]
