import type { Network } from '../..';
import { address } from '../..';
import type { ChainCode } from '..';
import { outputScripts } from '..';
import type { RootWalletKeys } from './WalletKeys';
import type { SpendableScript } from '../outputScripts';
import { scriptTypeForChain } from '../outputScripts';

export function getWalletOutputScripts(keys: RootWalletKeys, chain: ChainCode, index: number): SpendableScript {
  return outputScripts.createOutputScript2of3(
    keys.deriveForChainAndIndex(chain, index).publicKeys,
    scriptTypeForChain(chain)
  );
}

export function getWalletAddress(keys: RootWalletKeys, chain: ChainCode, index: number, network: Network): string {
  return address.fromOutputScript(getWalletOutputScripts(keys, chain, index).scriptPubKey, network);
}
