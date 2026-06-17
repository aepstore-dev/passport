import type { FactoryProvider, ModuleMetadata } from '@nestjs/common'

import type { PassportOptions } from './passport-options.interface'

export interface PassportAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	// Variadic injected deps stay opaque here — the caller declares them
	// via `inject`, and this helper just forwards them to the factory. Use
	// `unknown[]` so consumers must narrow before reading.
	useFactory: (
		...args: unknown[]
	) => Promise<PassportOptions> | PassportOptions
	inject?: FactoryProvider['inject']
}
