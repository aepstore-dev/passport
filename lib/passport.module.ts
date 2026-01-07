import { type DynamicModule, Global, Module } from '@nestjs/common'

import { PASSPORT_OPTIONS } from './constants'
import type { PassportAsyncOptions, PassportOptions } from './interfaces'
import {
	createPassportAsyncOptionsProvider,
	createPassportOptionsProvider
} from './passport.providers'
import { PassportService } from './passport.service'

@Global()
@Module({})
export class PassportModule {
	public static register(options: PassportOptions): DynamicModule {
		const optionsProvider = createPassportOptionsProvider(options)

		return {
			module: PassportModule,
			providers: [optionsProvider, PassportService],
			exports: [PassportService, PASSPORT_OPTIONS]
		}
	}

	public static registerAsync(options: PassportAsyncOptions): DynamicModule {
		const optionsProvider = createPassportAsyncOptionsProvider(options)

		return {
			module: PassportModule,
			imports: options.imports ?? [],
			providers: [optionsProvider, PassportService],
			exports: [PassportService, PASSPORT_OPTIONS]
		}
	}
}
