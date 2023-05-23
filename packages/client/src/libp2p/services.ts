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
import { storeDB, modelDB, Message } from "./db";
import { assert } from "./utils";

export async function getChatService(): Promise<
  (components: StoreComponents) => StoreService
> {
  const tree = await IDBTree.open(storeDB, CHAT_TOPIC);
  return storeService(tree, {
    topic: CHAT_TOPIC,
    apply: async (key, value) => {
      assert(equals(blake3(value, { dkLen: 16 }), key), "invalid entry");
      const { from, content, timestamp, signature } = decode(value) as Message;
      assert(typeof from === "string", "invalid entry: missing message.from");
      assert(
        typeof content === "string",
        "invalid entry: missing message.content"
      );
      assert(
        typeof timestamp === "number",
        "invalid entry: missing message.timestamp"
      );
      assert(
        typeof signature === "string",
        "invalid entry: missing message.signature"
      );

      const valid = true;
      console.log(signature);
      assert(valid, "invalid signature");

      modelDB.messages.add({ from, content, timestamp });
      console.log(`${CHAT_TOPIC}: got entry`, {
        key: bytesToHex(key),
        value: bytesToHex(value),
      });
    },
  });
}
