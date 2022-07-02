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
    // To check you can use blockchain explorer https://testnet.tonscan.org/address/<WALLET_ADDRESS>

    const wallet = tonweb.wallet.create({
        publicKey: key_pair.publicKey
    });
    const wallet_address = await wallet.getAddress(); // address of this wallet in blockchain

    return {
        public: key_pair.publicKey,
        secret: key_pair.secretKey,
        address: wallet_address,
        address_url: getAddress(wallet_address)
    }
}

/**
 * 
 * @param { Address } address 
 * @returns 
 */
const getAddress = (address) => address.toString(true, true, true);

export { createWallet, getAddress }