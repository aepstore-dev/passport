import { RpcStatus } from '@aepstore-dev/common'
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'

import type { AuthenticatedUser } from '../interfaces'
import { PassportService } from '../passport.service'

@Injectable()
export class PassportAuthGuard implements CanActivate {
	public constructor(private readonly passport: PassportService) {}

	public canActivate(context: ExecutionContext): boolean {
		const token = this.extractToken(context)

		if (!token) {
			this.throwUnauthorized(context, 'Missing bearer token')
		}

		const result = this.passport.verify(token)

		if (!result.valid) {
			this.throwUnauthorized(
				context,
				result.reason || 'Invalid token'
			)
		}

		const user: AuthenticatedUser = { id: String(result.userId) }

		this.attachUser(context, user)
		return true
	}

	protected extractToken(context: ExecutionContext): string | null {
		const type = context.getType()

		if (type === 'http') {
			const request = context.switchToHttp().getRequest()
			const header: string | undefined = request?.headers?.authorization
			return this.parseBearer(header)
		}

		if (type === 'rpc') {
			// gRPC Metadata exposes a `get(key) => string[] | string`. We can't
			// depend on @grpc/grpc-js types here (this guard runs in HTTP too),
			// so structurally narrow.
			interface MetadataLike {
				get(key: string): string | string[] | undefined
			}
			const metadata = context.switchToRpc().getContext<unknown>()
			const hasGet =
				typeof metadata === 'object' &&
				metadata !== null &&
				typeof (metadata as MetadataLike).get === 'function'
			if (hasGet) {
				const values = (metadata as MetadataLike).get('authorization')
				const first = Array.isArray(values) ? values[0] : values
				return this.parseBearer(first ? String(first) : undefined)
			}
			return null
		}

		return null
	}

	private parseBearer(header: string | undefined): string | null {
		if (!header) return null
		const match = header.match(/^Bearer\s+(.+)$/i)
		return match ? match[1].trim() : null
	}

	protected attachUser(
		context: ExecutionContext,
		user: AuthenticatedUser
	): void {
		const type = context.getType()
		if (type === 'http') {
			const request = context.switchToHttp().getRequest()
			if (request) {
				request.user = user
			}
		}
		// For gRPC contexts the user lives only for the duration of the call.
		// Consumers should rely on PassportService.verify() directly or on
		// gateway-side guards that attach the user before the gRPC call.
	}

	private throwUnauthorized(
		context: ExecutionContext,
		message: string
	): never {
		if (context.getType() === 'rpc') {
			throw new RpcException({
				code: RpcStatus.UNAUTHENTICATED,
				details: message
			})
		}
		throw new UnauthorizedException(message)
	}
}
