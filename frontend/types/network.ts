import * as StellarSdk from "@stellar/stellar-sdk";

export type NetworkType = "testnet" | "mainnet";

export interface NetworkConfig {
  network: NetworkType;
  horizonUrl: string;
  rpcUrl: string;
  passphrase: string;
}

export const NETWORKS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    network: "testnet",
    horizonUrl: process.env.NEXT_PUBLIC_TESTNET_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL ?? "https://soroban-testnet.stellar.org",
    passphrase: StellarSdk.Networks.TESTNET,
  },
  mainnet: {
    network: "mainnet",
    horizonUrl: process.env.NEXT_PUBLIC_MAINNET_HORIZON_URL ?? "https://horizon.stellar.org",
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? "https://mainnet.stellar.org:443",
    passphrase: StellarSdk.Networks.PUBLIC,
  },
};
