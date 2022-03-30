import { Wallet, Contract } from 'ethers'
import { expandTo18Decimals } from './utilities'
import {Web3Provider} from '@ethersproject/providers'
import { deployContract, ERC20, IUniswapV2Pair, RouterEventEmitter, UniswapV2Factory, UniswapV2Router02, WETH9 } from '../../reexports'

const overrides = {
  gasLimit: 9999999
}

interface V2Fixture {
  token0: Contract
  token1: Contract
  WETH: Contract
  WETHPartner: Contract
  factoryV2: Contract
  router02: Contract
  routerEventEmitter: Contract
  router: Contract
  pair: Contract
  WETHPair: Contract
}

export async function v2Fixture([wallet]: Wallet[], provider: Web3Provider): Promise<V2Fixture> {
  // deploy tokens
  const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
  const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
  const WETH = await deployContract(wallet, WETH9, [], overrides)
  const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)

  // deploy V1 omitted

  // deploy V2
  const factoryV2 = await deployContract(wallet, UniswapV2Factory, [wallet.address], overrides)

  // deploy routers
  const router02 = await deployContract(wallet, UniswapV2Router02, [factoryV2.address, WETH.address], overrides)

  // event emitter for testing
  const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [], overrides)

  // deploy migrator omitted

  // initialize V2
  await factoryV2.createPair(tokenA.address, tokenB.address, overrides)
  const pairAddress = await factoryV2.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet)

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  await factoryV2.createPair(WETH.address, WETHPartner.address, overrides)
  const WETHPairAddress = await factoryV2.getPair(WETH.address, WETHPartner.address)
  const WETHPair = new Contract(WETHPairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet)

  return {
    token0,
    token1,
    WETH,
    WETHPartner,
    factoryV2,
    router02,
    router: router02, // the default router, 01 had a minor bug
    routerEventEmitter,
    pair,
    WETHPair
  }
}
