# Crypto Payment Gateway

Self-contained crypto payment gateway for accepting ERC-20 payments (USDC / USDT) on Ethereum. It ships as a single Docker image with the API and web UI, and supports [EIP-681](https://eips.ethereum.org/EIPS/eip-681) for auto-opening mobile wallets and QR codes for quick payment.


Supports **Sepolia** for testing and **mainnet** for production.

## How to start

Pull the image from Docker Hub and run it with Docker Compose.

Example `docker-compose.app.yml`:

```yaml
services:
  app:
    image: crypto-payment-gateway:latest
    container_name: crypto-payment-gateway-app
    environment:
      ENV: sepolia
      PHRASE: "material toward work rib online drive pear word still robot kid man phrase here"
      API_KEY: "test"
      ETHERSCAN_API_KEY: "your_etherscan_api_key"
    ports:
      - "7272:80"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
    name: crypto_payment_gateway_pg
```

> [!IMPORTANT]
> Get `ETHERSCAN_API_KEY` from [etherscan.io/myapikey](https://etherscan.io/myapikey). The free tier (100k calls/day) is fair enough.

### Production setup

Rules for production:

1. Set `ENV=mainnet`.
2. Use a **new** mnemonic for `PHRASE`. Do not reuse a Sepolia / test phrase — it controls the wallets that receive funds. Treat those wallets as an intermediary only: do not leave all your money there — systematically withdraw profits to a separate, secret cold (or otherwise offline) address.
3. Set a strong random `API_KEY`. The process refuses to start on mainnet without one.

> [!CAUTION]
> Once the database has been initialized with a given `PHRASE`, changing that mnemonic will prevent the container from starting. This guards against a logic error where the database would hold transfer history for different account addresses than the ones derived from the current mnemonic. To run with a new mnemonic, change the Postgres volume name (e.g. `crypto_payment_gateway_pg-2` in the compose file) so Docker creates a fresh database. 

