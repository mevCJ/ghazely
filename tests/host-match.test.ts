import { describe, expect, it } from 'vitest';
import { hostMatches, isSkipped } from '../src/shared/host-match';
import { DEFAULT_SKIP_LIST } from '../src/shared/scare-script';

describe('hostMatches', () => {
  it('matches an exact host, ignoring case', () => {
    expect(hostMatches('Meet.Google.com', 'meet.google.com')).toBe(true);
  });
  it('does not treat dots as wildcards', () => {
    expect(hostMatches('meetXgoogleXcom', 'meet.google.com')).toBe(false);
  });
  it('does not match a longer host without a wildcard', () => {
    expect(hostMatches('evil-meet.google.com', 'meet.google.com')).toBe(false);
    expect(hostMatches('meet.google.com.evil.io', 'meet.google.com')).toBe(false);
  });
  it('matches * as any run of characters', () => {
    expect(hostMatches('app.zoom.us', '*.zoom.us')).toBe(true);
    expect(hostMatches('zoom.us', '*.zoom.us')).toBe(false);
  });
});

describe('default skip list', () => {
  it.each([
    'meet.google.com',
    'zoom.us',
    'us02web.zoom.us',
    'teams.microsoft.com',
    'www.paypal.com',
    'checkout.stripe.com',
    'online.bankofamerica.com',
    'bankofamerica.com',
  ])('skips %s', (h) => expect(isSkipped(h, DEFAULT_SKIP_LIST)).toBe(true));

  it.each(['example.com', 'github.com', 'docs.google.com'])('does not skip %s', (h) =>
    expect(isSkipped(h, DEFAULT_SKIP_LIST)).toBe(false),
  );
});
