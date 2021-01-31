// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface DeltaTokenInterface {
    function totalSupply() external pure returns (uint);
    function balanceOf(address tokenOwner) external pure returns (uint balance);
    function allowance(address tokenOwner, address spender) external pure returns (uint remaining);
    function transfer(address to, uint tokens) external returns (bool success);
    function approve(address spender, uint tokens) external returns (bool success);
    function transferFrom(address from, address to, uint tokens) external returns (bool success);
    function mint(address account, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}