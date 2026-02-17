# MPP Skills

> Machine Payments Protocol — pay for any API with stablecoins, no API keys needed.

## Quick setup

```bash
# Install presto (the MPP CLI)
curl -fsSL https://raw.githubusercontent.com/tempoxyz/presto/main/install.sh | bash

# Create a wallet and log in
presto login
```

After `presto login`, your wallet is saved to `~/.presto/config.toml`. You only need to do this once.

### Fund your wallet

Get your wallet address:

```bash
presto whoami
```

Fund it with pathUSD on Tempo. For testnet, use the faucet at https://faucet.tempo.xyz.

## Making paid requests with presto

`presto` is wget for payments. It detects `402 Payment Required` responses, fulfills payment, and retries automatically.

```bash
# Basic paid request
presto query https://openai.payments.tempo.xyz/v1/chat/completions \
  -X POST \
  --json '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'

# Preview cost without paying
presto query -D https://openai.payments.tempo.xyz/v1/chat/completions

# Inspect payment requirements
presto inspect https://openai.payments.tempo.xyz/v1/chat/completions

# Set maximum payment (in atomic units, 6 decimals — 1000000 = $1)
presto query -M 100000 https://openai.payments.tempo.xyz/v1/chat/completions \
  -X POST \
  --json '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'

# Verbose output to see the full 402 flow
presto query -vi https://openai.payments.tempo.xyz/v1/chat/completions \
  -X POST \
  --json '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'

# Check wallet balance
presto balance
```

### Key flags

| Flag | Description |
|------|-------------|
| `-D` | Dry run — preview without paying |
| `-y` | Require confirmation before payment |
| `-M <amount>` | Maximum payment amount (atomic units) |
| `-v` | Verbose output |
| `-i` | Include response headers |
| `-o <file>` | Save response to file |
| `-X <method>` | HTTP method (GET, POST, etc.) |
| `--json <data>` | Send JSON body (sets Content-Type automatically) |
| `-H <header>` | Custom header |

## Discovering available services

All services and their schemas are available at a single endpoint:

```bash
# List all available services
curl https://payments.tempo.xyz/discover

# Get schema for a specific service
curl https://payments.tempo.xyz/discover/openai
curl https://payments.tempo.xyz/discover/anthropic
curl https://payments.tempo.xyz/discover/fal
```

The discover endpoint returns JSON with full route schemas, pricing, and descriptions.

You can also use the text-based index:

```bash
curl https://payments.tempo.xyz/llms.txt
```

## Available services

Every service is accessed via `{service}.payments.tempo.xyz`. The proxy handles payment automatically — just use the same API paths as the upstream service.

### AI & LLMs

| Service | Endpoint | Description |
|---------|----------|-------------|
| OpenRouter | `openrouter.payments.tempo.xyz` | 100+ LLM models (Claude, GPT-4o, Llama, etc.) |
| Anthropic | `anthropic.payments.tempo.xyz` | Claude models directly |
| OpenAI | `openai.payments.tempo.xyz` | GPT-4, embeddings, DALL-E, Whisper, TTS |
| fal.ai | `fal.payments.tempo.xyz` | FLUX, Stable Diffusion, Recraft, video generation |
| ElevenLabs | `elevenlabs.payments.tempo.xyz` | Text-to-speech, speech-to-text, voice cloning |

### Web & Data

| Service | Endpoint | Description |
|---------|----------|-------------|
| Firecrawl | `firecrawl.payments.tempo.xyz` | Web scraping, crawling, search, extraction |
| Browserbase | `browserbase.payments.tempo.xyz` | Headless browser sessions |
| Exa | `exa.payments.tempo.xyz` | AI-native search, content retrieval, answers |

### Blockchain & Data

| Service | Endpoint | Description |
|---------|----------|-------------|
| Codex | `codex.payments.tempo.xyz` | GraphQL blockchain data (tokens, trades, NFTs) |
| Alchemy | `alchemy.payments.tempo.xyz` | Multi-chain JSON-RPC and NFT APIs |
| Tempo RPC | `rpc.payments.tempo.xyz` | Tempo network JSON-RPC |

