const fs = require("fs");
const path = require("path");

const contractName = "DUSKMigration";
const artifact = require(path.join(__dirname, "../", "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`));
const abi = artifact.abi;

const abiOutputPath = path.join(__dirname, "../", `${contractName}.abi.json`);
fs.mkdirSync(path.dirname(abiOutputPath), { recursive: true });
fs.writeFileSync(abiOutputPath, JSON.stringify(abi, null, 2));

console.log(`ABI for ${contractName} saved to ${abiOutputPath}`);
