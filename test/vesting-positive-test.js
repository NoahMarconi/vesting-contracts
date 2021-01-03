const chai = require("chai");
const { ethers, waffle } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { returnVestingSchedule } = require("../utils/utils");
chai.use(waffle.solidity);
const { expect, assert } = chai;

describe("vesting -positive", function () {
  let owner, alice, bob, token, vesting;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    Contract = await ethers.getContractFactory("MockCakeToken");
    token = await Contract.deploy("cake", "cake");
    Contract = await ethers.getContractFactory("VestingWallet");
    vesting = await Contract.deploy(token.address);

    const latestBlock = await ethers.provider.getBlock("latest");
    blockTime = latestBlock.timestamp;

    const startTime = blockTime;
    const cliffTime = blockTime + 500;
    const endTime = blockTime + 1000;
    const totalAmount = 1 * 1e18;
    const balanceOfOwner = await token.balanceOf(owner.address);
    await token.approve(vesting.address, balanceOfOwner);

    await vesting.registerVestingSchedule(
      alice.address,
      owner.address,
      startTime,
      cliffTime,
      endTime,
      totalAmount.toString()
    );

    await vesting
      .connect(alice)
      .confirmVestingSchedule(
        startTime,
        cliffTime,
        endTime,
        totalAmount.toString()
      );
  });

  it("registers and confirm vesting schedule", async function () {
    const latestBlock = await ethers.provider.getBlock("latest");
    blockTime = latestBlock.timestamp;

    const startTime = blockTime;
    const cliffTime = blockTime + 500;
    const endTime = blockTime + 1000;
    const totalAmount = 1 * 1e18;

    await expect(
      vesting.registerVestingSchedule(
        bob.address,
        owner.address,
        startTime,
        cliffTime,
        endTime,
        totalAmount.toString()
      )
    )
      .to.emit(vesting, "VestingScheduleRegistered")
      .withArgs(
        bob.address,
        owner.address,
        startTime.toString(),
        cliffTime.toString(),
        endTime.toString(),
        totalAmount.toString()
      );

    const vestingStruct = await vesting.schedules(bob.address);

    const vestingData = returnVestingSchedule(vestingStruct);
    const mockData = {
      startTimeInSec: startTime.toString(),
      cliffTimeInSec: cliffTime.toString(),
      endTimeInSec: endTime.toString(),
      totalAmount: totalAmount.toString(),
      totalAmountWithdrawn: "0",
      depositor: owner.address,
      isConfirmed: false,
    };
    assert.deepEqual(mockData, vestingData, "entries should match");

    await expect(
      vesting
        .connect(bob)
        .confirmVestingSchedule(
          startTime,
          cliffTime,
          endTime,
          totalAmount.toString()
        )
    )
      .to.emit(vesting, "VestingScheduleConfirmed")
      .withArgs(
        bob.address,
        owner.address,
        startTime.toString(),
        cliffTime.toString(),
        endTime.toString(),
        totalAmount.toString()
      );

    mockData.isConfirmed = true;

    const vestingStructConfirmed = await vesting.schedules(bob.address);

    const vestingDataConfirmed = returnVestingSchedule(vestingStructConfirmed);

    assert.deepEqual(mockData, vestingDataConfirmed, "entries should match");
  });

  it("registers a withdraw 3/4 the amount after the cliff", async function () {
    ethers.provider.send("evm_increaseTime", [750]);
    ethers.provider.send("evm_mine");
    const aliceBalanceBefore = await token.balanceOf(alice.address);

    assert(aliceBalanceBefore.isZero(), "alice should have 0 balance");

    await vesting.connect(alice).withdraw();

    const aliceBalanceAfter = await token.balanceOf(alice.address);

    assert.closeTo(
      Number(aliceBalanceAfter),
      Number(0.75 * 1e18),
      Number(0.01 * 1e18)
    );
  });

  it("registers a withdraw full amount", async function () {
    ethers.provider.send("evm_increaseTime", [1001]);
    ethers.provider.send("evm_mine");
    const aliceBalanceBefore = await token.balanceOf(alice.address);

    assert(aliceBalanceBefore.isZero(), "alice should have 0 balance");

    const totalAmount = 1 * 1e18;
    await expect(vesting.connect(alice).withdraw())
      .to.emit(vesting, "Withdrawal")
      .withArgs(alice.address, totalAmount.toString());

    const aliceBalanceAfter = await token.balanceOf(alice.address);

    assert.equal(
      aliceBalanceAfter.toString(),
      totalAmount.toString(),
      "full balance should have been removed"
    );
  });
});
