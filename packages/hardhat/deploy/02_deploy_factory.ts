import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFactory: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, getOrNull } = hre.deployments;

  // Optionally log existing deployments if present (not required for factory)
  const myToken = await getOrNull("MyToken");
  const simpleUSDC = await getOrNull("SimpleUSDC");
  const dex = await getOrNull("SimpleDEX");

  console.log("Existing deployments (optional):");
  if (myToken) console.log("  MyToken:", myToken.address);
  if (simpleUSDC) console.log("  SimpleUSDC:", simpleUSDC.address);
  if (dex) console.log("  SimpleDEX:", dex.address);

  await deploy("DEXFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployFactory;
deployFactory.tags = ["DEXFactory"];
