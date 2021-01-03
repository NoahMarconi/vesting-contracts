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

  it.only("should test registerVesting negative tests", async function () {
    const startTime = blockTime;
    const cliffTime = blockTime + 500;
    const endTime = blockTime + 1000;
    const totalAmount = 1 * 1e18;
    try {
      await vesting.registerVestingSchedule(
        charlie.address,
        NULL_ADDRESS,
        startTime,
        cliffTime,
        endTime,
        totalAmount.toString()
      );
      should.fail("no error was thrown when it should have been");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert addressNotNull"
      );
    }
    try {
      await vesting.registerVestingSchedule(
        alice.address,
        owner.address,
        startTime,
        cliffTime,
        endTime,
        totalAmount.toString()
      );
      should.fail("no error was thrown when it should have been");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert vestingScheduleNotConfirmed"
      );
    }
    try {
      await vesting.registerVestingSchedule(
        charlie.address,
        owner.address,
        cliffTime,
        startTime,
        endTime,
        totalAmount.toString()
      );
      should.fail("no error was thrown when it should have been");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert cliff > start"
      );
    }

    try {
      await vesting.registerVestingSchedule(
        charlie.address,
        owner.address,
        startTime,
        endTime,
        cliffTime,
        totalAmount.toString()
      );
      should.fail("no error was thrown when it should have been");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert end > cliff"
      );
    }
    try {
      await vesting
        .connect(charlie)
        .registerVestingSchedule(
          charlie.address,
          owner.address,
          startTime,
          cliffTime,
          endTime,
          totalAmount.toString()
        );
      should.fail("no error was thrown when it should have been");
    } catch (e) {
      assert.equal(
        e.message,
        "VM Exception while processing transaction: revert Ownable: caller is not the owner"
      );
    }
  });

  it.only("confirm negative tests", async function () {
	const startTime = blockTime;
    const cliffTime = blockTime + 500;
    const endTime = blockTime + 1000;
    const totalAmount = 1 * 1e18;

    await vesting.registerVestingSchedule(
      bob.address,
      owner.address,
      startTime,
      cliffTime,
      endTime,
      totalAmount.toString()
	);
	
	try {
		await vesting
		  .connect(alice)
		  .confirmVestingSchedule(
			startTime,
			cliffTime,
			endTime,
			totalAmount.toString()
		  );
		should.fail("no error was thrown when it should have been");
	  } catch (e) {
		assert.equal(
		  e.message,
		  "VM Exception while processing transaction: revert vestingScheduleNotConfirmed"
		);
	  }

	  try {
		await vesting
		  .connect(charlie)
		  .confirmVestingSchedule(
			startTime,
			cliffTime,
			endTime,
			totalAmount.toString()
		  );
		should.fail("no error was thrown when it should have been");
	  } catch (e) {
		assert.equal(
		  e.message,
		  "VM Exception while processing transaction: revert addressRegistered"
		);
	  }
	  try {
		await vesting
		  .connect(bob)
		  .confirmVestingSchedule(
			cliffTime,
			cliffTime,
			endTime,
			totalAmount.toString()
		  );
		should.fail("no error was thrown when it should have been");
	  } catch (e) {
		assert.equal(
		  e.message,
		  "VM Exception while processing transaction: revert start"
		);
	  }
	  try {
		await vesting
		  .connect(bob)
		  .confirmVestingSchedule(
			startTime,
			endTime,
			endTime,
			totalAmount.toString()
		  );
		should.fail("no error was thrown when it should have been");
	  } catch (e) {
		assert.equal(
		  e.message,
		  "VM Exception while processing transaction: revert cliff"
		);
	  }
	  try {
		await vesting
		  .connect(bob)
		  .confirmVestingSchedule(
			startTime,
			cliffTime,
			cliffTime,
			totalAmount.toString()
		  );
		should.fail("no error was thrown when it should have been");
	  } catch (e) {
		assert.equal(
		  e.message,
		  "VM Exception while processing transaction: revert end"
		);
	  }
	  try {
		await vesting
		  .connect(bob)
		  .confirmVestingSchedule(
			startTime,
			cliffTime,
			endTime,
			"0"
		  );
		should.fail("no error was thrown when it should have been");
	  } catch (e) {
		assert.equal(
		  e.message,
		  "VM Exception while processing transaction: revert amount"
		);
	  }
  })

});
