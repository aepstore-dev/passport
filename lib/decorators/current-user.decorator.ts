import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import type { AuthenticatedUser } from '../interfaces'

/**
 * Pulls the authenticated user attached to the HTTP request by
 * PassportAuthGuard (or OptionalPassportAuthGuard).
 *
 * Usage:
 *   @Get('me')
 *   profile(@CurrentUser() user: AuthenticatedUser) { ... }
 *
 *   @Get('me/id')
 *   id(@CurrentUser('id') id: string) { ... }
 */
export const CurrentUser = createParamDecorator(
	(field: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
		if (ctx.getType() !== 'http') return undefined

		const request = ctx.switchToHttp().getRequest()
		const user = (request?.user ?? null) as AuthenticatedUser | null

		if (!user) return undefined
		if (field) return user[field]
		return user
	}
)
