import type { FactoryProvider, ModuleMetadata } from '@nestjs/common'

import type { PassportOptions } from './passport-options.interface'

export interface PassportAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: any[]) => Promise<PassportOptions> | PassportOptions
	inject?: FactoryProvider['inject']
}
