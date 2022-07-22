import fs from "fs-extra";
import TonWeb from "tonweb";
import { getAddress } from "./index.js";

/**
 * 
 * @param {TonWeb} tonweb 
 */
export const getGodWallet = async (tonweb) => {
  const {
    god_wallet: { secretkey, publickey },
  } = await fs.readJson(".env.json");

  const god_wallet = tonweb.wallet.create({ publicKey: publickey });

  const address = await god_wallet.getAddress(); // address of this wallet in blockchain

  const balance = await tonweb.getBalance(address)

  return { wallet: god_wallet, secretkey, publickey, balance, address, address_url: getAddress(address) };
};
