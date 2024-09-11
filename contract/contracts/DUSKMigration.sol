// SPDX-License-Identifier: MPL-2.0
pragma solidity ^0.8.24;

// Minimal ERC20 interface required to transfer DUSK
interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

contract DUSKMigration {
    IERC20 public duskToken;
    // Minimum migratable amount: 10^9 wei, equivalent to 1 LUX on the native chain
    uint256 constant MINIMUM_MIGRATION_AMOUNT = 10**9; 

    // Event to log the migration for reissuing on Dusk mainnet. The amount being in LUX
    event Migration(address indexed from, uint256 amount, string targetAddress);

    constructor(address _duskTokenAddress) {
        duskToken = IERC20(_duskTokenAddress);
    }

    function migrate(uint256 amount, string memory targetAddress) external {
        require(amount >= MINIMUM_MIGRATION_AMOUNT, "Amount must be at least 1 LUX");

        // Round down the amount to the nearest multiple of 1 LUX
        uint256 roundedAmount = amount / MINIMUM_MIGRATION_AMOUNT * MINIMUM_MIGRATION_AMOUNT;

        // Transfer the specified amount of DUSK tokens to this contract
        duskToken.transferFrom(msg.sender, address(this), roundedAmount);

        // Adjust the amount to account for the difference in decimals between native DUSK (9 decimals) and ERC20/BEP20 DUSK (18 decimals)
        uint256 nativeAmount = roundedAmount / 10**9;

        // Emit the migration event with the value in LUX
        emit Migration(msg.sender, nativeAmount, targetAddress);
    }
}
