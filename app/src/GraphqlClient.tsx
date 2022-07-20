import { observer } from "mobx-react-lite";
import React from "react";
import { useMst } from "./models/Root";
import { Provider } from "urql";

const GraphqlClient = observer((props) => {
  const { network } = useMst();
  return <Provider value={network.graphqlClient}>{props.children}</Provider>;
});

export default GraphqlClient;
