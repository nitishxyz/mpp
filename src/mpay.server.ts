import { env } from "cloudflare:workers";
import { Mpay, tempo } from "mpay/server";
import { createClient, http } from "viem";
import { tempoModerato } from "viem/chains";

const chain = (() => {
	switch (env.CHAIN) {
		case "moderato":
			return tempoModerato;
		default:
			throw new Error(`Unsupported chain: ${env.CHAIN}`);
	}
})();

const client = createClient({
	chain,
	transport: http(),
});

export const mpay = Mpay.create({
	method: tempo({
		client,
	}),
	realm: "mpp.dev",
	secretKey: env.SECRET_KEY! ?? "top-secret",
});
