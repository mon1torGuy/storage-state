import { DurableObject } from "cloudflare:workers";

interface Env {
	typeauth_keys: KVNamespace;
}

interface KeyDetailsRemaining {
	remaining: number;
}

export class Remain extends DurableObject {
	private state: DurableObjectState;

	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
		this.state = state;
		this.env = env;
	}

	async initRemainer(key: string, remain: number) {
		await this.state.storage.put(key, remain);
		return {
			success: true,
			message: "Remain set successfuly",
			code: 200,
			data: remain,
		};
	}

	async getRemainer(key: string) {
		const remain = await this.state.storage.get<number>(key);
		return {
			success: true,
			message: "Remain get successfuly",
			code: 200,
			data: remain,
		};
	}

	async applyRemainer(key: string) {
		const keyDetails = await this.getKeyDetails(key);

		if (!keyDetails) {
			return { success: false, message: "Invalid key", code: 400, data: {} };
		}

		const remaining = await this.state.storage.get<number>(key);

		if (remaining === undefined) {
			return { success: false, message: "Invalid key", code: 400, data: {} };
		}

		if (remaining <= 0) {
			return {
				success: false,
				message: "Usage limit exceeded",
				code: 429,
				data: {},
			};
		}

		await this.state.storage.put(key, remaining - 1);
		const updatedRemaining = remaining - 1;
		return {
			success: true,
			message: "Remain apply successfuly",
			code: 200,
			data: { remaining: updatedRemaining },
		};
	}

	async getKeyDetails(key: string): Promise<KeyDetailsRemaining | null> {
		//@ts-expect-error
		const keyDetailsJson = await this.env.typeauth_keys.get(key);
		if (keyDetailsJson) {
			return JSON.parse(keyDetailsJson) as KeyDetailsRemaining;
		}
		return null;
	}
}
