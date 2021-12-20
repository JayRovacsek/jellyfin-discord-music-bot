FROM node:14-alpine
RUN apk add ffmpeg --no-cache

COPY . /app
WORKDIR /app
RUN npm install
RUN npm build
RUN npm prune --production

CMD npm run start