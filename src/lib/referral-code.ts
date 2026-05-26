const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const REFERRAL_CODE_LENGTH = 8

export function generateReferralCode(): string {
  const bytes = new Uint8Array(REFERRAL_CODE_LENGTH)
  crypto.getRandomValues(bytes)

  return Array.from(bytes, (byte) =>
    REFERRAL_ALPHABET[byte % REFERRAL_ALPHABET.length]
  ).join('')
}
