import {
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { codeOutline } from "ionicons/icons";
import { observer } from "mobx-react-lite";
import { ConnectionStatus } from "../models/Network";
import { useMst } from "../models/Root";
import "./BasePage.css";



const BasePage: React.FC<{ title: string }> = observer(({ title, children }) => {
  const { network } = useMst() 
  const status = network.connectionStatus
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle slot="start">
            <IonText color="primary">{title}</IonText>
          </IonTitle>
          <IonTitle slot="end">
            {status != ConnectionStatus.Online && <IonChip><IonLabel>{status}</IonLabel></IonChip>}
            <IonText color="primary">{network.user?.name}</IonText>
          </IonTitle>
          
        </IonToolbar>
      </IonHeader>
      <IonContent>{children}</IonContent>
    </IonPage>
  );
});

export default BasePage;
