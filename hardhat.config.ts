import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { NetworksUserConfig } from "hardhat/types";
import { ethers } from "ethers";
import abi from 'ethereumjs-abi'
dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("verifyContracts", async (taskArgs, hre) => {
  const { ethers } = hre
  const factoryContract = "0x538Dcb825Dd299908770CCF8aA2625CED21DC9Cd"
  const routerContract = "0x86773D8CB127DCf9e29b25BE58086bcC301326C0"
  const deployerWalletAddress = "0x82b5505F57E7B67867480378dC12D3523408201C"
  const WETH = [
    {
      "chainId": 1,
      "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    },
    {
      "chainId": 3,
      "address": "0xc778417E063141139Fce010982780140Aa0cD5Ab"
    },
    {
      "chainId": 4,
      "address": "0xc778417E063141139Fce010982780140Aa0cD5Ab"
    },
    {
      "chainId": 5,
      "address": "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
    },
    {
      "chainId": 42,
      "address": "0xd0A1E359811322d97991E03f863a0C30C2cF029C"
    }
  ];
  console.log("Verifying on chain", hre.network.config.chainId)
  const myWeth = WETH.filter((x) => x.chainId == (hre.network.config.chainId))[0]
  if (!myWeth) {
    throw "bad chain"
  }
  await hre.run("verify:verify", {
    address: factoryContract,
    constructorArguments: [
      deployerWalletAddress
    ],
  }).catch(console.error)
  await hre.run("verify:verify", {
    address: routerContract,
    constructorArguments: [
      factoryContract,
      myWeth.address
    ],
  }).catch(console.error)

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
          "*": [
            "evm.bytecode",
            "evm.deployedBytecode",
            "devdoc",
            "userdoc",
            "metadata",
            "abi"
          ]
        }
      },
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  };
};

const generateNetworkConfig = () => {
  let ret: NetworksUserConfig = {
    hardhat: {
      blockGasLimit: 99999999,
      accounts: {
        mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
      },
      hardfork: "istanbul",
    },
  };



  ["rinkeby", "ropsten", "goerli", "kovan", "mainnet"].map((x) => {
    ret[x] = {
      url: `https://${x}.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: ethers.providers.getNetwork(x).chainId
    }
  })
  return ret
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      generateCompilerConfig("0.6.6")
    ],
  },
  networks: generateNetworkConfig(),

  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      kovan: process.env.ETHERSCAN_API_KEY,
    },
  },
};

export default config;
