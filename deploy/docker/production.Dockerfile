# syntax=docker/dockerfile:1.3-labs
# Global args, set before the first FROM, shared by all stages
ARG PORT=5678
ARG NODE_ENV="production"
ARG ROOT_URL="http://localhost:${PORT}"
ARG REACT_APP_ROOT_URL="http://localhost:${PORT}"
ARG TARGET="server"

################################################################################
# Build stage 1 - `yarn build`

FROM node:16-alpine as builder
# Import our shared args
ARG NODE_ENV
ARG ROOT_URL

RUN npm install -g cross-env typescript

# Cache node_modules for as long as possible
COPY ./site/lerna.json ./site/package.json ./site/yarn.lock /app/
COPY ./site/@app/ /app/@app/
WORKDIR /app/
RUN yarn install --frozen-lockfile --production=false --no-progress

COPY ./site/ /app/

# Finally run the build script
RUN yarn run build

################################################################################
# Build stage 2 - COPY the relevant things (multiple steps)

FROM node:16-alpine as clean
# Import our shared args
ARG NODE_ENV
ARG ROOT_URL

# Copy over selectively just the tings we need, try and avoid the rest
COPY --from=builder /app/lerna.json /app/package.json /app/yarn.lock /app/

COPY --from=builder /app/@app/config/ /app/@app/config/
COPY --from=builder /app/@app/db/ /app/@app/db/

COPY --from=builder /app/@app/types/package.json /app/@app/types/
COPY --from=builder /app/@app/types/dist/ /app/@app/types/dist/

COPY --from=builder /app/@app/server/package.json /app/@app/server/
COPY --from=builder /app/@app/server/postgraphile.tags.jsonc /app/@app/server/
COPY --from=builder /app/@app/server/dist/ /app/@app/server/dist/

COPY --from=builder /app/@app/worker/package.json /app/@app/worker/
COPY --from=builder /app/@app/worker/templates/ /app/@app/worker/templates/
COPY --from=builder /app/@app/worker/dist/ /app/@app/worker/dist/
COPY --from=builder /app/@app/worker/crontab /app/@app/worker/
# Shared args shouldn't be overridable at runtime (because they're baked into
# the built JS).
#
# Further, they aren't available in ENTRYPOINT (because it's at runtime), so
# push them to a .env file that we can source from ENTRYPOINT.
RUN echo -e "NODE_ENV=$NODE_ENV\nROOT_URL=$ROOT_URL" > /app/.env

RUN rm -Rf /app/node_modules /app/@app/*/node_modules


# build the app
# syntax=docker/dockerfile:1.3-labs
FROM node:16-buster as appbuilder

ARG NODE_ENV
ARG ROOT_URL
ARG REACT_APP_ROOT_URL

COPY ./app /app

WORKDIR /app/

RUN /app/maybe-build.sh



################################################################################
# Build stage FINAL - COPY everything, once, and then do a clean `yarn install`

FROM node:16-alpine as server

EXPOSE $PORT
WORKDIR /app/
# Copy everything from previous stages
COPY --from=clean /app/ /app/
COPY --from=appbuilder /app/build/ /app/@app/server/public/

# Install yarn ASAP because it's the slowest
RUN yarn install --frozen-lockfile --production=true --no-progress

# Import our shared args
ARG PORT
ARG NODE_ENV
ARG ROOT_URL
ARG REACT_APP_ROOT_URL
ARG TARGET

LABEL description="My PostGraphile-powered $TARGET"

# You might want to disable GRAPHILE_TURBO if you have issues
ENV GRAPHILE_TURBO=1 TARGET=$TARGET PORT=$PORT
ENV DATABASE_HOST="pg"
ENV DATABASE_NAME="graphile_starter"
ENV DATABASE_OWNER="${DATABASE_NAME}"
ENV DATABASE_VISITOR="${DATABASE_NAME}_visitor"
ENV DATABASE_AUTHENTICATOR="${DATABASE_NAME}_authenticator"

# Entrypoint last so that we can run `sh` in previous build steps for debugging
ENTRYPOINT yarn "${TARGET}" start
