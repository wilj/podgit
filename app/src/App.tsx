import {
  IonApp,
  IonIcon,
  IonLabel,
  IonLoading,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route, Switch } from "react-router-dom";
import {
  bonfire,
  bonfireOutline,
  documentTextOutline,
  ellipse,
  heartDislike,
  heartDislikeOutline,
  homeOutline,
  keyOutline,
  logOut,
  mapOutline,
  peopleOutline,
  square,
  triangle,
} from "ionicons/icons";
import { observer } from "mobx-react-lite";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import GraphqlClient from "./GraphqlClient";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import WorkspacesPage from "./pages/Workspaces";
import ApiKeysPage from "./pages/ApiKeys";
import NotesPage from "./pages/Notes";
import { useMst } from "./models/Root";
import { useEffect } from "react";
import { ConnectionStatus } from "./models/Network";


setupIonicReact({
  mode: 'md'
});

const InitialLanding: React.FC = () => (
  <IonReactRouter>
    <IonRouterOutlet id="main">
      <Switch>
        <Route exact path="/login">
          <LoginPage />
        </Route>
        <Route exact path="/register">
          <RegisterPage />
        </Route>
        <Route path="/">
          <Redirect to="/login" />
        </Route>
      </Switch>
    </IonRouterOutlet>
  </IonReactRouter>
);

const LoggedInLanding: React.FC = observer(() => {
  const { network } = useMst()
  return (
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet id="main">
          <Switch>
            <Route
              exact
              path="/logout"
              render={() => {
                network.logOut()
                return null;
              }}
            ></Route>

            <Route exact path="/workspaces">
              <WorkspacesPage />
            </Route>
            <Route path="/notes">
              <NotesPage />
            </Route>
            <Route exact path="/apikeys">
              <ApiKeysPage />
            </Route>
            <Route path="/">
              <Redirect to="/workspaces" />
            </Route>
          </Switch>
        </IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/workspaces">
            <IonIcon icon={homeOutline} />
            <IonLabel>Workspaces</IonLabel>
          </IonTabButton>
          <IonTabButton tab="notes" href="/notes">
            <IonIcon icon={documentTextOutline} />
            <IonLabel>Notes</IonLabel>
          </IonTabButton>
          <IonTabButton tab="apikeys" href="/apikeys">
            <IonIcon icon={keyOutline} />
            <IonLabel>ApiKeys</IonLabel>
          </IonTabButton>
          <IonTabButton tab="logout" href="/logout" disabled={network.connectionStatus !== ConnectionStatus.Online}>
            <IonIcon icon={logOut} />
            <IonLabel>Log Out</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  );
});

const App: React.FC = observer(() => {
  const { network } = useMst();

  return (
    <GraphqlClient>
      <IonApp>
        {network.user?.id ? <LoggedInLanding /> : <InitialLanding />}
      </IonApp>
    </GraphqlClient>
  );
});

export default App;
