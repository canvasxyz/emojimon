import { bytesToHex } from "@noble/hashes/utils";
import { blake3 } from "@noble/hashes/blake3";
import { IDBTree } from "@canvas-js/okra-idb";
import { equals } from "multiformats/bytes";
import { encode, decode } from "microcbor";

import { ethers } from "ethers";

import {
  storeService,
  StoreService,
  StoreComponents,
} from "@canvas-js/libp2p-okra-service/store/browser";

import { CHAT_TOPIC } from "./constants";
import { storeDB, modelDB, Message, Update } from "./db";

import { assert } from "./utils";

export type ChatEvents = {
  message: Message;
  update: Update;
};

export type SignedEvent = {
  [T in keyof ChatEvents]: {
    type: T;
    signature: string;
    detail: ChatEvents[T];
  };
}[keyof ChatEvents];

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

      assert(equals(blake3(value, { dkLen: 16 }), key), "invalid event");

      const { signature, ...event } = decode(value) as SignedEvent;
      const from = ethers.utils.verifyMessage(encode(event), signature);

      console.log("applying event", event, "from address", from);

      if (event.type === "message") {
        const message = event.detail;
        assert(
          message.from.toLowerCase() === from.toLowerCase(),
          "event signed by wrong address"
        );
        assert(
          typeof message.content === "string",
          "invalid event: missing message.content"
        );
        assert(
          typeof message.timestamp === "number",
          "invalid event: missing message.timestamp"
        );

        modelDB.messages.add(message);
      } else if (event.type === "update") {
        const update = event.detail;
        assert(
          update.user.toLowerCase() === from.toLowerCase(),
          "event signed by wrong address"
        );

        modelDB.names.put(update);
      } else {
        throw new Error("invalid event type");
      }
    },
  });
}
