/**
 * Hands a names-and-numbers list from the Variable Data Printing page to the
 * designer. Kept in sessionStorage (this tab only, cleared when the tab closes);
 * nothing is stored on the server until the customer attaches it to their job.
 */
export interface PendingList {
  productSlug: string;
  fileName: string;
  csvContent: string;
  rowCount: number;
}

const KEY = "w2p-pending-names-list";

export function savePendingList(list: PendingList): boolean {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

export function loadPendingList(productSlug: string): PendingList | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as PendingList;
    return list && list.productSlug === productSlug && typeof list.csvContent === "string" ? list : null;
  } catch {
    return null;
  }
}

export function clearPendingList(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
