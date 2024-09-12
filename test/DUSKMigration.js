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

      // We set the unit to 0 to work with the smallest value, test the DUSK to LUX conversion
      // and see effect of the rounding down
      const amountToMigrate = ethers.parseUnits("1234567890", 0);
      const amountMigrated = ethers.parseUnits("1000000000", 0);
      const luxToSend = ethers.parseUnits("1", 0);
      const moonlightAddress = "oCqYsUMRqpRn2kSabH52Gt6FQCwH5JXj5MtRdYVtjMSJ73AFvdbPf98p3gz98fQwNy9ZBiDem6m9BivzURKFSKLYWP3N9JahSPZs9PnZ996P18rTGAjQTNFsxtbrKx79yWu"

      // addr1 approves the migration contract
      await duskToken.connect(addr1).approve(duskMigration.target, amountToMigrate);

      // Perform migration
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, moonlightAddress))
        .to.emit(duskMigration, "Migration")
        .withArgs(addr1.address, luxToSend, moonlightAddress); // Check that the event emits the correct value in LUX

      // Check if the migration contract's balance increased by the rounded down amount
      expect(await duskToken.balanceOf(duskMigration.target)).to.equal(amountMigrated);
    });

    it("Should revert if the user tries to migrate less than 1 LUX", async function () {
      const { duskToken, duskMigration, addr2 } = await loadFixture(
        deployMigrationFixture
      );

      const amountToMigrate = ethers.parseUnits("123", 0); // Less than 1 LUX, this is 123 DUSK wei
      const moonlightAddress = "oCqYsUMRqpRn2kSabH52Gt6FQCwH5JXj5MtRdYVtjMSJ73AFvdbPf98p3gz98fQwNy9ZBiDem6m9BivzURKFSKLYWP3N9JahSPZs9PnZ996P18rTGAjQTNFsxtbrKx79yWu"

      // addr2 approves the migration contract
      await duskToken.connect(addr2).approve(duskMigration.target, amountToMigrate);

      // Attempt to migrate less than 1 LUX, expect a revert
      await expect(duskMigration.connect(addr2).migrate(amountToMigrate, moonlightAddress))
        .to.be.revertedWith("Amount must be at least 1 LUX");
    });

    it("Should revert if the user has not approved enough tokens", async function () {
      const { duskToken, duskMigration, addr1 } = await loadFixture(
        deployMigrationFixture
      );

      const amountToMigrate = ethers.parseEther("100"); // Try to migrate 100 DUSK
      const moonlightAddress = "oCqYsUMRqpRn2kSabH52Gt6FQCwH5JXj5MtRdYVtjMSJ73AFvdbPf98p3gz98fQwNy9ZBiDem6m9BivzURKFSKLYWP3N9JahSPZs9PnZ996P18rTGAjQTNFsxtbrKx79yWu"

      // addr1 approves less tokens than needed, only 50 DUSK
      await duskToken.connect(addr1).approve(duskMigration.target, ethers.parseEther("50"));

      // Attempt to migrate more tokens than approved, expect a revert
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, moonlightAddress))
        .to.be.reverted;
    });

    it("Should allow a user to migrate exactly 1 LUX", async function () {
      const { duskToken, duskMigration, addr1 } = await loadFixture(
        deployMigrationFixture
      );

      const amountToMigrate = ethers.parseUnits("1000000000", 0); // 1 LUX, smallest unit
      const luxToSend = ethers.parseUnits("1", 0); // Exactly 1 LUX in native DUSK
      const moonlightAddress = "oCqYsUMRqpRn2kSabH52Gt6FQCwH5JXj5MtRdYVtjMSJ73AFvdbPf98p3gz98fQwNy9ZBiDem6m9BivzURKFSKLYWP3N9JahSPZs9PnZ996P18rTGAjQTNFsxtbrKx79yWu";

      // addr1 approves the migration contract
      await duskToken.connect(addr1).approve(duskMigration.target, amountToMigrate);

      // Perform migration and check event emission
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, moonlightAddress))
        .to.emit(duskMigration, "Migration")
        .withArgs(addr1.address, luxToSend, moonlightAddress); // Emit exactly 1 LUX

      // Check if the contract balance increased by exactly 1 LUX
      expect(await duskToken.balanceOf(duskMigration.target)).to.equal(amountToMigrate);
    });

    it("Should allow a user to migrate slightly above 1 LUX and round down to 1 LUX", async function () {
      const { duskToken, duskMigration, addr1 } = await loadFixture(deployMigrationFixture);

      const amountToMigrate = ethers.parseUnits("1000000001", 0); // 1 LUX + 1 wei 
      const amountMigrated = ethers.parseUnits("1000000000", 0); // Expected migration amount: 1 LUX
      const luxToSend = ethers.parseUnits("1", 0); // Expected event emission: 1 LUX
      const moonlightAddress = "oCqYsUMRqpRn2kSabH52Gt6FQCwH5JXj5MtRdYVtjMSJ73AFvdbPf98p3gz98fQwNy9ZBiDem6m9BivzURKFSKLYWP3N9JahSPZs9PnZ996P18rTGAjQTNFsxtbrKx79yWu";

      // addr1 approves the migration contract
      await duskToken.connect(addr1).approve(duskMigration.target, amountToMigrate);

      // Perform migration and expect rounding down
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, moonlightAddress))
        .to.emit(duskMigration, "Migration")
        .withArgs(addr1.address, luxToSend, moonlightAddress); // Emit exactly 1 LUX

      // Check if the contract balance increased by 1 LUX
      expect(await duskToken.balanceOf(duskMigration.target)).to.equal(amountMigrated);
    });

    it("Should not allow a user to migrate slightly below 1 LUX and round down to 0 LUX", async function () {
      const { duskToken, duskMigration, addr1 } = await loadFixture(deployMigrationFixture);

      const amountToMigrate = ethers.parseUnits("99999999", 0); // 1 LUX - 1 wei 
      const moonlightAddress = "oCqYsUMRqpRn2kSabH52Gt6FQCwH5JXj5MtRdYVtjMSJ73AFvdbPf98p3gz98fQwNy9ZBiDem6m9BivzURKFSKLYWP3N9JahSPZs9PnZ996P18rTGAjQTNFsxtbrKx79yWu";

      // addr1 approves the migration contract
      await duskToken.connect(addr1).approve(duskMigration.target, amountToMigrate);

      // Perform migration and expect rounding down
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, moonlightAddress));

      // Attempt to migrate less than 1 LUX, expect a revert
      await expect(duskMigration.connect(addr1).migrate(amountToMigrate, moonlightAddress))
        .to.be.revertedWith("Amount must be at least 1 LUX");
    });

    it("Should allow a user to perform multiple migrations", async function () {
      const { duskToken, duskMigration, addr1 } = await loadFixture(deployMigrationFixture);

      const amountToMigrateFirst = ethers.parseUnits("1000000000", 0); // 1 LUX
      const amountToMigrateSecond = ethers.parseUnits("2000000000", 0); // 2 LUX
      const totalMigrated = ethers.parseUnits("3000000000", 0); // 3 LUX in total after both migrations
      const luxToSendFirst = ethers.parseUnits("1", 0); // First migration sends 1 LUX
      const luxToSendSecond = ethers.parseUnits("2", 0); // Second migration sends 2 LUX
      const moonlightAddress = "oCqYsUMRqpRn2kSabH52Gt6FQCwH5JXj5MtRdYVtjMSJ73AFvdbPf98p3gz98fQwNy9ZBiDem6m9BivzURKFSKLYWP3N9JahSPZs9PnZ996P18rTGAjQTNFsxtbrKx79yWu";

      // addr1 approves the migration contract
      await duskToken.connect(addr1).approve(duskMigration.target, ethers.parseUnits("3000000000", 0));

      // Perform first migration
      await expect(duskMigration.connect(addr1).migrate(amountToMigrateFirst, moonlightAddress))
        .to.emit(duskMigration, "Migration")
        .withArgs(addr1.address, luxToSendFirst, moonlightAddress); // Emit 1 LUX for the first migration

      // Perform second migration
      await expect(duskMigration.connect(addr1).migrate(amountToMigrateSecond, moonlightAddress))
        .to.emit(duskMigration, "Migration")
        .withArgs(addr1.address, luxToSendSecond, moonlightAddress); // Emit 2 LUX for the second migration

      // Check if the contract balance equals the total of both migrations
      expect(await duskToken.balanceOf(duskMigration.target)).to.equal(totalMigrated);
    });
  });
});
