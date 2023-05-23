import { createContext, useState, useEffect, useContext } from "react";

import { Libp2p } from "libp2p";
import { PeerId } from "@libp2p/interface-peer-id";
import { Connection } from "@libp2p/interface-connection";
import { identifyService } from "libp2p/identify";

import { libp2p } from "./index.js";

interface Libp2pContext {
  connectionCount: number;
}

const Libp2pContext = createContext<Libp2pContext>({ connectionCount: 0 });

export function useLibp2p(): { libp2p: Libp2p; connectionCount: number } {
  const { connectionCount } = useContext(Libp2pContext);
  return { libp2p, connectionCount };
}

export const Libp2pProvider: React.FC<{ children: React.ReactNode }> = (
  props
) => {
  const [connectionCount, setConnectionCount] = useState(0);
  // const [peerCount, setPeerCount] = useState(0);

  useEffect(() => {
    // const handlePeerConnect = ({ detail: peerId }: CustomEvent<PeerId>) => {};
    // const handlePeerDisconnect = ({
    //   detail: peerId,
    // }: CustomEvent<PeerId>) => {};
    // libp2p.addEventListener("peer:connect", handlePeerConnect);
    // libp2p.addEventListener("peer:disconnect", handlePeerDisconnect);

    const handleConnectionOpen = ({
      detail: { id, remotePeer, remoteAddr },
    }: CustomEvent<Connection>) => {
      console.log(
        `opened connection ${identifyService} to ${remotePeer.toString()} at ${remoteAddr.toString()}`
      );

      const connections = libp2p.getConnections();
      setConnectionCount(connections.length);
    };

    const handleConnectionClose = ({
      detail: { id, remotePeer, remoteAddr },
    }: CustomEvent<Connection>) => {
      console.log(
        `closed connection ${identifyService} to ${remotePeer.toString()} at ${remoteAddr.toString()}`
      );

      const connections = libp2p.getConnections();
      setConnectionCount(connections.length);
    };

    libp2p.addEventListener("connection:open", handleConnectionOpen);
    libp2p.addEventListener("connection:close", handleConnectionOpen);

    return () => {
      // libp2p.removeEventListener("peer:connect", handlePeerConnect);
      // libp2p.removeEventListener("peer:disconnect", handlePeerDisconnect);
      libp2p.addEventListener("connection:open", handleConnectionOpen);
      libp2p.addEventListener("connection:close", handleConnectionClose);
    };
  }, []);

  return (
    <Libp2pContext.Provider value={{ connectionCount }}>
      {props.children}
    </Libp2pContext.Provider>
  );
};
