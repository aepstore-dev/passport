# @aepstore-dev/passport

[English Version](./README.md)

Легковесная библиотека аутентификации для экосистемы aepstore. Предоставляет NestJS модуль для генерации и валидации защищенных токенов с использованием HMAC подписи.

## Установка

```bash
yarn add @aepstore-dev/passport
```

## Подключение

Импортируйте `PassportModule` в ваш корневой модуль приложения. Модуль является глобальным (`@Global()`), поэтому его достаточно подключить один раз в корневом модуле (`AppModule`).

### Синхронная конфигурация

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

### Асинхронная конфигурация

Обычно используется для получения секретного ключа из переменных окружения (например, через `ConfigService`).

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

## Использование

Внедрите `PassportService` в ваши сервисы для работы с токенами.

```typescript
import { PassportService } from '@aepstore-dev/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AuthService {
	constructor(private readonly passportService: PassportService) {}

	async signIn(user: { id: string }) {
		// Генерация токена для пользователя
		// ttl (Time To Live) указывается в секундах. Например, 3600 = 1 час.
		const token = this.passportService.generate(user.id, 3600)
		return { accessToken: token }
	}

	async validateToken(token: string) {
		// Проверка токена
		const result = this.passportService.verify(token)

		if (!result.valid) {
			// result.reason содержит причину ошибки: 'Invalid token format', 'Invalid signature', 'Token expired' и т.д.
			throw new UnauthorizedException(`Invalid token: ${result.reason}`)
		}

		// Если токен валиден, result.userId будет содержать ID пользователя
		return { userId: result.userId }
	}
}
```

## API

### PassportModule

Методы для регистрации модуля:

- `static register(options: PassportOptions): DynamicModule`
- `static registerAsync(options: PassportAsyncOptions): DynamicModule`

### PassportOptions

Интерфейс конфигурации модуля.

| Свойство    | Тип      | Описание                                |
| ----------- | -------- | --------------------------------------- |
| `secretKey` | `string` | Секретный ключ для HMAC-SHA256 подписи. |

### PassportService

Основной сервис для работы с токенами.

#### `generate(userId: string, ttl: number): string`

Создает новый подписанный токен.

- **userId**: Строка идентификатора пользователя (будет закодирована в токене).
- **ttl**: Время жизни токена в секундах.

Возвращает строковый токен в формате: `userPart.iatPart.expPart.signature`.

#### `verify(token: string)`

Проверяет подпись и срок действия токена.

Возвращает объект результата:

- В случае успеха: `{ valid: true, userId: string }`
- В случае ошибки: `{ valid: false, reason: string }`

Возможные причины ошибок (`reason`):

- `Invalid token format`
- `Invalid signature`
- `Token expired`
- `Error` (внутренняя ошибка парсинга)
