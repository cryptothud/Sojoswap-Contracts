pragma solidity ^0.6.6;

import "./core/UniswapV2Pair.sol";

contract GenerateInitCodeHash {


    constructor() public {

    }

    function getInitHash() public pure returns(bytes32){
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        return keccak256(abi.encodePacked(bytecode));
    }
}