import TonWeb from "tonweb";

/**
 * 
 * @param {TonWeb} tonweb 
 */
const createWallet = async (tonweb) => {

    // secret key
    const seed = tonweb.utils.newSeed(); // A's private (secret) key
    const key_pair = tonweb.utils.keyPairFromSeed(seed); // Obtain key pair (public key and private key)

    // With a key pair, you can create a wallet.
    // Note that this is just an object, we are not deploying anything to the blockchain yet.
    // Transfer some amount of test coins to this wallet address (from your wallet app).
    // To check you can use blockchain explorer https://testnet.tonscan.org/address/<address>

    const wallet = tonweb.wallet.create({
        publicKey: key_pair.publicKey
    });
    const address = await wallet.getAddress(); // address of this wallet in blockchain

    const balance = await tonweb.getBalance(address)

    return {
        wallet: wallet,
        publickey: key_pair.publicKey,
        secretkey: key_pair.secretKey,
        address: address,
        address_url: getAddress(address),
        balance: balance
    }
}

/**
 * 
 * @param { Address } address 
 * @returns 
 */
const getAddress = (address) => address.toString(true, true, true);

export { createWallet, getAddress }