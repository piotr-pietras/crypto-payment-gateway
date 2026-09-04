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
