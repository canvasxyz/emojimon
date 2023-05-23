import { openDB } from "idb";

import { CHAT_TOPIC } from "./constants";

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
