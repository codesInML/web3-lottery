const assert = require("assert");
const ganache = require("ganache");
const { Web3 } = require("web3");
const web3 = new Web3(ganache.provider());
const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery Contract", () => {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("allows an account to enter", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[1], value: web3.utils.toWei("0.02", "ether") });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[1] });

    assert.equal(accounts[1], players[0]);
    assert.equal(1, players.length);
  });

  it("allows multiple accounts to enter", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[1], value: web3.utils.toWei("0.02", "ether") });
    await lottery.methods
      .enter()
      .send({ from: accounts[2], value: web3.utils.toWei("0.015", "ether") });
    await lottery.methods
      .enter()
      .send({ from: accounts[3], value: web3.utils.toWei("0.022", "ether") });

    const players = await lottery.methods
      .getPlayers()
      .call({ from: accounts[1] });

    assert.equal(accounts[1], players[0]);
    assert.equal(accounts[2], players[1]);
    assert.equal(accounts[3], players[2]);
    assert.equal(3, players.length);
  });

  it("requires a minimum amount of ether to enter the lottery", async () => {
    try {
      await lottery.methods.enter().send({ from: accounts[1], value: "200" });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("requires only the manager to pick the lottery winner", async () => {
    try {
      await lottery.methods.pickWinner().send({ from: accounts[1] });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });
});
