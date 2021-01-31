const chai = require("chai");
const { ethers, waffle } = require("hardhat");
const should = require("should");
const { returnVestingSchedule } = require("../utils/utils");
chai.use(waffle.solidity);
const { expect, assert } = chai;

describe("vesting - positive", function () {
  let owner, alice, bob, charlie, token, vesting;
  const NULL_ADDRESS = `0x${"0".repeat(40)}`;

  beforeEach(async () => {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    Contract = await ethers.getContractFactory("MockDeltaToken");
    token = await Contract.deploy("delta", "delta");
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
  it("should request an address change", async function () {
    await expect(vesting.connect(alice).requestAddressChange(charlie.address))
      .to.emit(vesting, "AddressChangeRequested")
      .withArgs(alice.address, charlie.address);

    const addressToChangeTo = await vesting.addressChangeRequests(
      alice.address
    );
    assert.equal(
      addressToChangeTo,
      charlie.address,
      "charlie should have been requested"
    );
  });
  it("should confirm an address change", async function () {
    await vesting.connect(alice).requestAddressChange(charlie.address);

    await vesting.confirmAddressChange(alice.address, charlie.address);

    const vestingSchedule = await vesting.schedules(charlie.address);

    const vestingData = returnVestingSchedule(vestingSchedule);

    const startTime = blockTime;
    const cliffTime = blockTime + 500;
    const endTime = blockTime + 1000;
    const totalAmount = 1 * 1e18;

    const mockData = {
      startTimeInSec: startTime.toString(),
      cliffTimeInSec: cliffTime.toString(),
      endTimeInSec: endTime.toString(),
      totalAmount: totalAmount.toString(),
      totalAmountWithdrawn: "0",
      depositor: owner.address,
      isConfirmed: true,
    };

    assert.deepEqual(mockData, vestingData, "entries should match");

    const addressChangeRequest = await vesting.addressChangeRequests(
      alice.address
    );

    assert.equal(
      addressChangeRequest,
      NULL_ADDRESS,
      "entry should have been deleted"
    );

    ethers.provider.send("evm_increaseTime", [750]);
    ethers.provider.send("evm_mine");

    const charlieBalanceBefore = await token.balanceOf(charlie.address);

    assert(charlieBalanceBefore.isZero(), "charlie should have 0 balance");

    await vesting.connect(charlie).withdraw();

    const charlieBalanceAfter = await token.balanceOf(charlie.address);

    assert.closeTo(
      Number(charlieBalanceAfter),
      Number(0.75 * 1e18),
      Number(0.01 * 1e18)
    );
  });
  it("should confirm an address change after cliff", async function () {
    ethers.provider.send("evm_increaseTime", [750]);
    ethers.provider.send("evm_mine");
    await vesting.connect(alice).withdraw();

    await vesting.connect(alice).requestAddressChange(charlie.address);

    await vesting.confirmAddressChange(alice.address, charlie.address);

    const vestingSchedule = await vesting.schedules(charlie.address);

    const vestingData = returnVestingSchedule(vestingSchedule);

    const startTime = blockTime;
    const cliffTime = blockTime + 500;
    const endTime = blockTime + 1000;
    const totalAmount = 1 * 1e18;

    const mockData = {
      startTimeInSec: startTime.toString(),
      cliffTimeInSec: cliffTime.toString(),
      endTimeInSec: endTime.toString(),
      totalAmount: totalAmount.toString(),
      totalAmountWithdrawn: vestingData.totalAmountWithdrawn,
      depositor: owner.address,
      isConfirmed: true,
    };

    assert.deepEqual(mockData, vestingData, "entries should match");

    ethers.provider.send("evm_increaseTime", [750]);
    ethers.provider.send("evm_mine");

    const charlieBalanceBefore = await token.balanceOf(charlie.address);

    assert(charlieBalanceBefore.isZero(), "charlie should have 0 balance");

    await vesting.connect(charlie).withdraw();

    const charlieBalanceAfter = await token.balanceOf(charlie.address);

    assert.closeTo(
      Number(charlieBalanceAfter),
      Number(0.25 * 1e18),
      Number(0.01 * 1e18)
    );
  });
  it("should end the vesting before cliff", async function () {
    await vesting.endVesting(alice.address, charlie.address);

    const deletedSchedule = await vesting.schedules(alice.address);
    const aliceSchedule = returnVestingSchedule(deletedSchedule);
    const mockData = {
      startTimeInSec: "0",
      cliffTimeInSec: "0",
      endTimeInSec: "0",
      totalAmount: "0",
      totalAmountWithdrawn: "0",
      depositor: NULL_ADDRESS,
      isConfirmed: false,
    };

    assert.deepEqual(
      aliceSchedule,
      mockData,
      "alice vesting should have been deleted"
    );
    const charlieBalanceAfter = await token.balanceOf(charlie.address);
    const totalAmount = 1 * 1e18;
    assert.equal(charlieBalanceAfter.toString(), totalAmount.toString(), "charlie should have received the tokens")

  });
  it("should end the vesting after the cliff", async function () {
    ethers.provider.send("evm_increaseTime", [750]);
    ethers.provider.send("evm_mine");

    const aliceBalanceBefore = await token.balanceOf(alice.address);

    assert(aliceBalanceBefore.isZero(), "alice should have 0 balance");

    await expect(vesting.endVesting(alice.address, charlie.address)).to.emit(vesting, "VestingEndedByOwner").withArgs(alice.address,  Number(0.754 * 1e18).toString(), Number(0.246 * 1e18).toString());

    const deletedSchedule = await vesting.schedules(alice.address);
    const aliceSchedule = returnVestingSchedule(deletedSchedule);

    const mockData = {
      startTimeInSec: "0",
      cliffTimeInSec: "0",
      endTimeInSec: "0",
      totalAmount: "0",
      totalAmountWithdrawn: "0",
      depositor: NULL_ADDRESS,
      isConfirmed: false,
    };

    assert.deepEqual(
      aliceSchedule,
      mockData,
      "alice vesting should have been deleted"
    );

    const aliceBalanceAfter = await token.balanceOf(alice.address);

    assert.closeTo(
      Number(aliceBalanceAfter),
      Number(0.75 * 1e18),
      Number(0.01 * 1e18)
    );

    const charlieBalanceAfter = await token.balanceOf(charlie.address);
    assert.closeTo(
      Number(charlieBalanceAfter),
      Number(0.25 * 1e18),
      Number(0.01 * 1e18)
    );  });
});
