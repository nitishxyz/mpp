import { env } from "cloudflare:workers";
import { Mpay, tempo } from "mpay/server";
import { tempoModerato } from "viem/chains";

export const mpay = Mpay.create({
	method: tempo({
		chainId: tempoModerato.id,
		rpcUrl: tempoModerato.rpcUrls.default.http[0],
	}),
	realm: "mpp.dev",
	secretKey: env.SECRET_KEY! ?? "top-secret",
});
