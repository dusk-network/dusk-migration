require('@dotenvx/dotenvx').config();
const { ethers } = require('ethers');

const providerUrl = process.env.PROVIDER_URL;
const provider = new ethers.JsonRpcProvider(providerUrl);

// Check if provider connection is successful
(async () => {
    try {
        const blockNumber = await provider.getBlockNumber();
        console.log("Connected! Current block number:", blockNumber);
    } catch (error) {
        console.error("Failed to connect to the provider:", error);
        return;  // Exit if connection fails
    }
})();

//  DUSKMigration contract address
const contractAddress = process.env.DUSK_MIGRATION_CONTRACT_ADDRESS;

const contractAbi = [
    "event Migration(address indexed from, uint256 amount, string targetAddress)"
];

const MIGRATION_EVENT_SIGNATURE_HASH = "0x9fe606c14926b70a5edcf4f53cf9cc99c3deba52132688c67a0c9dde0a7ab5bb";

// Create a contract instance
const duskMigrationContract = new ethers.Contract(contractAddress, contractAbi, provider);

const filter = {
    address: contractAddress,
    topics: [MIGRATION_EVENT_SIGNATURE_HASH],
    fromBlock: 0,
    toBlock: "latest"
};

// Get the contract logs and iterate over them
async function getPastEvents() {
    const logs = await provider.getLogs(filter);

    logs.forEach(log => {
        const parsedLog = duskMigrationContract.interface.parseLog(log);

        console.log(`Past Migration event detected:
            From: ${parsedLog.args.from}
            Amount: ${ethers.formatUnits(parsedLog.args.amount, 9)} DUSK
            Target Address: ${parsedLog.args.targetAddress}
            Transaction Hash: ${log.transactionHash}
        `);
    });
}

getPastEvents();
