export interface TokenPayload {
	sub: string | number
}

export interface VerifyResult {
	valid: boolean
	reason?: string
	userId?: string | number
}
