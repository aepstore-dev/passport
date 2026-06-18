import type { FactoryProvider, ModuleMetadata } from '@nestjs/common'

import type { PassportOptions } from './passport-options.interface'

export interface PassportAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	// `any[]` here is deliberate, not laziness. NestJS's `useFactory` pattern
	// is a contravariant slot: consumer-supplied factories declare concrete
	// param types (e.g. `(c: ConfigService) => ...`) and need to be assignable
	// HERE. A narrower `unknown[]` would force every consumer to take
	// `unknown[]` themselves (since `unknown` is not assignable from
	// `ConfigService` in parameter position), which then loses the type
	// information the DI container has. This mirrors `@nestjs/common`'s own
	// `FactoryProvider['useFactory']` signature.
	useFactory: (...args: any[]) => Promise<PassportOptions> | PassportOptions
	inject?: FactoryProvider['inject']
}
