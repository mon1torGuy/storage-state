import { DurableObject } from "cloudflare:workers";

interface Env {
	typeauth_keys: KVNamespace;
}
interface KeyDetails {
	rl: {
		limit: number;
		timeWindow: number;
	};
}

export class RateLimit extends DurableObject {
	private state: DurableObjectState;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
		this.env = env;
	}
	// async fetch() {
	// 	return new Response("RateLimit Durable Object");
	// }

	async initRateLimit(
		key: string,
		ratelimit: { limit: number; timeWindow: number },
	) {
		await this.ctx.storage.put(key, ratelimit);

		return {
			success: true,
			message: "Ratelimit set successfuly",
			code: 200,
			data: ratelimit,
		};
	}

	async getRateLimit(key: string) {
		const ratelimit = await this.ctx.storage.get<RateLimit>(key);
		return {
			success: true,
			message: "Ratelimit get successfuly",
			code: 200,
			data: ratelimit,
		};
	}

	async applyRateLimit(key: string) {
		// Retrieve the key details from storage or database
		const keyDetails = await this.getKeyDetails(key);

		if (!keyDetails) {
			return { success: false, message: "Invalid key", code: 400, data: {} };
		}

		const { limit, timeWindow } = keyDetails.rl;

		if (!limit || !timeWindow) {
			return { success: false, message: "Invalid key", code: 400, data: {} };
		}

		const now = Date.now() / 1000; // Current timestamp in seconds

		const storageValue = await this.ctx.storage.get<{
			value: number;
			expiration: number;
		}>(key);
		let value = storageValue?.value || 0;
		let expiration = storageValue?.expiration || now + timeWindow;

		if (now < expiration) {
			if (value >= limit) {
				return {
					success: false,
					code: 429,
					message: "Rate limit exceeded",
					data: { remaining: 0 },
				};
			}
			value++;
		} else {
			value = 1;
			expiration = now + timeWindow;
		}

		await this.ctx.storage.put(key, { value, expiration });

		const rlremaining = limit - value;

		return {
			success: true,
			message: "Ratelimit apply successfuly",
			code: 200,
			data: { reamin: rlremaining },
		};
	}

	async getKeyDetails(key: string): Promise<KeyDetails | null> {
		//@ts-expect-error
		const keyDetailsJson = await this.env.typeauth_keys.getWithMetadata(key);
		if (keyDetailsJson.metadata) {
			return keyDetailsJson.metadata as KeyDetails;
		}
		return null;
	}
}
