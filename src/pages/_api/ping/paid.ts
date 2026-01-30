import { env } from "cloudflare:workers";
import { Expires, Mpay, tempo } from "mpay/server";
import { createClient, http } from "viem";
import { tempoModerato } from "viem/chains";

const chain = (() => {
	switch (env.TEMPO_ENV) {
		case "moderato":
			return tempoModerato;
		default:
			throw new Error(`Unsupported chain: ${env.TEMPO_ENV}`);
	}
})();

const client = createClient({
	chain,
	transport: http(),
});

const mpay = Mpay.create({
	method: tempo({
		client,
	}),
	realm: "mpp.dev",
	secretKey: env.SECRET_KEY!,
});

export async function GET(request: Request) {
	const result = await mpay.charge({
		request: {
			amount: "100000",
			currency: env.DEFAULT_CURRENCY!,
			recipient: env.DEFAULT_RECIPIENT!,
			expires: Expires.minutes(5),
		},
		description: "Ping endpoint access",
	})(request);

	if (result.status === 402) return result.challenge;

	return result.withReceipt(new Response("tm! thanks for paying"));
}
