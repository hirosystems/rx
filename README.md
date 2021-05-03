# @stacks/rx

[![Build and test status](https://github.com/metachris/typescript-boilerplate/workflows/Lint%20and%20test/badge.svg)](https://github.com/metachris/micropython-ctl/actions?query=workflow%3A%22Build+and+test%22)

Reactive Extensions client for the Stacks Blockchain 🚀

## Getting Started

```bash
yarn add @stacks/rx rxjs
```

## Example usage

```ts
import { RxStacks, HIRO_API_URL } from '@stacks/rx';

const client = new RxStacks({ url: HIRO_API_URL });

client.blocks$.subscribe(block => console.log('New block: ', block.height));
```

## Resources

- [RxJS documentation](https://rxjs-dev.firebaseapp.com/guide/overview)
- [RxJS 7 Live Asia 2021 talk by @benlesh](https://docs.google.com/presentation/d/1-LU7YE3NWw8jHeAgdmLu4CBfG7osCx6MsSIeFs16k60/edit#slide=id.gd5a1fd8e28_0_415)
- [RxJS marble diagrams](https://rxmarbles.com/)
