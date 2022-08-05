# ox_core client and server wrapper

Player and vehicle classes for ox_core with full type support.

## Installation

```yaml
# With pnpm
pnpm add @overextended/ox_core

# With Yarn
yarn add @overextended/ox_core

# With npm
npm install @overextended/ox_core
```

## Usage
Modules are split into client and server ones.
You can look at type declaration files for exported functions that you can use.

### Example

**Getting player server side:**
```ts
import { GetPlayer } from '@overextended/ox_core/server'

const OxPlayer = GetPlayer(source)
```

**Getting player groups client side:**
```ts
import { player } from '@overextended/ox_core/client'

console.log(player?.groups)
```


## Documentation
[View documentation](https://overextended.github.io/docs/ox_core)
