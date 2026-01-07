import { Inject, Injectable } from '@nestjs/common'
import { createHmac } from 'crypto'

import { PASSPORT_OPTIONS } from './constants'
import { PassportOptions } from './interfaces'
import { base64UrlDecode, base64UrlEncode, constantTimeEqual } from './utils'

@Injectable()
export class PassportService {
	private readonly SECRET_KEY: string

	private static readonly HMAC_DOMAIN = 'PassportTokenAuth/v1'
	private static readonly INTERNAL_SEP = '|'

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

		const serialized = this.serialize(userPart, iatPart, expPart)
		const mac = this.computeHMAC(this.SECRET_KEY, serialized)

		return `${userPart}.${iatPart}.${expPart}.${mac}`
	}

	public verify(token: string) {
		const parts = token.split('.')

		if (parts.length !== 4)
			return { valid: false, reason: 'Invalid token format' }

		const [userPart, iatPart, expPart, mac] = parts

		const serialized = this.serialize(userPart, iatPart, expPart)
		const expectedMac = this.computeHMAC(this.SECRET_KEY, serialized)

		if (!constantTimeEqual(expectedMac, mac))
			return { valid: false, reason: 'Invalid signature' }

		const expNumber = Number(base64UrlDecode(expPart))

		if (!Number.isFinite(expNumber))
			return { valid: false, reason: 'Error' }
		if (this.now() > expNumber)
			return { valid: false, reason: 'Token expired' }

		return { valid: true, userId: base64UrlDecode(userPart) }
	}

	private now() {
		return Math.floor(Date.now() / 1000)
	}

	private serialize(user: string, iat: string, exp: string) {
		return [PassportService.HMAC_DOMAIN, user, iat, exp].join(
			PassportService.INTERNAL_SEP
		)
	}

	private computeHMAC(secretKey: string, data: string) {
		return createHmac('sha256', secretKey).update(data).digest('hex')
	}
}
