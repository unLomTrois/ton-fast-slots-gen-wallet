import TonWeb from "tonweb";
import { createWallet } from "./wallet/index.js";

import fs from "fs-extra";
import { getGodWallet } from "./wallet/god.js";

const { utils, HttpProvider } = TonWeb;

// For calculations in the blockchain, we use BigNumber (BN.js). https://github.com/indutny/bn.js
// Don't use regular {Number} for coins, etc., it has not enough size and there will be loss of accuracy.
const BN = utils.BN;

// Blockchain does not operate with fractional numbers like `0.5`.
// `toNano` function converts TON to nanoton - smallest unit.
// 1 TON = 10^9 nanoton; 1 nanoton = 0.000000001 TON;
// So 0.5 TON is 500000000 nanoton
const toNano = utils.toNano;

const providerUrl = "https://testnet.toncenter.com/api/v2/jsonRPC"; // TON HTTP API url. Use this url for testnet
const apiKey =
  "26b2d4189e84598f7a0e86ee5495877f0ea290b75fe536344af5b75a210996d0"; // Obtain your API key in https://t.me/tontestnetapibot
const tonweb = new TonWeb(new HttpProvider(providerUrl, { apiKey })); // Initialize TON SDK

(async () => {
  // const god_wallet = await fs.readJson(".env.json")

  const god = await getGodWallet(tonweb);
  // console.log(god);

  const test = await createWallet(tonweb);
  // console.log(test);
  const seqno = await god.wallet.methods.seqno().call();

  const transfer = god.wallet.methods.transfer({
    secretKey: new Uint8Array(god.secretkey),
    toAddress: "EQCFbgHZGN1J5kCT0jkL5WYjmBdetYE6I1LRYUI8FzavL3BT",
    amount: TonWeb.utils.toNano("0.5"), // 0.01 TON
    seqno: seqno,
    payload: "Hello",
    sendMode: 3,
  });

  const transferFee = await transfer.estimateFee(); // get estimate fee of transfer
  console.log(transferFee);

  await transfer.send();

  const transferQuery = await transfer.getQuery(); // get transfer query Cell
  console.log(transferQuery);


  return
  //----------------------------------------------------------------------
  // PREPARE PAYMENT CHANNEL

  // The parties agree on the configuration of the payment channel.
  // They share information about the payment channel ID, their public keys, their wallet addresses for withdrawing coins, initial balances.
  // They share this information off-chain, for example via a websocket.

  const channelInitState = {
    balanceA: new BN(god.balance), // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
    balanceB: new BN(test.balance), // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
    seqnoA: new BN(0), // initially 0
    seqnoB: new BN(0), // initially 0
  };

  const channelConfig = {
    channelId: new BN(177), // Channel ID, for each new channel there must be a new ID
    addressA: god.address, // A's funds will be withdrawn to this wallet address after the channel is closed
    addressB: test.address, // B's funds will be withdrawn to this wallet address after the channel is closed
    initBalanceA: channelInitState.balanceA,
    initBalanceB: channelInitState.balanceB,
  };

  // // // Each on their side creates a payment channel object with this configuration

  const channelA = tonweb.payments.createChannel({
    ...channelConfig,
    isA: true,
    myKeyPair: {
      publicKey: new Uint8Array(god.publickey),
      secretKey: new Uint8Array(god.secretkey),
    },
    hisPublicKey: test.publickey,
  });

  const channelAddress = await channelA.getAddress(); // address of this payment channel smart-contract in blockchain
  console.log("channelAddress=", channelAddress.toString(true, true, true));

  const channelB = tonweb.payments.createChannel({
    ...channelConfig,
    isA: false,
    myKeyPair: {
      publicKey: new Uint8Array(test.publickey),
      secretKey: new Uint8Array(test.secretkey),
    },
    hisPublicKey: god.publickey,
  });

  if ((await channelB.getAddress()).toString() !== channelAddress.toString()) {
    throw new Error("Channels address not same");
  }

  // Interaction with the smart contract of the payment channel is carried out by sending messages from the wallet to it.
  // So let's create helpers for such sends.

  const fromWalletA = channelA.fromWallet({
    wallet: god.wallet,
    secretKey: new Uint8Array(god.secretkey),
  });

  const fromWalletB = channelB.fromWallet({
    wallet: test.wallet,
    secretKey: new Uint8Array(test.secretkey),
  });

  //----------------------------------------------------------------------
  // NOTE:
  // Further we will interact with the blockchain.
  // After each interaction with the blockchain, we need to wait for execution. In the TON blockchain, this is usually about 5 seconds.
  // In this example, the interaction code happens right after each other - that won't work.
  // To study the example, you can put a `return` after each send.
  // In a real application, you will need to check that the smart contract of the channel has changed
  // (for example, by calling its get-method and checking the `state`) and only then do the following action.

  //----------------------------------------------------------------------
  // DEPLOY PAYMENT CHANNEL FROM WALLET A

  // Wallet A must have a balance.
  // 0.05 TON is the amount to execute this transaction on the blockchain. The unused portion will be returned.
  // After this action, a smart contract of our payment channel will be created in the blockchain.

  await fromWalletA.deploy().send(toNano("0.05"));

  // // check
  // // setTimeout(async () => {
  // console.log(await channelA.getChannelState());
  // const data = await channelA.getData();
  // console.log("balanceA = ", data.balanceA.toString());
  // console.log("balanceB = ", data.balanceB.toString());
  // // }, 20000);

  // TOP UP
  // Now each parties must send their initial balance from the wallet to the channel contract.

  setTimeout(async () => {
    await fromWalletA.deploy().send(toNano("0.05"));
  }, 10000);

  // await fromWalletA
  //   .topUp({ coinsA: channelInitState.balanceA, coinsB: new BN(0) })
  //   .send(channelInitState.balanceA.add(toNano("0.05"))); // +0.05 TON to network fees

  // await fromWalletB
  //   .topUp({ coinsA: new BN(0), coinsB: channelInitState.balanceB })
  //   .send(channelInitState.balanceB.add(toNano("0.05"))); // +0.05 TON to network fees

  // // INIT
  // // After everyone has done top-up, we can initialize the channel from any wallet

  // await fromWalletA.init(channelInitState).send(toNano("0.05"));



  // closing

  // const signatureCloseB = await channelB.signClose(channelInitState);

  // if (!(await channelA.verifyClose(channelInitState, signatureCloseB))) {
  //   throw new Error("Invalid B signature");
  // }

  // await fromWalletA
  //   .close({
  //     ...channelInitState,
  //     hisSignature: signatureCloseB,
  //   })
  //   .send(toNano("0.05"));

  // // await deploy.send(); // deploy wallet to blockchain

  // // deploy
})();
