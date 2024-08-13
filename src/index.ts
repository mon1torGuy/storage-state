import { Remain } from "./Remaining";
import { RateLimit } from "./RateLimit";
import { WorkerEntrypoint } from "cloudflare:workers";
interface Env {
	RATELIMIT: DurableObjectNamespace<RateLimit>;
	REMAIN: DurableObjectNamespace<Remain>;
}

export default class extends WorkerEntrypoint<Env> {
	async fetch() {
		return new Response("Hello World! from LLM Caching");
	}

	async ratelimitGet(key: string) {
		const id = this.env.RATELIMIT.idFromName(key);
		const ratelimitStub = this.env.RATELIMIT.get(id);
		const ratelimitInfo = await ratelimitStub.getRateLimit(key);
		return {
			success: true,
			message: "Ratelimit get successfuly",
			data: ratelimitInfo,
		};
	}
	async ratelimitSet(
		key: string,
		ratelimit: { limit: number; timeWindow: number },
	) {
		const id = this.env.RATELIMIT.idFromName(key);
		const ratelimitStub = this.env.RATELIMIT.get(id);
		const ratelimitSet = await ratelimitStub.initRateLimit(key, ratelimit);
		return {
			success: true,
			message: "Ratelimit set successfuly",
			data: ratelimitSet,
		};
	}

	async ratelimit(key: string) {
		const id = this.env.RATELIMIT.idFromName(key);
		const ratelimitStub = this.env.RATELIMIT.get(id);
		const ratelimitApply = await ratelimitStub.applyRateLimit(key);
		return {
			success: true,
			message: "Ratelimit apply successfuly",
			data: ratelimitApply,
		};
	}

	async remainGet(key: string) {
		const id = this.env.REMAIN.idFromName(key);
		const remainStub = this.env.REMAIN.get(id);
		const remain = await remainStub.getRemainer(key);
		return { success: true, message: "Remain get successfuly", data: remain };
	}
	async remainSet(key: string, remain: number) {
		const id = this.env.REMAIN.idFromName(key);
		const remainStub = this.env.REMAIN.get(id);
		const remainSet = await remainStub.initRemainer(key, remain);
		return {
			success: true,
			message: "Remain set successfuly",
			data: remainSet,
		};
	}

	async remain(key: string) {
		const id = this.env.REMAIN.idFromName(key);
		const remainStub = this.env.REMAIN.get(id);
		const remainApply = await remainStub.applyRemainer(key);
		return {
			success: true,
			message: "Remain apply successfuly",
			data: remainApply,
		};
	}
}

export { RateLimit, Remain };
