import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployNFTMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, getOrNull } = hre.deployments;

  // Get the deployed MyNFT contract address
  const myNFT = await getOrNull("MyNFT");
  if (!myNFT) {
    console.log("Skipping NFTMarketplace deployment: MyNFT not found yet");
    return;
  }

  await deploy("NFTMarketplace", {
    from: deployer,
    args: [myNFT.address],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });
};

export default deployNFTMarketplace;
deployNFTMarketplace.tags = ["NFTMarketplace"];
// Do not declare dependencies here for live networks; rely on numbering or explicit --tags
