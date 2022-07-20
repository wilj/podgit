import {
  IonAlert,
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonRow,
  IonText,
  IonToast,
} from "@ionic/react";
import { copyOutline, trashOutline } from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import useClipboard from "../hooks/useClipboard";

import BasePage from "../components/BasePage";
import {
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  useUserApiKeysQuery,
} from "../generated/graphql";
import "./ApiKeys.css";

const ApiKeysPage: React.FC = () => {
  const [keys, _refreshKeys] = useUserApiKeysQuery();
  const refreshKeys = useCallback(() => _refreshKeys({requestPolicy: "network-only"}), [_refreshKeys])
  
  const [, createNewApiKey] = useCreateApiKeyMutation();
  const [, deleteApiKey] = useDeleteApiKeyMutation();
  const [showModal, setShowModal] = useState(false);
  const [deletingKeyName, setDeletingKeyName] = useState("");

  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const inputEl = useRef<any>(null);

  const [isCopied, setCopied] = useClipboard(newApiKey, {successDuration: 1000});
  const [showCopiedToast, setShowCopiedToast] = useState(false);


  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        inputEl.current.querySelector(`.native-input`)?.focus();
      }, 100);
    }
  }, [showModal, inputEl]);

  useEffect(() => {
    if (isCopied) {
      setShowCopiedToast(true)
    }
  }, [isCopied, setShowCopiedToast]);

  return (
    <BasePage title="API Keys">
      <IonToast
        isOpen={showCopiedToast}
        onDidDismiss={() => setShowCopiedToast(false)}
        message="Copied to clipboard"
        duration={500}
      />
      <IonAlert
        isOpen={deletingKeyName !== ""}
        onDidDismiss={() => setDeletingKeyName("")}
        header="Delete API key?"
        message={`Delete API key "${deletingKeyName}"`}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary",
            id: "cancel-button",
            handler: (blah) => {
              setDeletingKeyName("");
            },
          },
          {
            text: "Delete",
            id: "confirm-button",
            handler: () => {
              deleteApiKey({
                input: { apiKeyName: deletingKeyName || `` },
              }).then(refreshKeys);
            },
          },
        ]}
      />

      <IonModal
        isOpen={showModal}
        onDidDismiss={() => setShowModal(false)}
        keyboardClose={false}
      >
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonList inset lines="inset">
                <IonListHeader>
                  <IonText color="secondary">
                    <h3>Create New API Key</h3>
                  </IonText>
                </IonListHeader>

                {newApiKey ? (
                  <>
                  
                    <IonItemGroup onClick={setCopied} color={isCopied ? "secondary" : ""}>
                      <IonItem >Created API key {newApiKeyName}</IonItem>
                      <IonItem color={ isCopied ? "success" : "primary" }>
                        {newApiKey}
                      </IonItem>
                      <IonItem>
                        {isCopied ? `Copied to clipboard` : `Click to copy`}
                        <IonIcon slot="end" icon={copyOutline} />
                      </IonItem>
                    </IonItemGroup>
                    <IonItemDivider />
                    <IonItem color="warning">
                      Warning: This key cannot be recovered after the dialog is
                      closed.
                    </IonItem>
                    <IonItemDivider />
                    <IonItem
                      button
                      color="primary"
                      onClick={() => {
                        setNewApiKey("");
                        setShowModal(false);
                      }}
                    >
                      Close Dialog
                    </IonItem>
                  </>
                ) : (
                  <>
                    <IonItem>
                      <IonLabel position="stacked">New API key name</IonLabel>
                      <IonInput
                        name="apiKeyName"
                        value={newApiKeyName}
                        placeholder="New API key name"
                        onIonChange={(e) => setNewApiKeyName(e.detail.value!)}
                        autofocus={true}
                        ref={(ref) => (inputEl.current = ref)}
                      ></IonInput>
                    </IonItem>
                    <IonItemDivider />
                    <IonItem
                      button
                      color="primary"
                      onClick={() =>
                        createNewApiKey({
                          input: { apiKeyName: newApiKeyName },
                        }).then((result) => {
                          setNewApiKey(
                            result?.data?.createApiKey?.createApiKeyResult
                              ?.apiKey || ``
                          );
                          refreshKeys();
                        })
                      }
                      disabled={newApiKeyName.length == 0}
                    >
                      <IonLabel>Create</IonLabel>
                    </IonItem>

                    <IonItem button onClick={() => setShowModal(false)}>
                      <IonLabel>Cancel</IonLabel>
                    </IonItem>
                  </>
                )}
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonModal>
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonList>
              {keys.data?.apiKeysList?.map(({ name }) => (
                <IonItem key={name}>
                  {name}
                  <IonButton
                    slot="end"
                    onClick={() => setDeletingKeyName(`${name}`)}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
              <IonItem
                key="showCreate"
                button
                color="primary"
                onClick={() => {
                  setNewApiKey("");
                  setNewApiKeyName("");
                  setShowModal(true);
                }}
              >
                Create new API key
              </IonItem>
            </IonList>
          </IonCol>
        </IonRow>
      </IonGrid>
    </BasePage>
  );
};

export default ApiKeysPage;
