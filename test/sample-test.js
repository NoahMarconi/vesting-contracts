const chai = require("chai");
const { ethers, waffle } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");
const { returnVestingSchedule } = require("../utils/utils");
chai.use(waffle.solidity);
const { expect, assert } = chai;

describe("test vesting contract", function () {
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
    await token.approve(vesting.address, totalAmount.toString());

    await vesting.registerVestingSchedule(
      alice.address,
      owner.address,
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
});
