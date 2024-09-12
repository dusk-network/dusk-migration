require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.24" },
      { version: "0.4.25" },
    ]
  },
  overrides: {
    "contracts/DUSKMigration.sol": {
      version: "0.8.24",
    },
    "contracts/ERC20Mock.sol": {
      version: "0.4.25",
    }
  }
};
