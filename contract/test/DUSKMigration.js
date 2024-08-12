const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Migration", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMigrationFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await ethers.getSigners();

    DUSKToken = await ethers.getContractFactory("DuskToken");
    duskToken = await DUSKToken.deploy();
    await duskToken.waitForDeployment();
    // Transfer 1000 tokens from owner to addr1
    await duskToken.transfer(addr1.address, ethers.parseEther("1000"));

    DUSKMigration = await ethers.getContractFactory("DUSKMigration");
    duskMigration = await DUSKMigration.deploy(duskToken.target);
    await duskMigration.waitForDeployment();

    return { duskToken, duskMigration, owner, addr1, addr2 };
  }

  describe("Migrate Function", function () {
    it("Should allow a user to migrate tokens", async function () {
      const { duskToken, duskMigration, addr1 } = await loadFixture(
        deployMigrationFixture
      );

      const amountToMigrate = ethers.parseEther("100");
      const phoenixAddress = "4ZH3oyfTuMHyWD1Rp4e7QKp5yK6wLrWvxHneufAiYBAjvereFvfjtDvTbBcZN5ZCsaoMo49s1LKPTwGpowik6QJG"

      // addr1 approves the migration contract
      await duskToken.connect(addr1).approve(duskMigration.target, amountToMigrate);

      // Perform migration
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, phoenixAddress))
        .to.emit(duskMigration, "Migration")
        .withArgs(addr1.address, amountToMigrate, phoenixAddress);

      // Check if the migration contract's balance increased
      expect(await duskToken.balanceOf(duskMigration.target)).to.equal(amountToMigrate);
    });

    it("Should revert if the user tries to migrate 0 tokens", async function () {
      const { duskToken, duskMigration, addr2 } = await loadFixture(
        deployMigrationFixture
      );

      const amountToMigrate = ethers.parseEther("0");
      const phoenixAddress = "4ZH3oyfTuMHyWD1Rp4e7QKp5yK6wLrWvxHneufAiYBAjvereFvfjtDvTbBcZN5ZCsaoMo49s1LKPTwGpowik6QJG"

      // addr2 approves the migration contract
      await duskToken.connect(addr2).approve(duskMigration.target, amountToMigrate);

      // Attempt to migrate 0 tokens, expect a revert
      await expect(duskMigration.connect(addr2).migrate(amountToMigrate, phoenixAddress))
        .to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if the user has not approved enough tokens", async function () {
      const { duskToken, duskMigration, addr1 } = await loadFixture(
        deployMigrationFixture
      );

      const amountToMigrate = ethers.parseEther("100");
      const phoenixAddress = "4ZH3oyfTuMHyWD1Rp4e7QKp5yK6wLrWvxHneufAiYBAjvereFvfjtDvTbBcZN5ZCsaoMo49s1LKPTwGpowik6QJG"

      // addr1 approves less tokens than needed
      await duskToken.connect(addr1).approve(duskMigration.target, ethers.parseEther("50"));

      // Attempt to migrate more tokens than approved, expect a revert
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, phoenixAddress))
        .to.be.reverted;
    });
  });
});
