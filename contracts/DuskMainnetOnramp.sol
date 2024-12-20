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

/// @title The ERC20/BEP20 DUSK mainnet on-ramp contract
/// @author Hein Dauven
contract DuskMainnetOnramp {
    IERC20 public immutable duskToken;
    // Conversion factor between ERC20/BEP20 DUSK (18 decimals) and native DUSK (9 decimals), where 10^9 DUSK wei is equivalent to 1 LUX
    uint256 constant LUX_CONVERSION_FACTOR = 10**9; 
    uint256 constant MINIMAL_STAKE = (1000 * 10**9) * LUX_CONVERSION_FACTOR;
    uint256 public immutable endDepositTime;
    uint256 public immutable endStakeTime;

    // Event to log the genesis deposit & stake for inclusion in the genesis state on Dusk mainnet. The amount being in LUX
    event GenesisDeposit(address indexed from, uint256 amount, string targetAddress);
    event GenesisStake(address indexed from, uint256 amount, string targetAddress);

    /**
     * @param _duskTokenAddress The address of the ERC20/BEP20 DUSK token contract.
     * @param _endDepositTime The time after which deposits are no longer allowed.
     * @param _endStakeTime The time after which stake deposits are no longer allowed.
     */
    constructor(address _duskTokenAddress, uint256 _endDepositTime, uint256 _endStakeTime) {
        duskToken = IERC20(_duskTokenAddress);
        endDepositTime = _endDepositTime;
        endStakeTime = _endStakeTime;
    }

    /**
     * @param amount The amount of ERC20/BEP20 DUSK tokens to deposit for in genesis balance in DUSK wei. Must be at least 1 LUX (10^9 wei).
     * @param targetAddress The native DUSK mainnet Moonlight key that will be used to set the genesis balance for the given key.
     */
    function deposit(uint256 amount, string memory targetAddress) external {
        // No longer allow people to deposit after a given end time
        require(block.timestamp <= endDepositTime, "Deposit period has ended");

        // The minimum deposit amount has to be larger or equal to the conversion factor
        require(amount >= LUX_CONVERSION_FACTOR, "Amount must be at least 1 LUX");

        // Round down the amount to the nearest multiple of 1 LUX
        uint256 roundedAmount = (amount / LUX_CONVERSION_FACTOR) * LUX_CONVERSION_FACTOR;

        // Transfer the specified amount of DUSK tokens to this contract
        duskToken.transferFrom(msg.sender, address(this), roundedAmount);

        // Adjust the amount to account for the difference in decimals between native DUSK (9 decimals) and ERC20/BEP20 DUSK (18 decimals)
        uint256 nativeAmount = roundedAmount / LUX_CONVERSION_FACTOR;

        // Emit the genesis deposit event with the value in LUX
        emit GenesisDeposit(msg.sender, nativeAmount, targetAddress);
    }

    /**
     * @param amount The amount of ERC20/BEP20 DUSK tokens to deposit for on genesis staking in DUSK wei. Must be at least 1000 DUSK.
     * @param targetAddress The native DUSK mainnet Moonlight key that will be used to set the genesis stake for the given key.
     */
    function stake(uint256 amount, string memory targetAddress) external {
        // No longer allow people to deposit for on genesis staking after a given end time
        require(block.timestamp <= endStakeTime, "Stake period has ended");

        // The minimum stake amount has to be larger or equal to MINIMAL_STAKE
        require(amount >= MINIMAL_STAKE, "Amount must be at least 1000 DUSK");

        // Round down the amount to the nearest multiple of 1 LUX
        uint256 roundedAmount = (amount / LUX_CONVERSION_FACTOR) * LUX_CONVERSION_FACTOR;

        // Transfer the specified amount of DUSK tokens to this contract
        duskToken.transferFrom(msg.sender, address(this), roundedAmount);

        // Adjust the amount to account for the difference in decimals between native DUSK (9 decimals) and ERC20/BEP20 DUSK (18 decimals)
        uint256 nativeAmount = roundedAmount / LUX_CONVERSION_FACTOR;

        // Emit the genesis stake event with the value in LUX
        emit GenesisStake(msg.sender, nativeAmount, targetAddress);
    }
}
