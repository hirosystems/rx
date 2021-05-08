# @stacks/rx

[![Build and test status](https://github.com/metachris/typescript-boilerplate/workflows/Lint%20and%20test/badge.svg)](https://github.com/metachris/micropython-ctl/actions?query=workflow%3A%22Build+and+test%22)

Reactive Extensions client for the Stacks Blockchain 🚀

## Getting Started

```bash
yarn add @stacks/rx rxjs
```

```ts
import { RxStacks, HIRO_API_URL } from '@stacks/rx';

const client = new RxStacks({ url: HIRO_API_URL });

client.blocks$.subscribe(block => console.log('New block: ', block.height));
```

## Demo App

```bash
git clone https://github.com/blockstack/rx
cd demo/demo-app
yarn && yarn start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Tutorial

### Broadcasting a transaction

## Tutorial

### Using @stacks/rx to follow a transaction's lifecycle

```ts

from(broadcastTransaction(transaction)).pipe(

  tap(tx => notifyBroadcastSuccess(tx)),
  
  concatMap(txid => mempoolTxs$.pipe(filterByTxid(txid))),

  tap(mempoolTx => notifyTxInMempool(mempoolTx)),

  concatMap(memTx => txs$.pipe(filterByTxid(txid))),
)
.subscribe(tx => notifyTransactionConfirm());
```


## Resources

- [RxJS documentation](https://rxjs-dev.firebaseapp.com/guide/overview)
- [RxJS 7 Live Asia 2021 talk by @benlesh](https://docs.google.com/presentation/d/1-LU7YE3NWw8jHeAgdmLu4CBfG7osCx6MsSIeFs16k60/edit#slide=id.gd5a1fd8e28_0_415)
- [RxJS marble diagrams](https://rxmarbles.com/)
