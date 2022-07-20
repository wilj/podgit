import {debug, error,log} from "@app/config"
import PgPubsub from "@graphile/pg-pubsub";
import GraphilePro from "@graphile/pro"; // Requires license key
import PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector";
import { Express, Request, RequestHandler, Response } from "express";
import { NodePlugin } from "graphile-build";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { Pool, PoolClient } from "pg";
import {
  enhanceHttpServerWithSubscriptions,
  makePluginHook,
  Middleware,
  postgraphile,
  PostGraphileOptions,
} from "postgraphile";
import { makePgSmartTagsFromFilePlugin } from "postgraphile/plugins";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";

import { getHttpServer, getWebsocketMiddlewares } from "../app";
import config from "../config";
import OrdersPlugin from "../plugins/Orders";
import PassportLoginPlugin from "../plugins/PassportLoginPlugin";
import PrimaryKeyMutationsOnlyPlugin from "../plugins/PrimaryKeyMutationsOnlyPlugin";
import RemoveQueryQueryPlugin from "../plugins/RemoveQueryQueryPlugin";
import SubscriptionsPlugin from "../plugins/SubscriptionsPlugin";
import handleErrors from "../utils/handleErrors";
import { getAuthPgPool, getRootPgPool } from "./installDatabasePools";

const SubscriptionsLdsPlugin = require("@graphile/subscriptions-lds").default;

export type AuthenticationKeys = Partial<{
  sessionId: string
  token: string
  verifiedToken: boolean
  apiKey: string
  userId: string
}>

export interface OurGraphQLContext extends AuthenticationKeys {
  pgClient: PoolClient;
  rootPgPool: Pool;
  login(user: any): Promise<void>;
  logout(): Promise<void>;
}

const TagsFilePlugin = makePgSmartTagsFromFilePlugin(
  // We're using JSONC for VSCode compatibility; also using an explicit file
  // path keeps the tests happy.
  resolve(__dirname, "../../postgraphile.tags.jsonc")
);

type UUID = string;

const isTest = process.env.NODE_ENV === "test";

function uuidFromString(input: string | number | null | undefined): UUID | undefined {
  if (!input) return;

  const str = String(input);
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      str
    )
  ) {
    return str;
  }
  return;
}


function authTokensFromHeader(input: string | null | undefined) : AuthenticationKeys {
  const offset = "Bearer ".length
  const result : AuthenticationKeys = {}
  if (input && input.length > offset) {
    if (input.toLowerCase().startsWith("bearer ")) {
      result.token = input.substring(offset)
    } else if (input.toLowerCase().startsWith("apikey ")) {
      result.apiKey = input.substring(offset)
    }
  }
  return result;
}

function getAuthenticationKeys(req: any) : AuthenticationKeys {
  let result : AuthenticationKeys = {}

  result.sessionId = uuidFromString(req.user?.session_id);
  debug(`Found sessionId`, result.sessionId)

  const header = req?.headers?.authorization;
  const fromHeaders = authTokensFromHeader(header);
  debug(`Found auth keys in header`, fromHeaders)

  result = {...fromHeaders, ...result}

  if (!result.token) {
    result.token = req?.connectionParams?.token;
  }

  const verifiedJwt = result.token && jwt.verify(result.token, config.SECRET) ? result.token : "";
  if (verifiedJwt) {
    result.verifiedToken = true
    const auth = jwt.decode(verifiedJwt) as any;
    if (auth?.user_id) {
      result.userId = uuidFromString(auth.user_id);
    }
  }

  debug(`getAuthenticationKeys returning`, result)
  return result;
}

const isDev = process.env.NODE_ENV === "development";
//const isTest = process.env.NODE_ENV === "test";

const pluginHook = makePluginHook([
  // Add the pub/sub realtime provider
  PgPubsub,

  // If we have a Graphile Pro license, then enable the plugin
  ...(process.env.GRAPHILE_LICENSE ? [GraphilePro] : []),
]);

interface IPostGraphileOptionsOptions {
  websocketMiddlewares?: Middleware<Request, Response>[];
  rootPgPool: Pool;
}

