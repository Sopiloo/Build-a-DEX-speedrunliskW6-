import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Ensure MyNFT is deployed and use its address
  const myNft = await get("MyNFT");

  await deploy("NFTMarketplace", {
    from: deployer,
    args: [myNft.address],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ["NFTMarketplace"];
// Always skip this duplicate deploy (use 04_deploy_marketplace.ts instead)
func.skip = async () => true;
