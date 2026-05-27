# CLAUDE.md — @aepstore-dev/passport

Lightweight token library used by `auth-service`. **Not** JWT — do not import `@nestjs/jwt` or `@nestjs/passport`; they are unrelated to this package.

## Token format

```
base64url(userId) . base64url(iat) . base64url(exp) . hmac
```

- `iat` and `exp` are Unix seconds (`Math.floor(Date.now()/1000)`); `ttl` arguments to `generate(userId, ttl)` are in seconds and added to `iat`.
- HMAC is `HMAC-SHA256(secretKey, "PassportTokenAuth/v1|userPart|iatPart|expPart")` (hex). The `PassportTokenAuth/v1` prefix is the domain separator — keep it stable across services or tokens become unverifiable.
- `verify(token)` splits on `.`, recomputes the HMAC with `constantTimeEqual`, then checks expiry. Returns `{ valid: true, userId }` or `{ valid: false, reason }`. The caller decides how to surface the failure (e.g. `RpcException` with `RpcStatus.UNAUTHENTICATED`).
- The payload is **opaque** but **not encrypted** — `userId` is recoverable by anyone who reads the token. Don't put secrets in it. The only claim is `sub` (in `TokenPayload`); add more by extending `userId` is not supported — the token model is single-value.

## Module wiring

`PassportModule` is `@Global()` and exports `PassportService` + the `PASSPORT_OPTIONS` token. Two registration styles:

```ts
PassportModule.register({ secretKey: '...' })
PassportModule.registerAsync({
  useFactory: getPassportConfig,
  inject: [ConfigService],
  imports: [...]   // optional
})
```

The async factory's return value is validated (`secretKey` must be a string) and `Object.freeze`d. See [passport.providers.ts](lib/passport.providers.ts).

## Layout

```
lib/
  passport.module.ts         # register / registerAsync
  passport.service.ts        # generate / verify
  passport.providers.ts      # PASSPORT_OPTIONS provider factories (+ runtime validation)
  constants/                 # PASSPORT_OPTIONS injection token
  interfaces/                # PassportOptions, PassportAsyncOptions, TokenPayload, VerifyResult
  utils/                     # base64UrlEncode/Decode, constantTimeEqual
  index.ts
```

Builds with `yarn build` (tsc → `dist/`). Published as `@aepstore-dev/passport`; consumed by `auth-service` as a normal npm dep.

## Conventions

- Issue both access and refresh tokens via the same `generate(...)` with different TTLs. There is no separate refresh-token API surface here.
- Never log or persist the raw `secretKey`. If it leaks, all tokens are forgeable until rotated.
- Rotating the secret invalidates all outstanding tokens. There is no key-id / multi-key support — design rotations around a forced re-auth.
- The HMAC domain constant (`PassportTokenAuth/v1`) is intentional — bumping it (`/v2`) is a hard cutover. Don't change it casually.
