const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DUSK_ADDRESS = null;

module.exports = buildModule("DUSKMigrationModule", (m) => {
  const tokenAddress = m.getParameter("duskTokenAddress", DUSK_ADDRESS);

  const migrationContract = m.contract("DUSKMigration", [tokenAddress]);

  return { migrationContract };
});
