import { openDB } from "idb";
import Dexie, { Table } from "dexie";

import { CHAT_TOPIC } from "./constants";

export type Message = { from: string; content: string; timestamp: number };
export type Update = { user: string; name: string };

export class ModelDB extends Dexie {
  messages!: Table<Message, number>;
  names!: Table<{ user: string; name: string }, string>;

  constructor() {
    super(`${CHAT_TOPIC}/models`);
    this.version(1).stores({
      messages: "++id, from, timestamp",
      names: "user",
    });
  }
}

export const modelDB = new ModelDB();

export const storeDB = await openDB(`${CHAT_TOPIC}/events`, 1, {
  upgrade(database, oldVersion, newVersion, transaction, event) {
    console.log(
      `upgrading IndexedDB database from ${oldVersion} to ${newVersion}`
    );

    const storeNames = [CHAT_TOPIC];
    for (const storeName of storeNames) {
      if (database.objectStoreNames.contains(storeName)) {
        continue;
      } else {
        database.createObjectStore(storeName);
        console.log(`created object store ${storeName}`);
      }
    }
  },
});
