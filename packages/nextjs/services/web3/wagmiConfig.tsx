import { createConfig } from "wagmi";
import { appChains, wagmiConnectors } from "~~/services/web3/wagmiConnectors";
import scaffoldConfig from "~~/scaffold.config";

export const wagmiConfig = createConfig({
  autoConnect: scaffoldConfig.walletAutoConnect,
  connectors: wagmiConnectors,
  publicClient: appChains.publicClient,
});
