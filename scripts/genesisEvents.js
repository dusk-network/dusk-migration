require('@dotenvx/dotenvx').config();
const { ethers } = require("ethers");
const fs = require("fs");

// Chain metadata to combine both calls to Ethereum and BSC
const chains = [
    {
        name: "Ethereum",
        rpcUrl: process.env.ETH_MAINNET_PROVIDER_URL,
        contractAddress: process.env.ETH_ONRAMP_CONTRACT_ADDRESS,
        startBlock: process.env.ETH_ONRAMP_DEPLOY_BLOCK
    },
    {
        name: "Binance Smart Chain",
        rpcUrl: process.env.BSC_MAINNET_PROVIDER_URL,
        contractAddress: process.env.BSC_ONRAMP_CONTRACT_ADDRESS,
        startBlock: process.env.BSC_ONRAMP_DEPLOY_BLOCK
    },
];

// Genesis event ABIs
const contractABI = [
    "event GenesisDeposit(address indexed from, uint256 amount, string targetAddress)",
    "event GenesisStake(address indexed from, uint256 amount, string targetAddress)"
];

// Function to merge entries based on events.
// For example, to prevent two stake entries for the same key
function mergeEntries(entries, valueKey) {
    const merged = {};

    entries.forEach(({ address, [valueKey]: value }) => {
        const numericValue = BigInt(value.replace(/_/g, ""));
        if (!merged[address]) {
            merged[address] = numericValue;
        } else {
            merged[address] += numericValue;
        }
    });

    // Convert back to the required format
    return Object.entries(merged).map(([address, value]) => ({
        address,
        [valueKey]: value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_"),
    }));
}

// Function to calculate the total amount for a given value key
function calculateTotal(entries, valueKey) {
    return entries.reduce((total, entry) => {
        const numericValue = BigInt(entry[valueKey].replace(/_/g, "")); // Convert to BigInt for precision
        return total + numericValue;
    }, BigInt(0));
}

// Function to fetch events in batches
async function fetchEventsInBatches(contract, filter, fromBlock, toBlock, batchSize) {
    let events = [];
    let start = fromBlock;

    while (start <= toBlock) {
        const end = Math.min(start + batchSize - 1, toBlock);

        try {
            console.log(`Fetching events from block ${start} to block ${end}...`);
            const batchEvents = await contract.queryFilter(filter, start, end);
            events = events.concat(batchEvents);
        } catch (error) {
            console.error(`Error fetching events for block range ${start}-${end}:`, error);
        }

        start = end + 1;
    }

    return events;
}

// Function to fetch events for a given chain configuration of the Onramp contract
async function fetchEvents(chain) {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const contract = new ethers.Contract(chain.contractAddress, contractABI, provider);

    const fromBlock = Number(chain.startBlock);
    const toBlock = await provider.getBlockNumber();
    const batchSize = 2000;

    let stakeEntries = [];
    let moonlightEntries = [];

    try {
        // Fetch GenesisDeposit events in batches
        const depositFilter = contract.filters.GenesisDeposit();
        const depositEvents = await fetchEventsInBatches(contract, depositFilter, fromBlock, toBlock, batchSize);

        // Fetch GenesisStake events in batches
        const stakeFilter = contract.filters.GenesisStake();
        const stakeEvents = await fetchEventsInBatches(contract, stakeFilter, fromBlock, toBlock, batchSize);

        // Process GenesisDeposit events
        depositEvents.forEach((event) => {
            moonlightEntries.push({
                address: event.args.targetAddress,
                balance: parseInt(event.args.amount.toString(), 10).toLocaleString("en-US").replace(/,/g, "_"),
            });
        });

        // Process GenesisStake events
        stakeEvents.forEach((event) => {
            stakeEntries.push({
                address: event.args.targetAddress,
                amount: parseInt(event.args.amount.toString(), 10).toLocaleString("en-US").replace(/,/g, "_"),
            });
        });

    } catch (error) {
        console.error(`Error fetching events on ${chain.name}:`, error);
    }

    // Merge duplicate entries on a per event basis
    const mergedStakeEntries = mergeEntries(stakeEntries, 'amount');
    const mergedMoonlightEntries = mergeEntries(moonlightEntries, 'balance');

    return { stakeEntries: mergedStakeEntries, moonlightEntries: mergedMoonlightEntries };
}

// Custom TOML writer to handle our number formatting
function writeTOML(data) {
    let tomlContent = "";

    if (data.stake) {
        data.stake.forEach((entry, index) => {
            tomlContent += "[[stake]]\n";
            tomlContent += `address = '${entry.address}'\n`;
            tomlContent += `amount = ${entry.amount}\n\n`;
        });
    }

    if (data.moonlight_account) {
        data.moonlight_account.forEach((entry) => {
            tomlContent += "[[moonlight_account]]\n";
            tomlContent += `address = '${entry.address}'\n`;
            tomlContent += `balance = ${entry.balance}\n\n`;
        });
    }

    return tomlContent.trim();
}

async function main() {
    let allStakeEntries = [];
    let allMoonlightEntries = [];

    // Collect all GenesisDeposit and GenesisStake events for each chain config
    for (const chain of chains) {
        console.log(`Fetching events on ${chain.name}...`);
        const { stakeEntries, moonlightEntries } = await fetchEvents(chain);
        allStakeEntries = allStakeEntries.concat(stakeEntries);
        allMoonlightEntries = allMoonlightEntries.concat(moonlightEntries);
    }

    // Combine entries across chains to handle duplicate event entries globally
    allStakeEntries = mergeEntries(allStakeEntries, 'amount');
    allMoonlightEntries = mergeEntries(allMoonlightEntries, 'balance');

    // Calculate totals
    const totalStaked = calculateTotal(allStakeEntries, 'amount');
    const totalDeposited = calculateTotal(allMoonlightEntries, 'balance');

    console.log(`Total amount staked: ${totalStaked.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_")}`);
    console.log(`Total amount deposited: ${totalDeposited.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "_")}`);

    // Create genesis data structure
    const genesisData = {
        stake: allStakeEntries,
        moonlight_account: allMoonlightEntries,
    };

    // Generate TOML content
    const tomlContent = writeTOML(genesisData);

    // Write TOML content to a file
    fs.writeFileSync("genesis.toml", tomlContent);
    console.log("Generated genesis.toml file.");
}

main();
