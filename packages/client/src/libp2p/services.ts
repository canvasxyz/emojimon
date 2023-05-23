import { bytesToHex } from "@noble/hashes/utils";

import { IDBTree } from "@canvas-js/okra-idb";

import {
  storeService,
  StoreService,
  StoreComponents,
} from "@canvas-js/libp2p-okra-service/store/browser";

import { CHAT_TOPIC } from "./constants";
import { storeDB } from "./db";

export async function getChatService(): Promise<
  (components: StoreComponents) => StoreService
> {
  const tree = await IDBTree.open(storeDB, CHAT_TOPIC);
  return storeService(tree, {
    topic: CHAT_TOPIC,
    apply: async (key, value) => {
      console.log(`${CHAT_TOPIC}: got entry`, {
        key: bytesToHex(key),
        value: bytesToHex(value),
      });
    },
  });
}
