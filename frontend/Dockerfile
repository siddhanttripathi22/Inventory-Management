# ---------- Stage 1: build the static files ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first for layer caching.
COPY package*.json ./
RUN npm install

# Build the production bundle. VITE_API_URL is baked in at build time:
#  - left empty here, so the app calls "/api" and nginx proxies it (see below)
#  - for a separate deploy (e.g. Vercel -> Render) pass it as a build arg
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---------- Stage 2: serve with nginx ----------
# Only the built static files end up in this final image — no Node, no
# node_modules — so it stays small.
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
