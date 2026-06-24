export interface TokenPayload {
	sub: string | number
}

export interface VerifyResult {
	valid: boolean
	reason?: string
	userId?: string | number
	/** Issued-at (unix seconds) — present only when `valid`. */
	iat?: number
}
