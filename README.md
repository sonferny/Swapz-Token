# Swapz BEP20 Contract

### Deployments

| Contract | Address (mainnet) | Notes |
|-|-|-|
| `$SWAPZ` | [`0xd522A1DcE1CA4B138DDA042a78672307eb124CC2`](https://bscscan.com/address/0xd522A1DcE1CA4B138DDA042a78672307eb124CC2) | $SWAPZ Token |
### Development

Install dependencies via NPM:

```bash
npm i -D
```

Compile contracts via Hardhat:

```bash
npx hardhat compile
```

### Networks

By default, Hardhat uses the Hardhat Network in-process.

### Testing

To run the tests via Hardhat, run:

```bash
npx hardhat test
```

Generate a code coverage report using `solidity-coverage`:

```bash
npx hardhat coverage
```

Need to update init_hash in UniswapV2Factory to for local Uniswap instance to work.