import { get, set, del } from "idb-keyval"; // Import 'del'
import { dbService } from "./db";

const HANDLE_KEY = "goal_master_backup_handle";

export const backupService = {
  isSupported: () =>
    typeof window !== "undefined" && "showSaveFilePicker" in window,

  // 1. Force a NEW file connection (Always opens popup)
  initializeHandle: async () => {
    if (!backupService.isSupported()) throw new Error("Not supported");

    const options = {
      suggestedName: `goal-master-backup-${
        new Date().toISOString().split("T")[0]
      }.json`,
      types: [
        {
          description: "JSON Database Backup",
          accept: { "application/json": [".json"] },
        },
      ],
    };

    // @ts-ignore
    const handle = await window.showSaveFilePicker(options);
    await set(HANDLE_KEY, handle);
    return handle;
  },

  // 2. Get existing connection
  getStoredHandle: async () => {
    return await get(HANDLE_KEY);
  },

  // 3. Clear connection (For Wipe Data)
  disconnect: async () => {
    await del(HANDLE_KEY);
  },

  // 4. Perform the Save
  performBackup: async (existingHandle?: any) => {
    let handle = existingHandle || (await backupService.getStoredHandle());

    // If no handle exists, ask for one
    if (!handle) {
      handle = await backupService.initializeHandle();
    }

    // Check permissions
    if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") {
      const decision = await handle.requestPermission({ mode: "readwrite" });
      if (decision !== "granted") throw new Error("Permission denied");
    }

    const jsonString = await dbService.exportBackup();
    const writable = await handle.createWritable();
    await writable.write(jsonString);
    await writable.close();

    return true;
  },
};
