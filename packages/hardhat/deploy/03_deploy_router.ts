import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre as any;
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  // Ensure factory exists
  const factory = await get("DEXFactory");

  const currentNonce: number = await ethers.provider.getTransactionCount(deployer, "latest");

  await deploy("DEXRouter", {
    from: deployer,
    args: [factory.address],
    log: true,
    autoMine: true,
    nonce: currentNonce,
  });
};

export default func;
func.tags = ["DEXRouter"];
func.dependencies = ["DEXFactory"];
