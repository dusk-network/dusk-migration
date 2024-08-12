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

    event Migration(address indexed from, uint256 amount, string targetAddress);

    constructor(address _duskTokenAddress) {
        duskToken = IERC20(_duskTokenAddress);
    }

    function migrate(uint256 amount, string memory targetAddress) external {
        require(amount > 0, "Amount must be greater than zero");

        // Transfer the specified amount of DUSK tokens to this contract
        duskToken.transferFrom(msg.sender, address(this), amount);

        // Emit the migration event
        emit Migration(msg.sender, amount, targetAddress);
    }
}
