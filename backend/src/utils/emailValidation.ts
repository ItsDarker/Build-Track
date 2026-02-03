import disposableDomains from '../data/disposable_domains.json';

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return disposableDomains.includes(domain);
}

const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq',
  '.xyz', '.top', '.work', '.click', '.link'
];

const SPAM_KEYWORDS = [
  'spam', 'junk', 'fake', 'temp', 'trash', 'disposable',
  'throwaway', 'burner', 'temporary'
];

export function isLikelySpamDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
  const hasSpamKeyword = SPAM_KEYWORDS.some(keyword => domain.includes(keyword));
  const numberCount = (domain.match(/\d/g) || []).length;
  const hasExcessiveNumbers = numberCount > 4;

  return hasSuspiciousTLD || hasSpamKeyword || hasExcessiveNumbers;
}
