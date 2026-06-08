import crypto from 'crypto'

const IV_LENGTH = 16

function getKey(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret.slice(0, 32).padEnd(32, '0')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(text: string): string {
  const key = getKey()
  const [ivHex, encryptedHex] = text.split(':')
  const iv        = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher  = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString()
}

export function hashXUserId(xUserId: string): string {
  return `0x${crypto.createHash('sha256').update(`xen-xuid-${xUserId}`).digest('hex')}`
}
