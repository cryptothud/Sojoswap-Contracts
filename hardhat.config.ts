import * as dotenv from "dotenv";

import { HardhatUserConfig, task} from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { fstatSync, write, writeFileSync } from "fs";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


task("generateInitCode", "", async (taskArgs, hre) => {
  const factory = await hre.ethers.getContractFactory("GenerateInitCodeHash")
  const contract = await factory.deploy()
  const hash = await contract.getInitHash()

  console.log("pair hash: ", hash)
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const generateCompilerConfig = (version: string) => {
  return {
    version,
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
          "": ["ast"],
        },
      },
      evmVersion: "istanbul",
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  };
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      generateCompilerConfig("0.6.6")
    ],
  },
  networks: {
    hardhat: {
      blockGasLimit: 99999999,
      accounts: {
        mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
      },
      hardfork: "istanbul",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
