FROM node:20-alpine

WORKDIR /app

# Enable corepack for pnpm/yarn if needed, though we seem to use npm based on package-lock
# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found ." && exit 1; \
  fi

COPY . .

# Build args
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_AI_URL

# Set env vars for build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_AI_URL=$NEXT_PUBLIC_API_AI_URL

# Build the Next.js application
RUN npm run build

EXPOSE 4000

ENV PORT 4000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "run", "start"]
