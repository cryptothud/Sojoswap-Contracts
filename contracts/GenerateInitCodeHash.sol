pragma solidity ^0.6.6;

import "./core/SojoswapPair.sol";

contract GenerateInitCodeHash {


    constructor() public {

    }

    function getInitHash() public pure returns(bytes32){
        bytes memory bytecode = type(SojoswapPair).creationCode;
        return keccak256(abi.encodePacked(bytecode));
    }
}