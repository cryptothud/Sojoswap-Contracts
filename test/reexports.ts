import { MockProvider } from "@ethereum-waffle/provider";
import { ethers as _ethers } from "hardhat";
import { deployContract as _deployContract, solidity as _solidity, createFixtureLoader as _createFixtureLoader } from "ethereum-waffle";

import _ERC20 from '../artifacts/contracts/core/test/ERC20.sol/ERC20.json'
import _WETH9 from "../artifacts/contracts/periphery/test/WETH9.sol/WETH9.json"
import _UniswapV2Factory from '../artifacts/contracts/core/UniswapV2Factory.sol/UniswapV2Factory.json'
import _UniswapV2Pair from '../artifacts/contracts/core/UniswapV2Pair.sol/UniswapV2Pair.json'
import _IUniswapV2Factory from "../artifacts/contracts/core/interfaces/IUniswapV2Factory.sol/IUniswapV2Factory.json";
import _IUniswapV2Pair from "../artifacts/contracts/core/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json";

import _UniswapV2Router02 from "../artifacts/contracts/periphery/UniswapV2Router02.sol/UniswapV2Router02.json"
import _RouterEventEmitter from "../artifacts/contracts/periphery/test/RouterEventEmitter.sol/RouterEventEmitter.json"

import {waffle} from 'hardhat'
export const ethers = _ethers
export const bigNumberify = ethers.BigNumber.from
export const ERC20 = _ERC20
export const UniswapV2Factory = _UniswapV2Factory
export const UniswapV2Pair = _UniswapV2Pair

export const myProvider = new MockProvider({
    ganacheOptions: {
        hardfork: 'istanbul',
        mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
        gasLimit: 9999999
    }
})

export const MaxUint256 = ethers.constants.MaxUint256
export const AddressZero = ethers.constants.AddressZero

// export const deployContract = _deployContract
// export const solidity = _solidity
// export const createFixtureLoader = _createFixtureLoader

export const deployContract = waffle.deployContract
export const solidity = waffle.solidity
export const createFixtureLoader = waffle.createFixtureLoader

export const IUniswapV2Factory = _IUniswapV2Factory
export const IUniswapV2Pair = _IUniswapV2Pair
export const UniswapV2Router02 = _UniswapV2Router02
export const WETH9 = _WETH9

export const RouterEventEmitter = _RouterEventEmitter