FROM node:iron
RUN npm install -g pnpm@9.1.0
WORKDIR /usr/src/app
RUN ls
SHELL ["/bin/bash", "--login", "-c"]
ENV SHELL bash
COPY . .
RUN chmod 777 /usr/src/app -R
RUN pnpm install

# Skip the db push if it is the github actions running
ARG BUILD_ENV=default
ENV BUILD_ENV=${BUILD_ENV}
RUN if [ "$BUILD_ENV" != "github" ]; then pnpm db:push; fi

RUN apt-get update && apt-get install -y git && apt-get clean
RUN export GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
RUN export GIT_COMMIT=$(git rev-parse --short HEAD)
RUN rm -rf .git
RUN pnpm build
CMD ["pnpm", "start"]
