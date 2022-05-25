import { Wallet, Contract, BigNumberish, BigNumber } from "ethers";
import { expandTo18Decimals } from "./utilities";
import { Web3Provider } from "@ethersproject/providers";
import {
  deployContract,
  ERC20,
  ISojoswapPair,
  RouterEventEmitter,
  SojoswapFactory,
  SojoswapRouter,
  WETH9,
} from "../../reexports";
import { ethers } from "hardhat";
interface V2Fixture {
  token0: Contract;
  token1: Contract;
  WETH: Contract;
  WETHPartner: Contract;
  factoryV2: Contract;
  router02: Contract;
  routerEventEmitter: Contract;
  router: Contract;
  pair: Contract;
  WETHPair: Contract;
  feeToAddress: string;
  calculateReceivedTaxes: (arg0: BigNumberish) => BigNumber;
}

export async function v2Fixture(
  [wallet]: Wallet[],
  provider: Web3Provider
): Promise<V2Fixture> {
  // deploy tokens
  const feeToAddress = "0xb057d8EFc5B908aFFEbE75934D4722AEbF2D4cf0"
  const tokenA = await deployContract(wallet, ERC20, [
    expandTo18Decimals(10000),
  ]);
  const tokenB = await deployContract(wallet, ERC20, [
    expandTo18Decimals(10000),
  ]);
  const WETH = await deployContract(wallet, WETH9);
  const WETHPartner = await deployContract(wallet, ERC20, [
    expandTo18Decimals(10000),
  ]);

  // deploy V1 omitted

  // deploy V2
  const factoryV2 = await deployContract(wallet, SojoswapFactory, [
    wallet.address,
  ]);

  // deploy routers
  const router02 = await deployContract(wallet, SojoswapRouter, [
    factoryV2.address,
    WETH.address,
  ]);

  await factoryV2.setFeeTo(feeToAddress)
  await router02.connect(wallet).setTax(1000);
  const calculateReceivedTaxes = (arg0: BigNumberish) => {
    return BigNumber.from(arg0).mul(1000).div(100000);
  }

  // event emitter for testing
  const routerEventEmitter = await deployContract(
    wallet,
    RouterEventEmitter,
    []
  );

  // deploy migrator omitted

  // initialize V2
  await factoryV2.createPair(tokenA.address, tokenB.address);
  const pairAddress = await factoryV2.getPair(tokenA.address, tokenB.address);
  const pair = new ethers.Contract(
    pairAddress,
    JSON.stringify(ISojoswapPair.abi),
    provider
  ).connect(wallet);



  const token0Address = await pair.token0();
  const token0 = tokenA.address === token0Address ? tokenA : tokenB;
  const token1 = tokenA.address === token0Address ? tokenB : tokenA;

  await factoryV2.createPair(WETH.address, WETHPartner.address);
  const WETHPairAddress = await factoryV2.getPair(
    WETH.address,
    WETHPartner.address
  );
  const WETHPair = new ethers.Contract(
    WETHPairAddress,
    JSON.stringify(ISojoswapPair.abi),
    provider
  ).connect(wallet);

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
    WETHPair,
    feeToAddress,
    calculateReceivedTaxes
  };
}
