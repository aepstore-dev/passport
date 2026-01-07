import { timingSafeEqual } from 'crypto'

export function constantTimeEqual(a: string, b: string) {
	const bufA = Buffer.from(a)
	const bufB = Buffer.from(b)

	if (bufA.length !== bufB.length) return false

	return timingSafeEqual(bufA, bufB)
}