### Communications

| Service | Endpoint | Description |
|---------|----------|-------------|
| Twilio | `twilio.payments.tempo.xyz` | SMS and MMS messaging |
| X (Twitter) | `twitter.payments.tempo.xyz` | Tweets, users, search |

### Infrastructure

| Service | Endpoint | Description |
|---------|----------|-------------|
| Object Storage | `storage.payments.tempo.xyz` | S3-compatible object storage |

## Example: calling services

All proxy endpoints use the same API as the upstream service. Replace the upstream base URL with the proxy endpoint.

### OpenAI chat completion

```bash
presto query https://openai.payments.tempo.xyz/v1/chat/completions \
  -X POST \
  --json '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Explain quantum computing in one sentence"}]
  }'
```

### Anthropic messages

```bash
presto query https://anthropic.payments.tempo.xyz/v1/messages \
  -X POST \
  -H "anthropic-version: 2023-06-01" \
  --json '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Write a haiku about payments"}]
  }'
```

### fal.ai image generation

```bash
presto query https://fal.payments.tempo.xyz/fal-ai/flux/schnell \
  -X POST \
  --json '{
    "prompt": "A futuristic cityscape at sunset, cyberpunk style",
    "image_size": "landscape_16_9"
  }'
```

### Firecrawl web scraping

```bash
presto query https://firecrawl.payments.tempo.xyz/v1/scrape \
  -X POST \
  --json '{"url": "https://example.com"}'
```

### Exa search

```bash
presto query https://exa.payments.tempo.xyz/search \
  -X POST \
  --json '{"query": "latest developments in quantum computing", "num_results": 5}'
```

### ElevenLabs text-to-speech

```bash
presto query https://elevenlabs.payments.tempo.xyz/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM \
  -X POST \
  --json '{"text": "Hello, this is a test of text to speech."}' \
  -o speech.mp3
```

### Twilio SMS

```bash
presto query https://twilio.payments.tempo.xyz/Messages.json \
  -X POST \
  --json '{"To": "+1234567890", "From": "+0987654321", "Body": "Hello from MPP"}'
```

### X (Twitter) search

```bash
presto query "https://twitter.payments.tempo.xyz/2/tweets/search/recent?query=MPP%20payments"
```

## SDK integration (TypeScript)

For programmatic use, install the `mppx` SDK:

```bash
npm install mppx viem
```

### Client — automatic payment handling

```typescript
import { Mppx, tempo } from 'mppx/client'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('0x...')

// Polyfill global fetch — payments happen automatically on 402
Mppx.create({
  methods: [tempo({ account })],
})

// Use fetch as normal — MPP handles the rest
const response = await fetch('https://openai.payments.tempo.xyz/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
})
```

### Server — accept payments

```typescript
import { Mppx, tempo } from 'mppx/hono'
import { Hono } from 'hono'

const app = new Hono()

const mppx = Mppx.create({
  methods: [tempo({
    currency: '0x20c0000000000000000000000000000000000000',
    recipient: '0xYourAddress',
  })],
})

app.get('/resource', mppx.charge({ amount: '0.1' }), (c) =>
  c.json({ data: 'paid content' }),
)
```

## How MPP works

1. Client requests a resource
2. Server returns `402 Payment Required` with a Challenge in `WWW-Authenticate`
3. Client pays (on-chain stablecoin transaction on Tempo)
4. Client retries with a Credential in `Authorization`
5. Server verifies payment and returns the resource with a Receipt

All of this is handled automatically by `presto` and the `mppx` SDK.

## Resources

- Documentation: https://mpp.tempo.xyz
- Full docs for LLMs: https://mpp.tempo.xyz/llms-full.txt
- Service discovery: https://payments.tempo.xyz/discover
- presto CLI: https://github.com/tempoxyz/presto
- TypeScript SDK: https://github.com/wevm/mppx
- Python SDK: https://github.com/tempoxyz/pympay
- Rust SDK: https://github.com/tempoxyz/mpay-rs
- Protocol spec: https://github.com/tempoxyz/payment-auth-spec
- Testnet faucet: https://faucet.tempo.xyz
