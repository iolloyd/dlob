# Decentralized Limit Order Book (DLOB)

A gas-efficient, decentralized limit order book implementation optimized for Layer 2 networks (BASE and OP Stack). Features a mobile-first Progressive Web App interface and comprehensive testing suite.

## Features

- **Smart Contract**
  - Gas-optimized order matching
  - Support for limit orders (buy/sell)
  - Partial fill functionality
  - Order cancellation with automatic refunds
  - Price-time priority matching

- **Frontend**
  - Mobile-first Progressive Web App
  - Real-time order book visualization
  - Interactive price charts
  - Wallet integration
  - Responsive design using Tailwind CSS

- **Testing & Deployment**
  - Comprehensive test suite
  - Automated deployment scripts
  - Contract verification
  - Local development environment

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or later)
- Yarn or npm
- Git
- MetaMask or similar Web3 wallet

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dlob.git
   cd dlob
   ```

2. **Install dependencies**
   ```bash
   # Install contract dependencies
   yarn install

   # Install frontend dependencies
   cd frontend
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   # In project root
   cp .env.example .env

   # Fill in your environment variables
   PRIVATE_KEY=your_private_key
   ALCHEMY_API_KEY=your_alchemy_key
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

4. **Start local blockchain**
   ```bash
   # In project root
   yarn hardhat node
   ```

5. **Deploy contracts locally**
   ```bash
   # In new terminal
   yarn hardhat run scripts/deploy.js --network localhost
   ```

6. **Start frontend**
   ```bash
   # In frontend directory
   yarn dev
   ```

7. **Run tests**
   ```bash
   # In project root
   yarn test
   ```

## 🏗️ Project Structure

```
dlob/
├── contracts/                # Smart contracts
│   ├── LimitOrderBook.sol
│   └── mocks/
├── frontend/                 # React frontend
│   ├── components/
│   ├── hooks/
│   └── pages/
├── scripts/                  # Deployment scripts
├── test/                    # Test files
└── hardhat.config.js       # Hardhat configuration
```

## 🔧 Configuration

### Networks

The project is configured for the following networks:

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    hardhat: {},
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
    },
    baseGoerli: {
      url: "https://goerli.base.org",
      chainId: 84531,
    },
    optimism: {
      url: "https://mainnet.optimism.io",
      chainId: 10,
    }
  }
}
```

### Environment Variables

Required environment variables:

```bash
PRIVATE_KEY=         # Your deployment wallet private key
ALCHEMY_API_KEY=     # Alchemy API key for network access
ETHERSCAN_API_KEY=   # For contract verification
```

## 📱 PWA Setup

1. **Enable PWA**
   ```bash
   # In frontend directory
   yarn add next-pwa
   ```

2. **Update next.config.js**
   ```javascript
   const withPWA = require('next-pwa');

   module.exports = withPWA({
     pwa: {
       dest: 'public',
       register: true,
       skipWaiting: true,
     },
   });
   ```

## Deployment

### Contract Deployment

1. **Deploy to testnet**
   ```bash
   yarn hardhat run scripts/deploy.js --network baseGoerli
   ```

2. **Verify contract**
   ```bash
   yarn hardhat verify --network baseGoerli DEPLOYED_CONTRACT_ADDRESS
   ```

### Frontend Deployment

1. **Build frontend**
   ```bash
   cd frontend
   yarn build
   ```

#### Option 1: vercel deployment
2. **Deploy to Vercel**
   ```bash
   vercel deploy
   ```
#### Option 2: fly.io Deployment

1. **Install Fly CLI**
   ```bash
   # On macOS
   brew install flyctl

   # On Linux
   curl -L https://fly.io/install.sh | sh

   # On Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
## Testing

### Run Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test test/LimitOrderBook.test.js

# Run tests with coverage
yarn coverage
```

### Test Coverage

To generate a coverage report:

```bash
yarn coverage
```

Coverage report will be available in `coverage/index.html`

## 🔐 Security

- All smart contracts are thoroughly tested
- Implements reentrancy guards
- Uses SafeMath for calculations
- Follows checks-effects-interactions pattern
- Regular security audits recommended before mainnet deployment

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- OpenZeppelin for secure contract implementations
- Optimism team for L2 infrastructure
- Base team for L2 infrastructure
- shadcn/ui for UI components

## Support

For support, please open an issue in the GitHub repository or reach out to the team on Discord.
