export type EtherscanResponse<T> = {
  status: string;
  message: string;
  result: T;
};

export type GetERC20TokenTransferResponse = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  functionName: string;
  methodId: string;
}[];

export type GetBlockByNumberResponse = {
  transactions: {
    hash: string;
    blockNumber: string;
    from: string;
    to: string;
    value: string;
    input: string;
  }[];
};

export type GetTransactionReceiptResponse = {
  blockHash: string;
  blockNumber: string;
  status: '0x1' | '0x0';
} | null;
