import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

pragma solidity ^0.7.3;

abstract contract MockCakeToken is ERC20 {

  constructor() {
        super._mint(msg.sender, 10000000 ether);
    }
}