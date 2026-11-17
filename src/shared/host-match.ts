const escape = (s: string): string => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/** Matches a hostname against `*` wildcard patterns. Case-insensitive, whole host only. */
export const hostMatches = (hostname: string, pattern: string): boolean => {
  const re = new RegExp(`^${pattern.toLowerCase().split('*').map(escape).join('.*')}$`);
  return re.test(hostname.toLowerCase());
};

export const isSkipped = (hostname: string, skipList: readonly string[]): boolean =>
  skipList.some((p) => hostMatches(hostname, p));
