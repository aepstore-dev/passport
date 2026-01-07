# @aepstore-dev/passport

[Russian Version](./README.ru.md)

Lightweight authentication library for the aepstore ecosystem. Provides a NestJS module for generating and validating secure tokens using HMAC signature.

## Installation

```bash
yarn add @aepstore-dev/passport
```

## Setup

Import `PassportModule` into your application's root module. The module is global (`@Global()`), so importing it once in the root module (`AppModule`) is sufficient.

### Synchronous Configuration

```typescript
import { PassportModule } from '@aepstore-dev/passport'
import { Module } from '@nestjs/common'

@Module({
	imports: [
		PassportModule.register({
			secretKey: 'your-secret-key-here'
		})
	]
})
export class AppModule {}
```

### Asynchronous Configuration

Usually used to retrieve the secret key from environment variables (e.g., via `ConfigService`).

```typescript
import { PassportModule } from '@aepstore-dev/passport'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
	imports: [
		ConfigModule.forRoot(),
		PassportModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secretKey: configService.getOrThrow<string>(
					'PASSPORT_SECRET_KEY'
				)
			})
		})
	]
})
export class AppModule {}
```

## Usage

Inject `PassportService` into your services to work with tokens.

```typescript
import { PassportService } from '@aepstore-dev/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AuthService {
	constructor(private readonly passportService: PassportService) {}

	async signIn(user: { id: string }) {
		// Generate a token for the user
		// ttl (Time To Live) is specified in seconds. For example, 3600 = 1 hour.
		const token = this.passportService.generate(user.id, 3600)
		return { accessToken: token }
	}

	async validateToken(token: string) {
		// Verify the token
		const result = this.passportService.verify(token)

		if (!result.valid) {
			// result.reason contains the error reason: 'Invalid token format', 'Invalid signature', 'Token expired', etc.
			throw new UnauthorizedException(`Invalid token: ${result.reason}`)
		}

		// If the token is valid, result.userId will contain the user ID
		return { userId: result.userId }
	}
}
```

## API

### PassportModule

Methods for registering the module:

- `static register(options: PassportOptions): DynamicModule`
- `static registerAsync(options: PassportAsyncOptions): DynamicModule`

### PassportOptions

Module configuration interface.

| Property    | Type     | Description                           |
| ----------- | -------- | ------------------------------------- |
| `secretKey` | `string` | Secret key for HMAC-SHA256 signature. |

### PassportService

The main service for working with tokens.

#### `generate(userId: string, ttl: number): string`

Creates a new signed token.

- **userId**: User identifier string (will be encoded in the token).
- **ttl**: Token Time To Live in seconds.

Returns a string token in the format: `userPart.iatPart.expPart.signature`.

#### `verify(token: string)`

Verifies the signature and expiration of the token.

Returns a result object:

- On success: `{ valid: true, userId: string }`
- On error: `{ valid: false, reason: string }`

Possible error reasons (`reason`):

- `Invalid token format`
- `Invalid signature`
- `Token expired`
- `Error` (internal parsing error)