export function getPostGraphileOptions({
  websocketMiddlewares,
  rootPgPool,
}: IPostGraphileOptionsOptions) {
  const options: PostGraphileOptions<Request, Response> = {
    // This is for PostGraphile server plugins: https://www.graphile.org/postgraphile/plugins/
    pluginHook,
    simpleCollections: "both",
    live: true,
    // This is so that PostGraphile installs the watch fixtures, it's also needed to enable live queries
    ownerConnectionString: process.env.DATABASE_URL,

    // On production we still want to start even if the database isn't available.
    // On development, we want to deal nicely with issues in the database.
    // For these reasons, we're going to keep retryOnInitFail enabled for both environments.
    retryOnInitFail: !isTest,

    // Add websocket support to the PostGraphile server; you still need to use a subscriptions plugin such as
    // @graphile/pg-pubsub
    subscriptions: true,
    websocketMiddlewares,

    // enableQueryBatching: On the client side, use something like apollo-link-batch-http to make use of this
    enableQueryBatching: true,

    // dynamicJson: instead of inputting/outputting JSON as strings, input/output raw JSON objects
    dynamicJson: true,

    // ignoreRBAC=false: honour the permissions in your DB - don't expose what you don't GRANT
    ignoreRBAC: false,

    // ignoreIndexes=false: honour your DB indexes - only expose things that are fast
    ignoreIndexes: false,

    // setofFunctionsContainNulls=false: reduces the number of nulls in your schema
    setofFunctionsContainNulls: false,

    // Enable GraphiQL in development
    graphiql: isDev || !!process.env.ENABLE_GRAPHIQL,
    // Use a fancier GraphiQL with `prettier` for formatting, and header editing.
    enhanceGraphiql: true,
    // Allow EXPLAIN in development (you can replace this with a callback function if you want more control)
    allowExplain: isDev,

    // Disable query logging - we're using morgan
    disableQueryLog: true,

    // Custom error handling
    handleErrors,
    /*
     * To use the built in PostGraphile error handling, you can use the
     * following code instead of `handleErrors` above. Using `handleErrors`
     * gives you much more control (and stability) over how errors are
     * output to the user.
     */
    /*
        // See https://www.graphile.org/postgraphile/debugging/
        extendedErrors:
          isDev || isTest
            ? [
                "errcode",
                "severity",
                "detail",
                "hint",
                "positon",
                "internalPosition",
                "internalQuery",
                "where",
                "schema",
                "table",
                "column",
                "dataType",
                "constraint",
              ]
            : ["errcode"],
        showErrorStack: isDev || isTest,
        */

    // Automatically update GraphQL schema when database changes
    watchPg: isDev,

    // Keep data/schema.graphql up to date
    sortExport: true,
    exportGqlSchemaPath: isDev
      ? `${__dirname}/../../../../data/schema.graphql`
      : undefined,

    /*
     * Plugins to enhance the GraphQL schema, see:
     *   https://www.graphile.org/postgraphile/extending/
     */
    appendPlugins: [
      ConnectionFilterPlugin,

      SubscriptionsLdsPlugin,
      // PostGraphile adds a `query: Query` field to `Query` for Relay 1
      // compatibility. We don't need that.
      RemoveQueryQueryPlugin,

      // Adds support for our `postgraphile.tags.json5` file
      TagsFilePlugin,

      // Simplifies the field names generated by PostGraphile.
      PgSimplifyInflectorPlugin,

      // Omits by default non-primary-key constraint mutations
      PrimaryKeyMutationsOnlyPlugin,

      // Adds the `login` mutation to enable users to log in
      PassportLoginPlugin,

      // Adds realtime features to our GraphQL schema
      SubscriptionsPlugin,

      // Adds custom orders to our GraphQL schema
      OrdersPlugin,
    ],

    /*
     * Plugins we don't want in our schema
     */
    skipPlugins: [
      // Disable the 'Node' interface
      NodePlugin,
    ],

    graphileBuildOptions: {
      /*
       * Any properties here are merged into the settings passed to each Graphile
       * Engine plugin - useful for configuring how the plugins operate.
       */

      // Makes all SQL function arguments except those with defaults non-nullable
      pgStrictFunctions: true,
    },

    /*
     * Postgres transaction settings for each GraphQL query/mutation to
     * indicate to Postgres who is attempting to access the resources. These
     * will be referenced by RLS policies/triggers/etc.
     *
     * Settings set here will be set using the equivalent of `SET LOCAL`, so
     * certain things are not allowed. You can override Postgres settings such
     * as 'role' and 'search_path' here; but for settings indicating the
     * current user, session id, or other privileges to be used by RLS policies
     * the setting names must contain at least one and at most two period
     * symbols (`.`), and the first segment must not clash with any Postgres or
     * extension settings. We find `jwt.claims.*` to be a safe namespace,
     * whether or not you're using JWTs.
     */
    async pgSettings(req) {
      const keys = getAuthenticationKeys(req)

      if (keys.sessionId) {
        // Update the last_active timestamp (but only do it at most once every 15 seconds to avoid too much churn).
        await rootPgPool.query(
          "UPDATE app_private.sessions SET last_active = NOW() WHERE uuid = $1 AND last_active < NOW() - INTERVAL '15 seconds'",
          [keys.sessionId]
        );
        const {rows: [{user_id: sessionUserId}]} = await rootPgPool.query(
          "select user_id from app_private.sessions WHERE uuid = $1",
          [keys.sessionId]
        )
        debug(`retrieved user by sessionId`, sessionUserId)
        if (sessionUserId) {
          keys.userId = sessionUserId
        }
      }

      if (keys.apiKey) {
        const {rows: [{user_id: apiUserId}]} = await rootPgPool.query(
          `select user_id
          from app_private.user_api_keys
          where api_key_hash =
                sha256(
                  convert_to($1, 'UTF8')::bytea
                )::text`,
          [keys.apiKey]
        )
        debug(`retrieved user by apiKey`, apiUserId)
        if (apiUserId) {
          keys.userId = apiUserId
        }
      }


      return {
        // Everyone uses the "visitor" role currently
        role: process.env.DATABASE_VISITOR,
        "jwt.claims.user_id": keys.userId,
      };
    },

    /*
     * These properties are merged into context (the third argument to GraphQL
     * resolvers). This is useful if you write your own plugins that need
     * access to, e.g., the logged in user.
     */
    async additionalGraphQLContextFromRequest(
      req
    ): Promise<Partial<OurGraphQLContext>> {
      return {
        // The current session id, token, user id, etc
        ...getAuthenticationKeys(req),

        // Needed so passport can write to the database
        rootPgPool,

        // Use this to tell Passport.js we're logged in
        login: (user: any) =>
          new Promise((resolve, reject) => {
            req.login(user, (err) => (err ? reject(err) : resolve()));
          }),

        logout: () => {
          req.logout();
          return Promise.resolve();
        },
      };
    },

    // Pro plugin options (requires process.env.GRAPHILE_LICENSE)
    defaultPaginationCap:
      parseInt(process.env.GRAPHQL_PAGINATION_CAP || "", 10) || 50,
    graphqlDepthLimit:
      parseInt(process.env.GRAPHQL_DEPTH_LIMIT || "", 10) || 12,
    graphqlCostLimit:
      parseInt(process.env.GRAPHQL_COST_LIMIT || "", 10) || 30000,
    exposeGraphQLCost:
      (parseInt(process.env.HIDE_QUERY_COST || "", 10) || 0) < 1,
    // readReplicaPgPool ...,
  };
  return options;
}

export default function installPostGraphile(app: Express) {
  const websocketMiddlewares = getWebsocketMiddlewares(app);
  const authPgPool = getAuthPgPool(app);
  const rootPgPool = getRootPgPool(app);
  const middleware = postgraphile<Request, Response>(
    authPgPool,
    "app_public",
    getPostGraphileOptions({
      websocketMiddlewares,
      rootPgPool,
    })
  );

  app.set("postgraphileMiddleware", middleware);

  app.use(middleware);

  const httpServer = getHttpServer(app);
  if (httpServer) {
    enhanceHttpServerWithSubscriptions(httpServer, middleware);
  }
}
