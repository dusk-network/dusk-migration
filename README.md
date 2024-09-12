# DUSK Migration Contract

This project contains the smart contract and related scripts for migrating DUSK tokens from ERC20/BEP20 to native DUSK. The project is built using Hardhat.

## Overview

The DUSK migration contract is designed to lock DUSK into the contract, and provide a receiving address on the DUSK side. It includes:
- **Smart Contracts**: A Solidity migration contract and an ERC20 mock based on ERC20 DUSK.
- **Scripts**: Scripts for compiling contracts, extracting the ABI and listening to the migrate event.
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
