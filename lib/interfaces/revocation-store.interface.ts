/**
 * Optional server-side revocation hook for PassportAuthGuard.
 *
 * Passport access tokens are stateless HMAC — once minted they stay valid
 * until `exp`, so deleting a refresh-token row does NOT kill the matching
 * access token. To make "log out everywhere" / password-change / ban take
 * effect immediately, a consumer can bind an implementation of this interface
 * to `REVOCATION_STORE`. The guard then rejects any token whose `iat` predates
 * the user's revoke epoch.
 *
 * If no provider is bound (e.g. inside internal services that only see
 * service-to-service traffic), the guard skips the check and behaves as a pure
 * HMAC verifier — no Redis dependency is forced on the library.
 */
export interface RevocationStore {
	/**
	 * @returns true if a token issued at `tokenIat` (unix seconds) for `userId`
	 * has been revoked and must be rejected.
	 */
	isRevoked(userId: string, tokenIat: number): Promise<boolean>
}

/** DI token to bind a {@link RevocationStore} implementation. */
export const REVOCATION_STORE = Symbol('PASSPORT_REVOCATION_STORE')
