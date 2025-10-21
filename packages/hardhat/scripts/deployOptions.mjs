 import { spawn } from "node:child_process";
 import readline from "node:readline";

(async () => {
  // First prompt for selecting networks including an "others" option

  if (process.argv.includes("--network-options")) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const ask = q => new Promise(resolve => rl.question(q, ans => resolve(ans)));

    console.log("Select network(s) to deploy (comma-separated indices):");
    const menu = [
      "[1] Hardhat (local testnet)",
      "[2] OP Sepolia",
      "[3] Base Sepolia",
      "[4] Zora Sepolia",
      "[5] Lisk Sepolia",
      "[6] Mode Sepolia",
      "[7] All the above",
      "[8] Others (specify)",
    ];
    for (const line of menu) console.log(line);

    const selRaw = await ask("Enter selection: ");
    let picks = selRaw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const mapIdx = idx => ({
      "1": "hardhat",
      "2": "optimismSepolia",
      "3": "baseSepolia",
      "4": "zoraSepolia",
      "5": "liskSepolia",
      "6": "modeSepolia",
      "7": "all",
      "8": "others",
    }[idx]);

    let selectedNetworks = picks
      .map(mapIdx)
      .filter(Boolean);

    let allNetworks = ["hardhat", "optimismSepolia", "baseSepolia", "zoraSepolia", "liskSepolia", "modeSepolia"];

    // Check if "all the above" is selected
    if (selectedNetworks.includes("all")) {
      selectedNetworks = allNetworks;
    }

    // Check if "others" is selected and prompt for input
    if (selectedNetworks.includes("others")) {
      const otherNetworks = await ask(
        "Enter the network separated by commas (i.e. optimism, base). You can check network names in hardhat.config.js: "
      );

      // Remove "others" from selected networks and add the user specified networks
      selectedNetworks = selectedNetworks
        .filter(n => n !== "others")
        .concat(otherNetworks.split(",").map(n => n.trim()).filter(Boolean));
    }

    rl.close();

    // Deployment logic remains the same
    for (const network of selectedNetworks) {
      console.log(`Deploying to ${network}...`);
      await new Promise((resolve, reject) => {
        const cp = spawn("yarn", ["hardhat", "deploy", "--network", network], { stdio: "inherit", shell: true });
        cp.on("exit", code => (code === 0 ? resolve() : reject(new Error(`hardhat deploy failed with code ${code}`))));
      });
    }
  } else {
    // If "--network-options" was not provided, directly call "hardhat deploy" without network options
    const args = process.argv.slice(2).filter(arg => arg !== "--network-options");

    console.log(`Deploying with provided CLI arguments to`, args[1]);
    await new Promise((resolve, reject) => {
      const cp = spawn("yarn", ["hardhat", "deploy", ...args], { stdio: "inherit", shell: true });
      cp.on("exit", code => (code === 0 ? resolve() : reject(new Error(`hardhat deploy failed with code ${code}`))));
    });
  }
})();
