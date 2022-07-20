import {
  IonAlert,
  IonButton,
  IonCol,
  IonFab,
  IonFabButton,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonLabel,
  IonList,
  IonListHeader,
  IonModal,
  IonRow,
  IonText,
  IonToast,
} from "@ionic/react";
import { chevronBackCircleOutline, copyOutline, trashOutline } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import { Redirect, Route, Switch, useParams } from "react-router-dom";
import BasePage from "../components/BasePage";
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useGetNoteQuery,
  useNotesSubscription,
} from "../generated/graphql";
import "./Notes.css";
import useClipboard from "../hooks/useClipboard";

const NotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [noteContent] = useGetNoteQuery({ variables: { id } });
  const [, deleteNote] = useDeleteNoteMutation();
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  
  const noteText = noteContent?.data?.note?.textContent || ``;

  const [isCopied, setCopied] = useClipboard(noteText, {successDuration: 1000});
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  useEffect(() => {
    if (isCopied) {
      setShowCopiedToast(true)
    }
  }, [isCopied, setShowCopiedToast]);

  if (deleted) {
    return <Redirect to="/notes" />
  }

  return (
    <BasePage title="Note Content">
      <IonToast
        isOpen={showCopiedToast}
        onDidDismiss={() => setShowCopiedToast(false)}
        message="Copied to clipboard"
        duration={500}
      />

      <pre className="note-text-content">{noteText}</pre>

      <IonFab vertical="bottom" horizontal="start" slot="fixed">
        <IonFabButton color="primary" href="/notes" title="Close">
          <IonIcon icon={chevronBackCircleOutline}></IonIcon>
        </IonFabButton>
      </IonFab>


      <IonFab vertical="bottom" horizontal="center" slot="fixed">
        <IonFabButton color={isCopied ? "success" : "primary"} onClick={setCopied} title="Copy">
          <IonIcon icon={copyOutline}></IonIcon>
        </IonFabButton>
      </IonFab>

      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton color="primary" onClick={() => setDeleting(true)} title="Delete">
          <IonIcon icon={trashOutline}></IonIcon>
        </IonFabButton>
      </IonFab>
      
      <IonAlert
        isOpen={deleting}
        onDidDismiss={() => setDeleting(false)}
        header="Delete note?"
        message={`Delete note?`}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            cssClass: "secondary",
            id: "cancel-button",
            handler: () => {
              setDeleting(false);
            },
          },
          {
            text: "Delete",
            id: "confirm-button",
            handler: () => {
              deleteNote({
                input: { id },
              }).then(() => setDeleted(true));
            },
          },
        ]}
      />

    </BasePage>
  );
};

const NotesListPage: React.FC = () => {
  const [notes] = useNotesSubscription();
  const [, createNote] = useCreateNoteMutation();

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const inputEl = useRef<any>(null);

  useEffect(() => {
    if (showAddNote) {
      setTimeout(() => {
        inputEl.current.querySelector(`.native-input`)?.focus();
      }, 100);
    }
  }, [showAddNote, inputEl]);

  return (
    <BasePage title="Notes">
      <IonModal
        isOpen={showAddNote}
        onDidDismiss={() => setShowAddNote(false)}
        keyboardClose={false}
      >
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonList inset lines="inset">
                <IonListHeader>
                  <IonText color="secondary">
                    <h3>Add Note</h3>
                  </IonText>
                </IonListHeader>

                <IonItem>
                  <IonLabel position="stacked">Note text</IonLabel>
                  <IonInput
                    name="noteText"
                    value={newNoteText}
                    placeholder="Note text"
                    onIonChange={(e) => setNewNoteText(e.detail.value!)}
                    autofocus={true}
                    ref={(ref) => (inputEl.current = ref)}
                  ></IonInput>
                </IonItem>
                <IonItemDivider />
                <IonItem
                  button
                  color="primary"
                  onClick={() =>
                    createNote({
                      input: { note: { textContent: newNoteText } },
                    }).then(() => setShowAddNote(false))
                  }
                  disabled={newNoteText.length === 0}
                >
                  <IonLabel>Create</IonLabel>
                </IonItem>

                <IonItem button onClick={() => setShowAddNote(false)}>
                  <IonLabel>Cancel</IonLabel>
                </IonItem>
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonModal>
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonList>
              {notes.data?.notesList?.map(({ id, shortTextContent }) => (
                <IonItem button key={id} href={`/notes/${id}`}>
                  {shortTextContent}
                </IonItem>
              ))}
              <IonItem
                key="showCreate"
                button
                color="primary"
                onClick={() => {
                  setNewNoteText("");
                  setShowAddNote(true);
                }}
              >
                Add Note
              </IonItem>
            </IonList>
          </IonCol>
        </IonRow>
      </IonGrid>

    </BasePage>
  );
};

const NotesPage: React.FC = () => {
  return (
    <Switch>
      <Route exact path="/notes">
        <NotesListPage />
      </Route>
      <Route path="/notes/:id">
        <NotePage />
      </Route>
    </Switch>
  );
};

export default NotesPage;
