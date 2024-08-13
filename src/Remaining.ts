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
	}

	async getRemainer(key: string) {
		const remain = await this.state.storage.get<number>(key);
		return remain;
	}

	async applyRemainer(key: string) {
		const keyDetails = await this.getKeyDetails(key);

		if (!keyDetails) {
			return { error: "Invalid key" };
		}

		const remaining = await this.state.storage.get<number>(key);

		if (remaining === undefined) {
			return { error: "Invalid key" };
		}

		if (remaining <= 0) {
			return { error: "Usage limit exceeded", remaining: 0 };
		}

		await this.state.storage.put(key, remaining - 1);

		return { remaining: remaining - 1 };
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
