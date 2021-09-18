FROM node:14-alpine
RUN apk add ffmpeg

COPY . /app
WORKDIR /app
RUN npm install
RUN npm build
RUN npm prune --production

CMD npm run start