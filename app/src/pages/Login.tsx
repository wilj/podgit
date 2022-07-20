import {
  IonButton,
  IonCol,
  IonGrid,
  IonInput,
  IonLabel,
  IonRow,
  IonText,
} from "@ionic/react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";
import BasePage from "../components/BasePage";
import { logError } from "../components/log";
import { useMst } from "../models/Root";
import "./Login.css";

const LoginPage: React.FC = observer(() => {
  const { network } = useMst();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (network.user?.id) {
    return <Redirect to="/" />;
  }
  return (
    <BasePage title="Login">
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonLabel>Username</IonLabel>
            <IonInput
              name="username"
              value={username}
              placeholder="Username"
              onIonChange={(e) => setUsername(e.detail.value!)}
            ></IonInput>

            <IonLabel>Password</IonLabel>
            <IonInput
              name="password"
              value={password}
              type="password"
              placeholder="Password"
              onIonChange={(e) => setPassword(e.detail.value!)}
            ></IonInput>
            {network.errorMessage && (
              <IonText color="danger">{network.errorMessage}</IonText>
            )}
            <IonButton
              onClick={() => {
                network.logIn({
                  username,
                  password,
                });
              }}
            >
              Login
            </IonButton>
{/* 
            <IonButton
              onClick={() => {
                try {
                  const x : any = null
                  console.log(`force an error with ${x.length}`);
                } catch (e) {
                  logError(`forced an error`, e)
                }
              }}
            >
              Force error
            </IonButton> */}

          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <Link to="/register">Or register a new account</Link>
          </IonCol>
        </IonRow>
      </IonGrid>
    </BasePage>
  );
});

export default LoginPage;
