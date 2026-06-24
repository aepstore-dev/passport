import { Inject, Injectable } from '@nestjs/common'
import { createHmac, randomBytes } from 'crypto'

import { PASSPORT_OPTIONS } from './constants'
import { PassportOptions } from './interfaces'
import { base64UrlDecode, base64UrlEncode, constantTimeEqual } from './utils'

@Injectable()
export class PassportService {
	private readonly SECRET_KEY: string

	private static readonly HMAC_DOMAIN = 'PassportTokenAuth/v1'
	private static readonly INTERNAL_SEP = '|'
	// Bytes of randomness folded into every token so two tokens minted in the
	// same second for the same user are still distinct (prevents collisions on
	// a unique `RefreshToken.token` constraint when logins fire back-to-back).
	private static readonly NONCE_BYTES = 12

	public constructor(
		@Inject(PASSPORT_OPTIONS) private readonly options: PassportOptions
	) {
		this.SECRET_KEY = options.secretKey
	}

	public generate(userId: string, ttl: number) {
		const issuedAt = this.now()
		const expiresAt = issuedAt + ttl

		const userPart = base64UrlEncode(userId)
		const iatPart = base64UrlEncode(String(issuedAt))
		const expPart = base64UrlEncode(String(expiresAt))
		const noncePart = base64UrlEncode(
			randomBytes(PassportService.NONCE_BYTES)
		)

		const serialized = this.serialize(userPart, iatPart, expPart, noncePart)
		const mac = this.computeHMAC(this.SECRET_KEY, serialized)

		return `${userPart}.${iatPart}.${expPart}.${noncePart}.${mac}`
	}

	public verify(token: string) {
		const parts = token.split('.')

		// 5-part = current format (with nonce); 4-part = legacy tokens still in
		// circulation (issued before the nonce was added). Accept both so a
		// passport bump does not force a global re-auth.
		let userPart: string
		let iatPart: string
		let expPart: string
		let noncePart: string | undefined
		let mac: string

		if (parts.length === 5) {
			;[userPart, iatPart, expPart, noncePart, mac] = parts
		} else if (parts.length === 4) {
			;[userPart, iatPart, expPart, mac] = parts
		} else {
			return { valid: false, reason: 'Invalid token format' }
		}

		const serialized = this.serialize(userPart, iatPart, expPart, noncePart)
		const expectedMac = this.computeHMAC(this.SECRET_KEY, serialized)

		if (!constantTimeEqual(expectedMac, mac))
			return { valid: false, reason: 'Invalid signature' }

		const expNumber = Number(base64UrlDecode(expPart))

		if (!Number.isFinite(expNumber))
			return { valid: false, reason: 'Error' }
		if (this.now() > expNumber)
			return { valid: false, reason: 'Token expired' }

		// `iat` (issued-at, unix seconds) is surfaced so callers can enforce
		// server-side revocation: reject tokens minted before a "revoke all
		// sessions" epoch even though the HMAC is still valid (see RevocationStore).
		const iatNumber = Number(base64UrlDecode(iatPart))

		return {
			valid: true,
			userId: base64UrlDecode(userPart),
			iat: Number.isFinite(iatNumber) ? iatNumber : undefined
		}
	}

	private now() {
		return Math.floor(Date.now() / 1000)
	}

	private serialize(
		user: string,
		iat: string,
		exp: string,
		nonce?: string
	) {
		const segments = [PassportService.HMAC_DOMAIN, user, iat, exp]

		// Only fold the nonce into the MAC when present, so legacy 4-part
		// tokens recompute to the exact same digest they were signed with.
		if (nonce !== undefined) segments.push(nonce)

		return segments.join(PassportService.INTERNAL_SEP)
	}

	private computeHMAC(secretKey: string, data: string) {
		return createHmac('sha256', secretKey).update(data).digest('hex')
	}
}
