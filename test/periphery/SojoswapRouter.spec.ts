import chai, { expect } from "chai";
import { BigNumber, BigNumberish, Contract, ethers } from "ethers";
import { v2Fixture } from "./shared/fixtures";
import {
  expandTo18Decimals,
  getApprovalDigest,
  MINIMUM_LIQUIDITY,
} from "./shared/utilities";

import DeflatingERC20 from "../../artifacts/contracts/periphery/test/DeflatingERC20.sol/DeflatingERC20.json";
import { ecsign } from "ethereumjs-util";
import {
  bigNumberify,
  createFixtureLoader,
  deployContract,
  ISojoswapPair,
  MaxUint256,
  myProvider,
} from "../reexports";

const overrides = {
  gasLimit: 99_999_999,
};

describe("SojoswapRouter", () => {
  const provider = myProvider;
  const [wallet] = provider.getWallets();
  const loadFixture = createFixtureLoader([wallet], provider);

  let token0: Contract;
  let token1: Contract;
  let router: Contract;
  beforeEach(async function () {
    const fixture = await loadFixture(v2Fixture);
    token0 = fixture.token0;
    token1 = fixture.token1;
    router = fixture.router02;
  });

  it("pyable", async () => {
    expect(
      await router.quote(bigNumberify(1), bigNumberify(100), bigNumberify(200))
    ).to.eq(bigNumberify(2));
    expect(
      await router.quote(bigNumberify(2), bigNumberify(200), bigNumberify(100))
    ).to.eq(bigNumberify(1));
    await expect(
      router.quote(bigNumberify(0), bigNumberify(100), bigNumberify(200))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_AMOUNT");
    await expect(
      router.quote(bigNumberify(1), bigNumberify(0), bigNumberify(200))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_LIQUIDITY");
    await expect(
      router.quote(bigNumberify(1), bigNumberify(100), bigNumberify(0))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_LIQUIDITY");
  });

  it("getAmountOut", async () => {
    expect(
      await router.getAmountOut(
        bigNumberify(2),
        bigNumberify(100),
        bigNumberify(100)
      )
    ).to.eq(bigNumberify(1));
    await expect(
      router.getAmountOut(bigNumberify(0), bigNumberify(100), bigNumberify(100))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_INPUT_AMOUNT");
    await expect(
      router.getAmountOut(bigNumberify(2), bigNumberify(0), bigNumberify(100))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_LIQUIDITY");
    await expect(
      router.getAmountOut(bigNumberify(2), bigNumberify(100), bigNumberify(0))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_LIQUIDITY");
  });

  it("getAmountIn", async () => {
    expect(
      await router.getAmountIn(
        bigNumberify(1),
        bigNumberify(100),
        bigNumberify(100)
      )
    ).to.eq(bigNumberify(2));
    await expect(
      router.getAmountIn(bigNumberify(0), bigNumberify(100), bigNumberify(100))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
    await expect(
      router.getAmountIn(bigNumberify(1), bigNumberify(0), bigNumberify(100))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_LIQUIDITY");
    await expect(
      router.getAmountIn(bigNumberify(1), bigNumberify(100), bigNumberify(0))
    ).to.be.revertedWith("SojoswapLibrary: INSUFFICIENT_LIQUIDITY");
  });

  it("getAmountsOut", async () => {
    await token0.approve(router.address, MaxUint256);
    await token1.approve(router.address, MaxUint256);
    await router.addLiquidity(
      token0.address,
      token1.address,
      bigNumberify(10000),
      bigNumberify(10000),
      0,
      0,
      wallet.address,
      MaxUint256,
      overrides
    );
    await expect(
      router.getAmountsOut(bigNumberify(2), [token0.address])
    ).to.be.revertedWith("SojoswapLibrary: INVALID_PATH");
    const path = [token0.address, token1.address];
    expect(await router.getAmountsOut(bigNumberify(2), path)).to.deep.eq([
      bigNumberify(2),
      bigNumberify(1),
    ]);
  });

  it("getAmountsIn", async () => {
    await token0.approve(router.address, MaxUint256);
    await token1.approve(router.address, MaxUint256);
    await router.addLiquidity(
      token0.address,
      token1.address,
      bigNumberify(10000),
      bigNumberify(10000),
      0,
      0,
      wallet.address,
      MaxUint256,
      overrides
    );

    await expect(
      router.getAmountsIn(bigNumberify(1), [token0.address])
    ).to.be.revertedWith("SojoswapLibrary: INVALID_PATH");
    const path = [token0.address, token1.address];
    expect(await router.getAmountsIn(bigNumberify(1), path)).to.deep.eq([
      bigNumberify(2),
      bigNumberify(1),
    ]);
  });
});

describe("fee-on-transfer tokens", () => {
  const provider = myProvider;
  const [wallet] = provider.getWallets();
  const loadFixture = createFixtureLoader([wallet], provider);

  let DTT: Contract;
  let WETH: Contract;
  let router: Contract;
  let pair: Contract;
  beforeEach(async function () {
    const fixture = await loadFixture(v2Fixture);

    WETH = fixture.WETH;
    router = fixture.router02;

    DTT = await deployContract(wallet, DeflatingERC20, [
      expandTo18Decimals(10000),
    ]);
    // make a DTT<>WETH pair
    await fixture.factoryV2.createPair(DTT.address, WETH.address);
    const pairAddress = await fixture.factoryV2.getPair(
      DTT.address,
      WETH.address
    );
    pair = new Contract(
      pairAddress,
      JSON.stringify(ISojoswapPair.abi),
      provider
    ).connect(wallet);
  });

  afterEach(async function () {
    expect(await provider.getBalance(router.address)).to.eq(0);
    expect(await WETH.balanceOf(router.address)).to.eq(0);
  });

  async function addLiquidity(DTTAmount: BigNumber, WETHAmount: BigNumber) {
    await DTT.approve(router.address, MaxUint256);
    await router.addLiquidityETH(
      DTT.address,
      DTTAmount,
      DTTAmount,
      WETHAmount,
      wallet.address,
      MaxUint256,
      {
        ...overrides,
        value: WETHAmount,
      }
    );
  }

  it("removeLiquidityETHSupportingFeeOnTransferTokens", async () => {
    const DTTAmount = expandTo18Decimals(1);
    const ETHAmount = expandTo18Decimals(4);
    await addLiquidity(DTTAmount, ETHAmount);

    const DTTInPair = await DTT.balanceOf(pair.address);
    const WETHInPair = await WETH.balanceOf(pair.address);
    const liquidity = await pair.balanceOf(wallet.address);
    const totalSupply = await pair.totalSupply();
    const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
    const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply);

    await pair.approve(router.address, MaxUint256);
    await expect(
      router.removeLiquidityETHSupportingFeeOnTransferTokens(
        DTT.address,
        liquidity,
        NaiveDTTExpected,
        WETHExpected,
        wallet.address,
        MaxUint256
      )
    ).to.not.be.reverted;
  });

  it("removeLiquidityETHWithPermitSupportingFeeOnTransferTokens", async () => {
    const DTTAmount = expandTo18Decimals(1).mul(100).div(99);
    const ETHAmount = expandTo18Decimals(4);
    await addLiquidity(DTTAmount, ETHAmount);

    const expectedLiquidity = expandTo18Decimals(2);

    const nonce = await pair.nonces(wallet.address);
    const digest = await getApprovalDigest(
      pair,
      {
        owner: wallet.address,
        spender: router.address,
        value: expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      },
      nonce,
      MaxUint256
    );
    const { v, r, s } = ecsign(
      Buffer.from(digest.slice(2), "hex"),
      Buffer.from(wallet.privateKey.slice(2), "hex")
    );

    const DTTInPair = await DTT.balanceOf(pair.address);
    const WETHInPair = await WETH.balanceOf(pair.address);
    const liquidity = await pair.balanceOf(wallet.address);
    const totalSupply = await pair.totalSupply();
    const NaiveDTTExpected = DTTInPair.mul(liquidity).div(totalSupply);
    const WETHExpected = WETHInPair.mul(liquidity).div(totalSupply);

    await expect(pair.approve(router.address, MaxUint256)).to.not.be.reverted;
    await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      DTT.address,
      liquidity,
      NaiveDTTExpected,
      WETHExpected,
      wallet.address,
      MaxUint256,
      false,
      v,
      r,
      s,
      overrides
    );
  });

  describe("swapExactTokensForTokensSupportingFeeOnTransferTokens", () => {
    const DTTAmount = expandTo18Decimals(5).mul(100).div(99);
    const ETHAmount = expandTo18Decimals(10);
    const amountIn = expandTo18Decimals(1);

    beforeEach(async () => {
      await addLiquidity(DTTAmount, ETHAmount);
    });

    it("DTT -> WETH", async () => {
      await DTT.approve(router.address, MaxUint256);

      await expect(
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountIn,
          0,
          [DTT.address, WETH.address],
          wallet.address,
          MaxUint256
        )
      ).to.not.be.reverted;
    });

    // WETH -> DTT
    it("WETH -> DTT", async () => {
      await WETH.deposit({ value: amountIn }); // mint WETH
      await WETH.approve(router.address, MaxUint256);

      await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [WETH.address, DTT.address],
        wallet.address,
        MaxUint256
      );
    });
  });

  // ETH -> DTT
  it("swapExactETHForTokensSupportingFeeOnTransferTokens", async () => {
    const DTTAmount = expandTo18Decimals(10).mul(100).div(99);
    const ETHAmount = expandTo18Decimals(5);
    const swapAmount = expandTo18Decimals(1);
    await addLiquidity(DTTAmount, ETHAmount);

    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [WETH.address, DTT.address],
      wallet.address,
      MaxUint256,
      {
        ...{},
        value: swapAmount,
      }
    );
  });

  // DTT -> ETH
  it("swapExactTokensForETHSupportingFeeOnTransferTokens", async () => {
    const DTTAmount = expandTo18Decimals(5).mul(100).div(99);
    const ETHAmount = expandTo18Decimals(10);
    const swapAmount = expandTo18Decimals(1);

    await addLiquidity(DTTAmount, ETHAmount);
    await DTT.approve(router.address, MaxUint256);

    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      swapAmount,
      0,
      [DTT.address, WETH.address],
      wallet.address,
      MaxUint256
    );
  });
});

describe("fee-on-transfer tokens: reloaded", () => {
  const provider = myProvider;
  const [wallet] = provider.getWallets();
  const loadFixture = createFixtureLoader([wallet], provider);

  let DTT: Contract;
  let DTT2: Contract;
  let router: Contract;
  beforeEach(async function () {
    const fixture = await loadFixture(v2Fixture);

    router = fixture.router02;

    DTT = await deployContract(wallet, DeflatingERC20, [
      expandTo18Decimals(10000),
    ]);
    DTT2 = await deployContract(wallet, DeflatingERC20, [
      expandTo18Decimals(10000),
    ]);

    // make a DTT<>WETH pair
    await fixture.factoryV2.createPair(DTT.address, DTT2.address, overrides);
    const pairAddress = await fixture.factoryV2.getPair(
      DTT.address,
      DTT2.address
    );
  });

  afterEach(async function () {
    expect(await provider.getBalance(router.address)).to.eq(0);
  });

  async function addLiquidity(DTTAmount: BigNumber, DTT2Amount: BigNumber) {
    await DTT.approve(router.address, MaxUint256);
    await DTT2.approve(router.address, MaxUint256);
    //TODO: this function does not work
    await router.addLiquidity(
      DTT.address,
      DTT2.address,
      DTTAmount,
      DTT2Amount,
      DTTAmount,
      DTT2Amount,
      wallet.address,
      MaxUint256,
      overrides
    );
  }

  describe("swapExactTokensForTokensSupportingFeeOnTransferTokens", () => {
    const DTTAmount = expandTo18Decimals(5).mul(100).div(99);
    const DTT2Amount = expandTo18Decimals(5);
    const amountIn = expandTo18Decimals(1);

    beforeEach(async () => {
      await addLiquidity(DTTAmount, DTT2Amount);
    });

    it("DTT -> DTT2", async () => {
      await DTT.approve(router.address, MaxUint256);

      await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        0,
        [DTT.address, DTT2.address],
        wallet.address,
        MaxUint256
      );
    });
  });
});

describe("taxes", () => {
  let router:Contract;
  let WETH:Contract;
  let WETHPartner:Contract;
  const amt = ethers.utils.parseEther("1.0");
  const provider = myProvider;
  const [wallet] = provider.getWallets();
  const loadFixture = createFixtureLoader([wallet], provider);
  let expectedTax: BigNumber;
  let ethIn:[string,string];
  let ethOut:[string,string];
  let feeTo: string;
  let expectedTaxFunction: (arg0: BigNumberish) => BigNumber

  let runSwapExpectEth = async (fn: (amountTokens:BigNumber, amountEth:BigNumber)=>Promise<void>) => {
    let amountTokens:BigNumber = (await router.getAmountsIn(amt, ethOut))[0]
    await fn(amountTokens, amt)
    const actual = await provider.getBalance(feeTo)
    const expected = expectedTaxFunction(amt)
    const bigger = actual.gte(expected) ? actual : expected
    const smaller = actual.gte(expected) ? expected : actual
    const diff = bigger.sub(smaller)
    const delta = ethers.utils.parseEther("0.00001")
    expect(diff.lte(delta), `Actual: ${actual.toString()}; Expected: ${expected.toString()}; Difference: ${ethers.utils.formatEther(diff.toString())}; Difference above delta threshold (${ethers.utils.formatEther(delta)} ETH)`).to.be.true
    expect(await provider.getBalance(router.address)).to.equal(0)
  }
  let runSwapExpectTokens = async (fn: (amountEth:BigNumber, amountTokens:BigNumber)=>Promise<void>) => {
    let amountEth:BigNumber = (await router.getAmountsIn(100, ethIn))[0]
    await fn(BigNumber.from(100), amountEth)
    const actual = await provider.getBalance(feeTo)
    const expected = expectedTaxFunction(amountEth)
    const bigger = actual.gte(expected) ? actual : expected
    const smaller = actual.gte(expected) ? expected : actual
    const diff = bigger.sub(smaller)
    const delta = ethers.utils.parseEther("0.00001")
    expect(diff.lte(delta), `Actual: ${actual.toString()}; Expected: ${expected.toString()}; Difference: ${ethers.utils.formatEther(diff.toString())}; Difference above delta threshold (${ethers.utils.formatEther(delta)} ETH)`).to.be.true
    expect(await provider.getBalance(router.address)).to.equal(0)
  }

  beforeEach(async () => {
    const fixture = await loadFixture(v2Fixture);
    router = fixture.router02;
    WETH = fixture.WETH;
    WETHPartner = fixture.WETHPartner;
    expectedTax = fixture.calculateReceivedTaxes(amt);
    await WETH.deposit({value: amt.mul(10)})
    await WETH.approve(router.address, MaxUint256)
    await WETHPartner.approve(router.address, MaxUint256)
    await router.addLiquidity(
      WETH.address,
      WETHPartner.address,
      amt.mul(5),
      10000,
      0,
      0,
      wallet.address,
      MaxUint256,
      overrides
    );
    ethIn = [WETH.address, WETHPartner.address]
    ethOut = [WETHPartner.address, WETH.address]
    feeTo = fixture.feeToAddress;
    expectedTaxFunction = fixture.calculateReceivedTaxes
  })

  it('swapExactETHForTokens', async () => {
    await runSwapExpectTokens((_, amount) => router.swapExactETHForTokens(0, ethIn, wallet.address, MaxUint256, {value: amount}))
  })

  it('swapExactETHForTokensSupportingFeeOnTransferTokens', async () => {
    await runSwapExpectTokens((_, amount) => router.swapExactETHForTokensSupportingFeeOnTransferTokens(0, ethIn, wallet.address, MaxUint256, {value: amount}))
  })

  it('swapTokensForExactETH', async () => {
    await runSwapExpectEth((_, amountIn) => router.swapTokensForExactETH(amountIn, MaxUint256, ethOut, wallet.address, MaxUint256))
  })

  it('swapExactTokensForETHSupportingFeeOnTransferTokens', async () => {
    await runSwapExpectEth((amountIn) => router.swapExactTokensForETHSupportingFeeOnTransferTokens(amountIn, 0, ethOut, wallet.address, MaxUint256))
  })
  it('swapETHForExactTokens', async () => {
    await runSwapExpectTokens((amountOut, amount) => router.swapETHForExactTokens(amountOut, ethIn, wallet.address, MaxUint256,{value: amount.add(expectedTaxFunction(amount)), gasLimit: 30_000_000}))
  })
})
