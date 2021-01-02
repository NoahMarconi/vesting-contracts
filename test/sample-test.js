const chai = require("chai");
const { ethers, waffle } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const should = require("should");

chai.use(waffle.solidity);
const { expect, assert } = chai;

describe("test vesting contract", function() {
	let owner, alice, bob 

    beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    Contract = await ethers.getContractFactory("MockCakeToken");
    token = await Contract.deploy("cake", "cake")
    Contract = await ethers.getContractFactory("VestingWallet");
		staking = await Contract.deploy(token.address);
  });
  
  it("registers a vesting schedule", async function() {

  })

})