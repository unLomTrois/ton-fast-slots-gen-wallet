import TonWeb from "tonweb";
import { createWallet } from "./wallet/index.js"

const { utils, HttpProvider } = TonWeb

// For calculations in the blockchain, we use BigNumber (BN.js). https://github.com/indutny/bn.js
// Don't use regular {Number} for coins, etc., it has not enough size and there will be loss of accuracy.
const BN = utils.BN;

// Blockchain does not operate with fractional numbers like `0.5`.
// `toNano` function converts TON to nanoton - smallest unit.
// 1 TON = 10^9 nanoton; 1 nanoton = 0.000000001 TON;
// So 0.5 TON is 500000000 nanoton
const toNano = utils.toNano;


const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
const apiKey = '26b2d4189e84598f7a0e86ee5495877f0ea290b75fe536344af5b75a210996d0'; // Obtain your API key in https://t.me/tontestnetapibot
const tonweb = new TonWeb(new HttpProvider(providerUrl, {apiKey})); // Initialize TON SDK

(async () => {
    const wallet = await createWallet(tonweb)

    console.log("wallet:", wallet)
})()