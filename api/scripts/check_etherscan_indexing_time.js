import { JsonRpcProvider } from 'ethers';
import { Contract } from 'ethers';
import { Wallet, HDNodeWallet, Interface } from 'ethers';

const root = HDNodeWallet.fromPhrase(
  'material toward work rib online drive pear word still robot kid man',
  undefined,
  "m/44'/60'/0'/0/0",
);
console.log(root.address);

const wallet = new Wallet(
  '0x3afbf7b18bdcb044a4d9bd71176032fa3140ac9e9be532b6b631b0b75dab75b2',
);

console.log(wallet.address);

const provider = new JsonRpcProvider(
  'https://ethereum-sepolia-rpc.publicnode.com',
  11155111,
);
const signer = wallet.connect(provider);

const token = new Contract(
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
  ['function transfer(address to, uint256 amount) returns (bool)'],
  signer,
);

const tx = await token.transfer(root.address, 100);
await tx.wait();

console.log(tx.hash);

const currentBlock = 11626829;

let found = false;

async function checkForTx() {
  const startTime = Date.now();
  while (!found) {
    const queryParams = new URLSearchParams({
      chainid: 11155111,
      module: 'account',
      action: 'tokentx',
      address: '0x5b1Ea16F2D635F5C9A6fD528ebceBD8821009783',
      startblock: currentBlock - 1000,
      endblock: currentBlock + 1000,
      apikey: 'RRCAAYF4G4SH6ZSD7ZY9GVJ6ITGGHFR378',
    });
    const response = await fetch(
      `https://api.etherscan.io/v2/api?${queryParams.toString()}`,
    );
    const data = await response.json();
    console.log(data);

    if (data.result.find((_tx) => _tx.hash === tx.hash)) {
      console.log(data);
      found = true;
      console.log(`Tx found`);
      console.log(`Time taken: ${Date.now() - startTime}ms`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function checkForTx2() {
  const startTime = Date.now();
  while (!found) {
    const queryParams1 = new URLSearchParams({
      chainid: 11155111,
      module: 'proxy',
      action: 'eth_blockNumber',
      apikey: 'RRCAAYF4G4SH6ZSD7ZY9GVJ6ITGGHFR378',
    });
    const blockNumberRes = await fetch(
      `https://api.etherscan.io/v2/api?${queryParams1.toString()}`,
    );
    const { result: blockNumber } = await blockNumberRes.json();

    const queryParams2 = new URLSearchParams({
      chainid: 11155111,
      module: 'proxy',
      action: 'eth_getBlockByNumber',
      tag: blockNumber,
      apikey: 'RRCAAYF4G4SH6ZSD7ZY9GVJ6ITGGHFR378',
      boolean: true,
    });
    const response = await fetch(
      `https://api.etherscan.io/v2/api?${queryParams2.toString()}`,
    );
    const data = await response.json();

    if (data.result.transactions.find((_tx) => _tx.hash === tx.hash)) {
      const foundTx = data.result.transactions.find(
        (_tx) => _tx.hash === tx.hash,
      );
      found = true;
      console.log(`Tx found`);
      console.log(`Time taken: ${Date.now() - startTime}ms`);

      const iface = new Interface([
        'function transfer(address to, uint256 amount)',
      ]);
      const decodedTx = iface.parseTransaction({
        data: foundTx.input,
        value: foundTx.value,
      });
      console.log(decodedTx);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

checkForTx();
