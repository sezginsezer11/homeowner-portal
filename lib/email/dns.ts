export function buildDnsInstructions(domain: string, dkimTokens: string[]) {
  return {
    domain,
    dkim: dkimTokens.map(t => ({
      host: `${t}._domainkey.${domain}`,
      type: 'CNAME' as const,
      value: `${t}.dkim.amazonses.com`,
    })),
    spf: {
      host: domain,
      type: 'TXT' as const,
      value: 'v=spf1 include:amazonses.com ~all',
    },
    dmarc: {
      host: `_dmarc.${domain}`,
      type: 'TXT' as const,
      value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}; pct=100`,
    },
    mxNote: 'No MX record needed for sending. Add an MX only if you also want to RECEIVE mail at this domain.',
  };
}
