import { ExecutionContext, Injectable } from '@nestjs/common'

import { PassportAuthGuard } from './passport-auth.guard'

/**
 * Variant of PassportAuthGuard that never throws. If the token is missing or
 * invalid, the request proceeds with no `user` attached. Useful for endpoints
 * whose response shape varies for anonymous vs. authenticated callers
 * (e.g. profile pages that hide subscription state when no caller).
 */
@Injectable()
export class OptionalPassportAuthGuard extends PassportAuthGuard {
	public override canActivate(context: ExecutionContext): boolean {
		try {
			return super.canActivate(context)
		} catch {
			return true
		}
	}
}
