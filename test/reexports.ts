import { MockProvider } from "@ethereum-waffle/provider";
import { ethers } from "hardhat";
import _ERC20 from '../artifacts/contracts/core/test/ERC20.sol/ERC20.json'
import _UniswapV2Factory from '../artifacts/contracts/core/UniswapV2Factory.sol/UniswapV2Factory.json'
import _UniswapV2Pair from '../artifacts/contracts/core/UniswapV2Pair.sol/UniswapV2Pair.json'
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