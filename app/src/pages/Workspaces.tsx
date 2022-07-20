import {
  IonCol,
  IonGrid,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRow,
  IonText,
} from "@ionic/react";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo } from "react";
import BasePage from "../components/BasePage";
import { useMst } from "../models/Root";
import "./Workspaces.css";

const WorkspacesPage: React.FC = observer(() => {
  const { workspaces } = useMst()
  useEffect(() => {
    workspaces.loadWorkspaces()
    return () => {
      workspaces.unsubscribe()
    }
  }, [])

  const byContext: {
    [key: string]: { gitpodWorkspaceId: string; workspaceData: any }[];
  } = [] as any;
  workspaces.workspaceList?.forEach(
    w => {
      const { gitpodWorkspaceId, workspaceData: { url, contextUrl, ports } } = w!
      let arr = byContext[contextUrl];
      if (!arr) {
        arr = [];
        byContext[contextUrl] = arr;
      }
      arr.push({
        gitpodWorkspaceId: gitpodWorkspaceId!,
        workspaceData: {
          url,
          contextUrl,
          ports: ports?.sort(
            (a: any, b: any) => parseInt(a?.port) - parseInt(b?.port)
          ),
        },
      });
    }
  );
  
  return (
    <BasePage title="Workspaces">
      <IonGrid>
        <IonRow>
          <IonCol>
            <IonList inset lines="inset">
              {Object.entries(byContext).map(
                ([contextUrl, contextWorkspaces]) => (
                  <React.Fragment key={contextUrl}>
                    <IonListHeader key={contextUrl}>
                      <IonText color="secondary">
                        <h3>{contextUrl}</h3>
                      </IonText>
                    </IonListHeader>
                    {contextWorkspaces.map(
                      ({ gitpodWorkspaceId, workspaceData: { ports } }) => (
                        <React.Fragment key={gitpodWorkspaceId}>
                          <IonListHeader key={gitpodWorkspaceId}>
                            <IonText color="secondary">
                              <h6>{gitpodWorkspaceId}</h6>
                            </IonText>
                          </IonListHeader>
                          {ports?.map((d: any) => (
                            <IonItem key={d.port} href={d.url} target="_blank">
                              <IonLabel>
                                {d.port}
                                {d.title && ` - ${d.title}`}
                              </IonLabel>
                            </IonItem>
                          ))}
                        </React.Fragment>
                      )
                    )}
                  </React.Fragment>
                )
              )}
            </IonList>
          </IonCol>
        </IonRow>
      </IonGrid>
    </BasePage>
  );
});

export default WorkspacesPage;
