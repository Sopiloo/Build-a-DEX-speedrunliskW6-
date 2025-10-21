import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Single-pool deploy for ConcentratedDEX (v3-lite)
// Uses existing MyToken and SimpleUSDC as token0/token1
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get, log } = hre.deployments;
  const { ethers } = hre;

  // Reuse existing token deployments
  const token0 = await get("MyToken");
  const token1 = await get("SimpleUSDC");

  const feeBps = 30; // 0.30%
  const tickSpacing = 100; // coarse grid

  const deployment = await deploy("ConcentratedDEX", {
    from: deployer,
    args: [token0.address, token1.address, feeBps, tickSpacing],
    log: true,
    autoMine: true,
    skipIfAlreadyDeployed: true,
  });

  // Initialize default price if just deployed
  if (deployment.newlyDeployed) {
    const pool = await ethers.getContractAt("ConcentratedDEX", deployment.address);
    // sqrtPriceX96 = 1.0 in Q96 format = 2**96, tick = 0 (demo)
    const sqrtPriceX96 = (1n << 96n);
    const tx = await pool.initialize(sqrtPriceX96, 0);
    await tx.wait();
    log(`ConcentratedDEX initialized at ${deployment.address} with sqrtPriceX96=${sqrtPriceX96.toString()}`);
  } else {
    log(`ConcentratedDEX already deployed at ${deployment.address}`);
  }
};

export default func;
func.tags = ["ConcentratedDEX"];
