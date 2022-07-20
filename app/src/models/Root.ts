import { applySnapshot, Instance, onSnapshot, types } from "mobx-state-tree";
import { createContext, useContext } from "react";
import { debug, log } from "../components/log";
import { Config } from "../Config";
import { ConnectionStatus, Network } from "./Network";
import { Workspaces } from "./Workspaces";

const RootModel = types
  .model({
    network: Network,
    workspaces: Workspaces,
  })
  


export const getInitialState = () => ({
  network: { connectionStatus: ConnectionStatus.Online },
  workspaces: {}
});

export const rootStore = RootModel.create(getInitialState());
export type RootStoreType = typeof rootStore

function isReachable(url: string) {
  /**
   * Note: fetch() still "succeeds" for 404s on subdirectories,
   * which is ok when only testing for domain reachability.
   *
   * Example:
   *   https://google.com/noexist does not throw
   *   https://noexist.com/noexist does throw
   */
  return fetch(url, { method: "HEAD", mode: "no-cors" })
    .then(function (resp) {
      return resp && (resp.ok || resp.type === "opaque");
    })
    .catch(function (err) {
      console.warn("[conn test failure]:", err);
      return false;
    });
}

async function checkConnectionStatus() {
  debug(`Checking network connection status`);
  let connectionStatus: ConnectionStatus;
  if (navigator.onLine) {
    const online = await isReachable(Config.rootUrl());
    if (online) {
      connectionStatus = ConnectionStatus.Online;
    } else {
      connectionStatus = ConnectionStatus.Unreachable;
    }
  } else {
    connectionStatus = ConnectionStatus.Offline;
  }
  debug(`Network status:`, connectionStatus);
  rootStore.network.setConnectionStatus(connectionStatus);

  if (connectionStatus == ConnectionStatus.Online) {
    rootStore.network.refreshCurrentUser();
  }
}
window.addEventListener("online", checkConnectionStatus);
window.addEventListener("offline", checkConnectionStatus);

async function periodicallyCheckConnectionStatus() {
  if (rootStore.network.connectionStatus !== ConnectionStatus.Offline) {
    await checkConnectionStatus()
  }
}
setInterval(periodicallyCheckConnectionStatus, 60000);
checkConnectionStatus();

export type RootInstance = Instance<typeof RootModel>;
const RootStoreContext = createContext<null | RootInstance>(null);

export const Provider = RootStoreContext.Provider;
export function useMst() {
  const store = useContext(RootStoreContext);
  if (store === null) {
    throw new Error("Store cannot be null, please add a context provider");
  }
  return store;
}
