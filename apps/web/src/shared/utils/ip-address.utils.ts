/**
 * « ::ffff:203.0.113.8 » is an IPv4 client seen through an IPv6 socket. One
 * address keeps one spelling, in rate limits as in the journal (audit of
 * 31 October 2026).
 */
const IPV4_MAPPED_PREFIXES = ['::ffff:', '0:0:0:0:0:ffff:'] as const;
const IPV4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/u;

export const unmapIpv4Address = (value: string): string => {
  const lower = value.toLowerCase();
  const prefix = IPV4_MAPPED_PREFIXES.find((item) => lower.startsWith(item));
  if (!prefix) return value;
  const ipv4 = value.slice(prefix.length);

  return IPV4.test(ipv4) ? ipv4 : value;
};
