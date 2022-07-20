import { getParent, types } from "mobx-state-tree";
import { pipe, subscribe } from "wonka";
import {
  Workspace,
  WorkspacesQueryDocument,
  WorkspacesQueryQuery,
  WorkspacesQueryQueryVariables,
  WorkspacesSubscriptionDocument,
  WorkspacesSubscriptionSubscription,
  WorkspacesSubscriptionSubscriptionVariables,
} from "../generated/graphql";
import { extractErrorMessage, primitiveObject } from "./modelutil";
import { RootStoreType } from "./Root";

type PartialWorkspace = Partial<Workspace> | null | undefined;

export const PartialWorkspacePrimitive =
  primitiveObject<PartialWorkspace>("Workspace");

export const Workspaces = types
  .model({
    workspaceList: types.optional(types.array(PartialWorkspacePrimitive), []),
    errorMessage: "",
  })
  .volatile((self) => {
    let unsubscribe = () => {};
    let setUnsubscribe = (unsub: () => void) => (unsubscribe = unsub);
    return { unsubscribe, setUnsubscribe };
  })
  .actions((self) => ({
    setErrorMessage: (errorMessage: string) =>
      (self.errorMessage = errorMessage),
    clearErrors: () => (self.errorMessage = ""),
    setWorkspaces: (workspaces: PartialWorkspace[]) =>
      self.workspaceList.replace(workspaces),
  }))
  .actions((self) => ({
    loadWorkspaces: () => {
      const rootStore = getParent<RootStoreType>(self);

      self.unsubscribe && self.unsubscribe();
      rootStore.network.graphqlClient
        .query<WorkspacesQueryQuery, WorkspacesQueryQueryVariables>(
          WorkspacesQueryDocument,
          {}
        )
        .toPromise()
        .then(({ data, error }) => {
          const workspaces = data?.workspacesList;
          self.setWorkspaces(workspaces || []);
          self.setErrorMessage(extractErrorMessage(error));

          const { unsubscribe } = pipe(
            rootStore.network.graphqlClient.subscription<
              WorkspacesSubscriptionSubscription,
              WorkspacesSubscriptionSubscriptionVariables
            >(WorkspacesSubscriptionDocument),
            subscribe((result) => {
              self.setWorkspaces(result.data?.workspacesList || []);
              self.setErrorMessage(extractErrorMessage(result.error));
            })
          );

          self.setUnsubscribe(unsubscribe);
        });
    },
  }));
