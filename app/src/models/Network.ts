import { createClient } from "@urql/core";
import { deepEqual } from "fast-equals";
import { Client, createClient as createWSClient } from "graphql-ws";
import { getParent, types } from "mobx-state-tree";
import {
  debugExchange,
  dedupExchange,
  fetchExchange,
  subscriptionExchange,
} from "urql";
import { debug, log, logError } from "../components/log";
import { Config } from "../Config";
import {
  CurrentUserDocument,
  CurrentUserQuery,
  CurrentUserQueryVariables,
  LoginDocument,
  LoginMutation,
  LoginMutationVariables,
  LoginPayload,
  LogoutDocument,
  LogoutMutation,
  LogoutMutationVariables,
  RegisterAccountDocument,
  RegisterAccountMutation,
  RegisterAccountMutationVariables,
  User,
} from "../generated/graphql";
import { extractErrorMessage, primitiveObject } from "./modelutil";
import { RootStoreType } from "./Root";

type PartialUser = Partial<User> | null | undefined;

export const PartialUserPrimitive = primitiveObject<PartialUser>("CurrentUser");

export enum ConnectionStatus {
  Offline = "Offline",
  Unreachable = "Unreachable",
  Online = "Online",
}

export const Network = types
  .model({
    user: PartialUserPrimitive,
    errorMessage: "",
    connectionStatus: types.enumeration<ConnectionStatus>(
      "ConnectionStatus",
      Object.values(ConnectionStatus)
    ),
  })
  .actions((self) => {
    return {
      setConnectionStatus: (connectionStatus: ConnectionStatus) => {
        self.connectionStatus = connectionStatus;
      },
    };
  })
  .volatile((self) => {
    const clientUrl = `${Config.rootUrl()}/graphql`;
    debug(`**** clientUrl = "${clientUrl}"`);
    let websocketUrl = clientUrl.replace(/(http)(s)?\:\/\//, "ws$2://");
    if (!websocketUrl.startsWith(`wss://`)) {
      websocketUrl = `wss://${websocketUrl}`;
    }
    debug(`**** websocketUrl = "${websocketUrl}"`);

    const createWebsocketClient = () =>
      createWSClient({
        url: websocketUrl,
      });

    let wsClient: Client | null = createWebsocketClient();

    const noop = () => {};

    const createGraphqlClient = () =>
      createClient({
        url: clientUrl,
        exchanges: [
          debugExchange,
          dedupExchange,
          fetchExchange,
          subscriptionExchange({
            forwardSubscription: (operation) => ({
              subscribe: (sink) => {
                debug(`Graphql client subscription operation`, operation);
                let unsub : (() => void) | undefined
                try {
                  unsub = wsClient?.subscribe(operation, sink as any)
                } catch (e) {
                  logError(`Error forwarding subscription`, e);
                }
                return {
                  unsubscribe: unsub || noop,
                };
              },
            }),
          }),
        ],
      });

    let graphqlClient = createGraphqlClient();

    
    return {
      graphqlClient,
      createGraphqlClient,
      wsClient,
      createWebsocketClient
    };
  })
  .actions((self) => ({
    resetConnections: () => {
      if (self.wsClient) {
        self.wsClient.dispose();
      }
      self.wsClient = self.createWebsocketClient();
      self.graphqlClient = self.createGraphqlClient();
    },
  }))
  .actions((self) => ({
    setErrorMessage: (errorMessage: string) =>
      (self.errorMessage = errorMessage),
    clearErrors: () => (self.errorMessage = ""),
    setUser: (user: PartialUser) => {
      self.user = user;
      self.resetConnections();
    },
  }))
  .actions((self) => ({
    logIn: (variables: LoginMutationVariables) => {
      debug(`logIn called`);
      self.clearErrors();
      return self.graphqlClient
        .mutation<LoginMutation, LoginMutationVariables>(
          LoginDocument,
          variables
        )
        .toPromise()
        .then(({ data, error }) => {
          debug(`logIn returned`, { data, error });

          self.setUser(data?.login?.user);
          self.setErrorMessage(extractErrorMessage(error));
          if (error) {
            logError( `Error encountered logging out`, error)
          }
        });
    },
    register: (variables: RegisterAccountMutationVariables) => {
      self.clearErrors();
      self.graphqlClient
        .mutation<RegisterAccountMutation, RegisterAccountMutationVariables>(
          RegisterAccountDocument,
          variables
        )
        .toPromise()
        .then(({ data, error }) => {
          self.setUser(data?.register?.user);
          self.setErrorMessage(extractErrorMessage(error));
        });
    },
    logOut: () => {
      self.graphqlClient
        .mutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, {})
        .toPromise()
        .then(({ data, error }) => {
          if (error) {
            log(`Error logging out`, error);
          }
          if (data?.logout?.success) {
            window.location.reload()
          }
        });
    },
    refreshCurrentUser: () => {
      debug(`refreshCurrentUser called`);
      return self.graphqlClient
        .query<CurrentUserQuery, CurrentUserQueryVariables>(
          CurrentUserDocument,
          {},
          {requestPolicy: `network-only`}
        )
        .toPromise()
        .then(({ data, error }) => {
          debug(`CurrentUserQuery returned`, { data, error });

          const user = data?.currentUser;
          if (deepEqual(user, self.user)) {
            debug(`User is unchanged`);
          } else {
            debug(`calling setUser`, user);
            self.setUser(user);
          }

          self.setErrorMessage(extractErrorMessage(error));
        });
    },
  }));
