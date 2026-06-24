export interface AuthenticatedUser {
	id: string
	/** Token issued-at (unix seconds), when the guard could decode it. */
	iat?: number
}
