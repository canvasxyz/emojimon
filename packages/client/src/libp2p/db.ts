import { openDB } from "idb";
import Dexie, { Table } from "dexie";

import { CHAT_TOPIC } from "./constants";

export type Message = { from: string; content: string; timestamp: number, signature: string };

export class ModelDB extends Dexie {
  messages!: Table<Message, string>;

  constructor() {
    super("ModelDB");
    this.version(1).stores({
      messages: "++id, from, timestamp",
    });
  }
}

export const modelDB = new ModelDB();

export const storeDB = await openDB("canvas:emojimon", 1, {
  upgrade(database, oldVersion, newVersion, transaction, event) {
    console.log(
      `upgrading IndexedDB database from ${oldVersion} to ${newVersion}`
    );

    if (database.objectStoreNames.contains(CHAT_TOPIC)) {
      return;
    } else {
      database.createObjectStore(CHAT_TOPIC);
      console.log(`created object store ${CHAT_TOPIC}`);
    }
  },
});
