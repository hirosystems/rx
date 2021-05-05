import { EMPTY, from, merge, Observable, Subject, Subscriber, timer } from 'rxjs';
import { catchError, concatMap, map, tap, take, filter } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

import { Configuration, BlocksApi, TransactionsApi } from '@stacks/blockchain-api-client';
import {
  AddressStxBalanceResponse,
  AddressTransactionWithTransfers,
  Block,
  MempoolTransaction,
  Transaction,
} from '@stacks/stacks-blockchain-api-types';

export const HIRO_API_URL = 'https://stacks-node-api.mainnet.stacks.co';
export const HIRO_TESTNET_API_URL = 'https://stacks-node-api.testnet.stacks.co';

function getWsUrl(url: string): URL {
  let urlObj: URL;
  try {
    urlObj = new URL(url);
    if (!urlObj.protocol || !urlObj.host) {
      throw new TypeError(`[ERR_INVALID_URL]: Invalid URL: ${url}`);
    }
  } catch (error) {
    console.error(`Pass an absolute URL with a protocol/schema, e.g. "wss://example.com"`);
    throw error;
  }
  return urlObj;
}

interface RxStacksConfig {
  url: string;
}

type AddressTransactionTopic = `address-transaction:${string}`;
type AddressStxBalanceTopic = `address-stx-balance:${string}`;
type Topic = 'block' | 'mempool' | AddressTransactionTopic | AddressStxBalanceTopic;

interface ClientToServerMessages {
  subscribe: (topic: Topic | Topic[], callback: (error: string | null) => void) => void;
  unsubscribe: (...topic: Topic[]) => void;
}

interface ServerToClientMessages {
  block: (block: Block) => void;
  mempool: (transaction: MempoolTransaction) => void;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore scheduled for support in TS v4.3 https://github.com/microsoft/TypeScript/pull/26797
  [key: AddressTransactionTopic]: (
    address: string,
    stxBalance: AddressTransactionWithTransfers
  ) => void;
  'address-transaction': (address: string, tx: AddressTransactionWithTransfers) => void;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore scheduled for support in TS v4.3 https://github.com/microsoft/TypeScript/pull/26797
  [key: AddressStxBalanceTopic]: (address: string, stxBalance: AddressStxBalanceResponse) => void;
  'address-stx-balance': (address: string, stxBalance: AddressStxBalanceResponse) => void;
}
export class RxStacks {
  private apiConfig = new Configuration({ basePath: this.config.url });
  private blocksApi = new BlocksApi(this.apiConfig);
  private txApi = new TransactionsApi(this.apiConfig);
  private socket: Socket<ServerToClientMessages, ClientToServerMessages>;

  constructor(public config: RxStacksConfig) {
    console.log('Init RxStacks');
    this.socket = io(getWsUrl(this.apiConfig.basePath).href, {
      query: {
        subscriptions: ['block', 'mempool'].join(','),
      },
    });
  }

  private createEventObservable<T>(
    topic: Topic,
    eventName: keyof ServerToClientMessages,
    handler: (subscriber: Subscriber<T>) => (...prop: any) => void
  ) {
    return new Observable<T>(subscriber => {
      this.socket.emit('subscribe', topic, err => console.log(err));
      this.socket.on(eventName, handler(subscriber));
    });
  }

  blocks$ = this.createEventObservable<Block>('block', 'block', subscriber => block =>
    subscriber.next(block)
  );

  mempoolTxs$ = this.createEventObservable<MempoolTransaction>(
    'mempool',
    'mempool',
    subscriber => mempool => subscriber.next(mempool)
  );

  txs$: Observable<Transaction> = this.blocks$.pipe(
    concatMap(block => Promise.all(block.txs.map(txId => this.txApi.getTransactionById({ txId })))),
    concatMap(arr => from(arr as Transaction[]))
  );

  getAddressTransaction(address: string): Observable<AddressTransactionWithTransfers> {
    return this.createEventObservable<AddressTransactionWithTransfers>(
      `address-transactions:${address}` as AddressTransactionTopic,
      'address-transaction',
      subscriber => (addr: string, tx) => {
        if (address === addr) subscriber.next(tx);
      }
    );
  }

  initialBlockHeight$ = from(this.blocksApi.getBlockList({ limit: 1 })).pipe(
    map(resp => resp.results[0].height)
  );

  currentBlockHeight$ = new Subject<number>();

  polling = {
    blocksPolling$: merge(this.initialBlockHeight$, this.currentBlockHeight$).pipe(
      concatMap(height => {
        return timer(0, 20000).pipe(
          tap(() => console.log('Polling for block ', height + 1)),
          concatMap(() =>
            from(this.blocksApi.getBlockByHeight({ height: height + 1 })).pipe(
              catchError(() => EMPTY)
            )
          ),
          take(1),
          tap(block => this.currentBlockHeight$.next(block.height))
        );
      })
    ),

    mempoolTxsPolling$: from(this.txApi.getMempoolTransactionList({})).pipe(
      tap(initialResults => console.log(initialResults))
    ),
  };
}
