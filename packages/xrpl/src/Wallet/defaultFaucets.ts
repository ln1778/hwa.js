import type { Client } from '../client'
import { XRPLFaucetError } from '../errors'

export interface FaucetWallet {
  account: {
    xAddress: string
    classicAddress?: string
    secret: string
  }
  amount: number
  balance: number
}

export enum FaucetNetwork {
  Testnet = 'faucet.altnet.rippletest.net',
  Devnet = 'faucet.devnet.rippletest.net',
  AMMDevnet = 'ammfaucet.devnet.rippletest.net',
  NFTDevnet = 'faucet-nft.ripple.com',
  HooksV2Testnet = 'hooks-testnet-v2.xrpl-labs.com',
}

export const FaucetNetworkPaths: Record<string, string> = {
  [FaucetNetwork.Testnet]: '/accounts',
  [FaucetNetwork.Devnet]: '/accounts',
  [FaucetNetwork.AMMDevnet]: '/accounts',
  [FaucetNetwork.NFTDevnet]: '/accounts',
  [FaucetNetwork.HooksV2Testnet]: '/accounts',
}

/**
 * Get the faucet host based on the Client connection.
 *
 * @param client - Client.
 * @returns A {@link FaucetNetwork}.
 * @throws When the client url is not on altnet or devnet.
 */
export function getFaucetHost(client: Client): FaucetNetwork | undefined {
  const connectionUrl = client.url

  if (connectionUrl.includes('hooks-testnet-v2')) {
    return FaucetNetwork.HooksV2Testnet
  }

  // 'altnet' for Ripple Testnet server and 'testnet' for XRPL Labs Testnet server
  if (connectionUrl.includes('altnet') || connectionUrl.includes('testnet')) {
    return FaucetNetwork.Testnet
  }

  if (connectionUrl.includes('amm')) {
    return FaucetNetwork.AMMDevnet
  }

  if (connectionUrl.includes('devnet')) {
    return FaucetNetwork.Devnet
  }

  // TODO: Remove this once the sandbox is fully decomissioned.
  if (connectionUrl.includes('xls20-sandbox')) {
    return FaucetNetwork.NFTDevnet
  }

  throw new XRPLFaucetError('Faucet URL is not defined or inferrable.')
}

/**
 * Get the faucet pathname based on the faucet hostname.
 *
 * @param hostname - hostname.
 * @returns A String with the correct path for the input hostname.
 * If hostname undefined or cannot find (key, value) pair in {@link FaucetNetworkPaths}, defaults to '/accounts'
 */
export function getDefaultFaucetPath(hostname: string | undefined): string {
  if (hostname === undefined) {
    return '/accounts'
  }
  return FaucetNetworkPaths[hostname] || '/accounts'
}
