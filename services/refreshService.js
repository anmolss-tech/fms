import { collectTrackingData } from "./trackerService";
import { syncUnsyncedData } from "./syncService";

export async function refreshTracker({ sync = true } = {}) {
  const collection = await collectTrackingData();
  let syncResult = null;
  if (sync) {
    try {
      syncResult = await syncUnsyncedData();
    } catch (error) {
      console.log("Background tracker sync failed:", error);
      syncResult = { ok: false, error: error.message };
    }
  }
  return { collection, sync: syncResult };
}
