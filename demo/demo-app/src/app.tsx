import { useCallback, useMemo } from 'react';
import BN from 'bn.js';
import { from, Subject } from 'rxjs';
import { concatMap, tap, take, switchMap, filter } from 'rxjs/operators';
import { useObservable, useSubscription } from 'observable-hooks';
import { Toaster, toast } from 'react-hot-toast';
import { StacksTestnet } from '@stacks/network';
import { RxStacks } from '@stacks/rx';
import { broadcastTransaction, makeSTXTokenTransfer } from '@stacks/transactions';
import { Button, Box } from '@stacks/ui';
import './app.css';

function useRxStacks(url: string) {
  return useMemo(() => new RxStacks({ url }), [url]);
}

const url = 'https://stacks.zone117x.com';
const network = new StacksTestnet();
network.coreApiUrl = url;

const App = () => {
  const client = useRxStacks(url);

  const createTransaction = useCallback(
    () =>
      makeSTXTokenTransfer({
        recipient: 'ST3TVPR20C8NP97NNYEGC2D2TE0TYD908TS9D0V5N',
        senderKey: 'b68d555107666dc9ca2638e633920e8c2426efb67419fb74407135beb805398c01',
        amount: new BN(Math.random() + 1),
        network,
      }),
    []
  );

  const initiateTxSend$ = useMemo(() => new Subject<void>(), []);

  const sendTxStream$ = useObservable(() =>
    initiateTxSend$.pipe(
      concatMap(() => createTransaction()),
      concatMap(tx => from(broadcastTransaction(tx, network))),
      tap(() => {
        toast.success('Transaction successfully broadcast');
      }),
      switchMap(newTx =>
        client.mempoolTxs$.pipe(
          filter(tx => tx.tx_id === '0x' + newTx),
          take(1),
          tap(() => toast.success(`New mempool tx, Txid: 0x${newTx}`))
        )
      )
    )
  );

  useSubscription(sendTxStream$, tx => console.log('transaction', tx));

  return (
    <div className="app">
      <Toaster position="top-right" />
      <Box>
        <Button height="40px" mode="primary" onClick={() => initiateTxSend$.next()}>
          Broadcast Transaction
        </Button>
      </Box>
    </div>
  );
};

export default App;
