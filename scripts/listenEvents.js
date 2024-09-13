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

// Create a contract instance
const duskMigrationContract = new ethers.Contract(contractAddress, contractAbi, provider);

// Listen for migration events
duskMigrationContract.on('Migration', async (from, amount, targetAddress, event) => {
    console.log(`Migration event detected:
        From: ${from}
        Amount: ${ethers.formatUnits(amount, 9)} DUSK
        Target Address: ${targetAddress}
        Transaction Hash: ${event.log.transactionHash}
    `);
});

console.log("Listening for Migration events...");
