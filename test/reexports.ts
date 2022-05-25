import { ethers as _ethers } from "hardhat";
import _ERC20 from "../artifacts/contracts/core/test/ERC20.sol/ERC20.json";
import _WETH9 from "../artifacts/contracts/periphery/test/WETH9.sol/WETH9.json";
import _SojoswapFactory from "../artifacts/contracts/core/SojoswapFactory.sol/SojoswapFactory.json";
import _SojoswapPair from "../artifacts/contracts/core/SojoswapPair.sol/SojoswapPair.json";
import _ISojoswapFactory from "../artifacts/contracts/core/interfaces/ISojoswapFactory.sol/ISojoswapFactory.json";
import _ISojoswapPair from "../artifacts/contracts/core/interfaces/ISojoswapPair.sol/ISojoswapPair.json";

import _SojoswapRouter from "../artifacts/contracts/periphery/SojoswapRouter.sol/SojoswapRouter.json";
import _RouterEventEmitter from "../artifacts/contracts/periphery/test/RouterEventEmitter.sol/RouterEventEmitter.json";

import { waffle } from "hardhat";
export const ethers = _ethers;
export const bigNumberify = ethers.BigNumber.from;
export const ERC20 = _ERC20;
export const SojoswapFactory = _SojoswapFactory;
export const SojoswapPair = _SojoswapPair;

export const myProvider = waffle.provider;

export const MaxUint256 = ethers.constants.MaxUint256;
export const AddressZero = ethers.constants.AddressZero;

// export const deployContract = _deployContract
// export const solidity = _solidity
// export const createFixtureLoader = _createFixtureLoader

export const deployContract = waffle.deployContract;
export const solidity = waffle.solidity;
export const createFixtureLoader = waffle.createFixtureLoader;

export const ISojoswapFactory = _ISojoswapFactory;
export const ISojoswapPair = _ISojoswapPair;
export const SojoswapRouter = _SojoswapRouter;
export const WETH9 = _WETH9;

export const RouterEventEmitter = _RouterEventEmitter;

export const myChainId = 31337;
