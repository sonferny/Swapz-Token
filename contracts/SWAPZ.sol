// SPDX-License-Identifier: Unlicensed
pragma solidity 0.6.12;

import "./BEP20.sol";
import "./LGEWhitelisted.sol";
import "./SafeMath.sol";


contract SWAPZ is BEP20('SWAPZ.app', 'SWAPZ'), LGEWhitelisted {

    uint256 private _cap = 1000000000e18;
    
    function cap() public view returns (uint256) {
        return _cap;
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * @dev See {BEP20-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - minted tokens must not cause the total supply to go over the cap.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        
        LGEWhitelisted._applyLGEWhitelist(from, to, amount);
        super._beforeTokenTransfer(from, to, amount);

        if (from == address(0)) { // When minting tokens
            require(totalSupply() + amount <= _cap, "BEP20Capped: cap exceeded");
        }
    }

}