export type RecentAddress = {
  address: string;
  usedAt: number;
};

const KEY_RECENT = "recent-from-addresses";
const MAX_RECENT = 3;

export class Storage {
  static getRecentAddresses(): RecentAddress[] {
    try {
      const raw = localStorage.getItem(KEY_RECENT);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item): item is RecentAddress =>
            typeof item?.address === "string" &&
            typeof item?.usedAt === "number"
        )
        .slice(0, MAX_RECENT);
    } catch {
      return [];
    }
  }

  static saveRecentAddress(address: string): RecentAddress[] {
    const normalized = address.trim();
    if (!normalized) return this.getRecentAddresses();

    const withoutDuplicate = this.getRecentAddresses().filter(
      (item) => item.address.toLowerCase() !== normalized.toLowerCase()
    );
    const next = [
      { address: normalized, usedAt: Date.now() },
      ...withoutDuplicate,
    ].slice(0, MAX_RECENT);

    localStorage.setItem(KEY_RECENT, JSON.stringify(next));
    return next;
  }
}
