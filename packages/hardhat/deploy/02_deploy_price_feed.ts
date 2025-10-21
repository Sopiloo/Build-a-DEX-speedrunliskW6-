import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployPriceFeed: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("PriceFeed", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployPriceFeed;
deployPriceFeed.tags = ["PriceFeed"];
