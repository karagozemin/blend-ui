# Blend UI

An open source UI for interacting with the Blend Protocol.

## Getting Started

The Blend UI has network specific configurations and build commands, which all export the UI to `out/`.

To run the UI as a dev server, first build the UI to setup the local environment variables then run:

```bash
npm run dev
```

#### Testnet

The testnet configuration is located at `.env.testnet`. To build the testnet version, run:

```bash
npm run build:testnet
```

#### Mainnet

The mainnet configuration is located at `.env.production`. To build the mainnet version, run:

```bash
npm run build:mainnet
```

#### Standalone

It's recommended to edit the `.env.testnet` config file for any local or custom Blend deployment, then run:

```bash
npm run build:testnet
```

## IPFS Deployment

Each release gets deployed to IPFS automatically. To get the latest release, please see the [Releases page](https://github.com/blend-capital/blend-ui/releases).

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug fixes, please feel free to open an issue or submit a pull request.
