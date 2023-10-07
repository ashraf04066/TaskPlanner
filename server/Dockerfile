FROM node:18
WORKDIR /TaskPlanner/server
COPY . .
RUN npm install -g npm@9.6.2
RUN npm i
EXPOSE 4000
# RUN node ./server/server.js
CMD ["node", "server.js"]