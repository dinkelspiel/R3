FROM node:iron
RUN npm install -g pnpm tsx
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml* ./
RUN echo Y | pnpm install
COPY . .
SHELL ["/bin/bash", "--login", "-c"]
ENV SHELL bash
EXPOSE 3001
CMD ["tsx", "src/server/ws/server.ts"]
