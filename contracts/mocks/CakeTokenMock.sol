import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

pragma solidity ^0.7.3;

contract MockCakeToken is ERC20 {

  constructor(string memory _name, string memory _symbol) ERC20(_name, _symbol){
        super._mint(msg.sender, 10000000 ether);
    }
}