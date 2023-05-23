import { Libp2p, createLibp2p } from "libp2p";
import { circuitRelayTransport } from "libp2p/circuit-relay";
import { identifyService } from "libp2p/identify";
import { pingService, PingService } from "libp2p/ping";

import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { bootstrap } from "@libp2p/bootstrap";
import { gossipsub, GossipsubEvents } from "@chainsafe/libp2p-gossipsub";

import type { PubSub } from "@libp2p/interface-pubsub";
import type { PeerId } from "@libp2p/interface-peer-id";

import {
  createEd25519PeerId,
  createFromProtobuf,
  exportToProtobuf,
} from "@libp2p/peer-id-factory";
import { base64 } from "multiformats/bases/base64";
import {
  PubsubServiceDiscovery,
  pubsubServiceDiscovery,
} from "@canvas-js/pubsub-service-discovery";

import { StoreService } from "@canvas-js/libp2p-okra-service/store/browser";

import { testnetBootstrapList } from "./bootstrap";

import {
  MAX_CONNECTIONS,
  MIN_CONNECTIONS,
  PING_TIMEOUT,
  CHAT_TOPIC,
  PEER_ID_KEY,
} from "./constants";

import { getChatService } from "./services";

export type ServiceMap = {
  identify: {};
  pubsub: PubSub<GossipsubEvents>;
  ping: PingService;

  [CHAT_TOPIC]: StoreService;
};

async function getLibp2p(): Promise<Libp2p<ServiceMap>> {
  const peerId = await getPeerId();

  const bootstrapList = testnetBootstrapList;

  const chatService = await getChatService();

  return await createLibp2p({
    peerId: peerId,

    addresses: { listen: [], announce: [] },
    transports: [
      webSockets(),
      circuitRelayTransport({ discoverRelays: bootstrapList.length }),
    ],

    connectionEncryption: [noise()],
    streamMuxers: [mplex()],
    peerDiscovery: [bootstrap({ list: bootstrapList })],

    connectionManager: {
      minConnections: MIN_CONNECTIONS,
      maxConnections: MAX_CONNECTIONS,
    },

    services: {
      pubsub: gossipsub({
        emitSelf: false,
        fallbackToFloodsub: false,
        allowPublishToZeroPeers: true,
        globalSignaturePolicy: "StrictSign",
      }),

      identify: identifyService({
        protocolPrefix: "canvas",
      }),

      ping: pingService({
        protocolPrefix: "canvas",
        maxInboundStreams: 32,
        maxOutboundStreams: 32,
        timeout: PING_TIMEOUT,
      }),

      serviceDiscovery: pubsubServiceDiscovery({
        filterProtocols: (protocol) =>
          protocol === PubsubServiceDiscovery.DISCOVERY_TOPIC ||
          protocol.startsWith("/okra/v0/store/"),
      }),

      [CHAT_TOPIC]: chatService,
    },
  });
}

async function getPeerId(): Promise<PeerId> {
  const entry = window.localStorage.getItem(PEER_ID_KEY);
  if (entry === null) {
    const peerId = await createEd25519PeerId();
    const privateKey = exportToProtobuf(peerId);
    window.localStorage.setItem(PEER_ID_KEY, base64.baseEncode(privateKey));
    console.log("created new peerId", peerId.toString());
    return peerId;
  } else {
    const privateKey = base64.baseDecode(entry);
    const peerId = await createFromProtobuf(privateKey);
    console.log("found existing peerId", peerId.toString());
    return peerId;
  }
}

export const libp2p = await getLibp2p();
(window as any).libp2p = libp2p;
