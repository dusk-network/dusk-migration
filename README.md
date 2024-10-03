# DUSK Migration Contract

This project contains the smart contract and related scripts for migrating DUSK tokens from ERC20/BEP20 to native DUSK. The project is built using Hardhat.

**Migration Flow**:
1. User invokes `migrate()` with ERC20/BEP20 DUSK tokens and their Dusk mainnet Moonlight key.
2. The contract locks the ERC20/BEP20 tokens and emits a `Migration` event.
3. An external service listens to the event and reissues native DUSK on the Dusk network.

## Overview

The DUSK migration contract is designed to lock DUSK into the contract, and provide a receiving address on the DUSK side. It includes:
- **Smart Contracts**: A [Solidity migration contract](./contracts/DUSKMigration.sol) and an [ERC20 mock based on ERC20 DUSK](./contracts/ERC20Mock.sol) for testing.
- **Scripts**: Scripts for compiling contracts, extracting the ABI, listening to the migrate events and collecting past events.
- **Tests**: Integration tests that test how the migrate function behaves.

## Clone repo

```shell
git clone https://github.com/dusk-network/dusk-migration/tree/main
```

## Install

Install the dependencies:

```shell
npm install
```

## Usage

### Compile Contracts

To compile the smart contracts, run:
```shell
npm run compile
```

The contracts and their artifacts can be found in the `artifacts/` directory.

### Extract ABI

To extract the contract ABI from the compiled `DUSKMigration` contract, use:
```shell
npm run abi
```

### Listen to migration events

To listen to migration events, set up a `.env` file based on the `example.env` file and run:
```shell
npm run events:listen
```

### Get past migration events

To get past migration events, set up a `.env` file based on the `example.env` file and run:
```shell
npm run events:past
```

This will dump an `.abi.json` file in the `contract` folder.

### Run Tests

To run the tests:
```shell
npm test
```
