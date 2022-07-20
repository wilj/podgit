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
import { useMst } from "../models/Root";
import "./Register.css";

const RegisterPage: React.FC = observer(() => {
  const { network } = useMst();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");

  if (network.user?.id) {
    return <Redirect to="/" />;
  }
  return (
    <BasePage title="Register">
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonLabel>Name</IonLabel>
            <IonInput
              name="name"
              value={name}
              placeholder="Name"
              onIonChange={(e) => setName(e.detail.value!)}
            ></IonInput>

            <IonLabel>Username</IonLabel>
            <IonInput
              name="username"
              value={username}
              placeholder="Username"
              onIonChange={(e) => setUsername(e.detail.value!)}
            ></IonInput>

            <IonLabel>E-mail</IonLabel>
            <IonInput
              name="email"
              value={email}
              placeholder="E-mail"
              onIonChange={(e) => setEmail(e.detail.value!)}
            ></IonInput>

            <IonLabel>Password</IonLabel>
            <IonInput
              name="password"
              value={password}
              type="password"
              placeholder="Password"
              onIonChange={(e) => setPassword(e.detail.value!)}
            ></IonInput>

            <IonLabel>Confirm Password</IonLabel>
            <IonInput
              name="confirm_password"
              value={confirmPassword}
              type="password"
              placeholder="Confirm Password"
              onIonChange={(e) => setConfirmPassword(e.detail.value!)}
            ></IonInput>
            {network.errorMessage && (
              <IonText color="danger">{network.errorMessage}</IonText>
            )}
            {validationError && (
              <IonText color="danger">{validationError}</IonText>
            )}
            <IonButton
              onClick={() => {
                if (password && confirmPassword) {
                  if (password === confirmPassword) {
                    network.register({
                      input: {
                        name,
                        username,
                        password,
                        email,
                      },
                    });
                  } else {
                    setValidationError("Passwords must match.");
                  }
                } else {
                  setValidationError("Please enter and confirm a password.");
                }
              }}
            >
              Register
            </IonButton>
            </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <Link to="/login">Or log in with an existing account</Link>
          </IonCol>
        </IonRow>
      </IonGrid>

    </BasePage>
  );
});

export default RegisterPage;
