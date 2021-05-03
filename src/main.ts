import { EMPTY, from, merge, Subject, timer } from 'rxjs';
import { Configuration, BlocksApi } from '@stacks/blockchain-api-client';
import { catchError, concatMap, map, tap, take } from 'rxjs/operators';

export const HIRO_API_URL = 'https://stacks-node-api.mainnet.stacks.co';
export const HIRO_TESTNET_API_URL = 'https://stacks-node-api.testnet.stacks.co';

interface RxStacksConfig {
  url: string;
}

export class RxStacks {
  private apiConfig = new Configuration({
    basePath: this.config.url,
  });
  private blocksApi = new BlocksApi(this.apiConfig);

  constructor(public config: RxStacksConfig) {}

  initialBlockHeight$ = from(this.blocksApi.getBlockList({ limit: 1 })).pipe(
    map(resp => resp.results[0].height)
  );

  currentBlockHeight$ = new Subject<number>();

  blocks$ = merge(this.initialBlockHeight$, this.currentBlockHeight$).pipe(
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
  );
}
