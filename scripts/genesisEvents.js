require('@dotenvx/dotenvx').config();
const { ethers } = require("ethers");
const toml = require("smol-toml");
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

async function fetchEvents(chain) {
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const contract = new ethers.Contract(chain.contractAddress, contractABI, provider);

    const fromBlock = chain.startBlock;
    const toBlock = "latest";

    let stakeEntries = [];
    let moonlightEntries = [];

    try {
        // Fetch GenesisDeposit events
        const depositFilter = contract.filters.GenesisDeposit();
        const depositEvents = await contract.queryFilter(depositFilter, BigInt(fromBlock), toBlock);

        // Fetch GenesisStake events
        const stakeFilter = contract.filters.GenesisStake();
        const stakeEvents = await contract.queryFilter(stakeFilter, BigInt(fromBlock), toBlock);

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

    return { stakeEntries, moonlightEntries };
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

    // Create genesis data structure
    const genesisData = {
        stake: allStakeEntries,
        moonlight_account: allMoonlightEntries,
    };

    // Convert to TOML format
    const genesisToml = toml.stringify(genesisData);

    // Write events to genesis.toml
    fs.writeFileSync("genesis.toml", genesisToml);
    console.log("Generated genesis.toml file.");
}

main();
