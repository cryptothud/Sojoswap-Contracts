pragma solidity 0.6.6;

import "../SojoswapERC20.sol";

contract ERC20 is SojoswapERC20 {
    constructor(uint256 _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
