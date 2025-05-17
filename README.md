# BeaconAI

A React Native mobile application for peer discovery via Bluetooth Low Energy (BLE).

![BeaconAI](https://img.shields.io/badge/BeaconAI-BLE%20Discovery-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.79.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6)
![Expo](https://img.shields.io/badge/Expo-53.0.0-000020)

## 📱 Overview

BeaconAI enables peer discovery through Bluetooth Low Energy (BLE) technology, allowing users to discover nearby devices and exchange profile information in a battery-efficient manner, with or without internet connectivity.

### Key Features

- **Cross-Platform**: Works on both iOS and Android
- **Battery-Optimized**: Smart interval scanning to preserve battery life
- **Privacy-First**: User controls for visibility and data sharing
- **Offline-First**: All functionality works without internet connectivity
- **Type-Safe**: Built with TypeScript for reliability and maintainability

## 🧪 BLE Implementation

The Bluetooth Low Energy implementation follows the BeaconAI project ruleset and Semantic Seed Coding Standards:

### Core Components

- **BleService**: Singleton service managing BLE operations
- **DiscoveryContext**: Context provider for BLE state management
- **ProfileContext**: Context provider for user profile management
- **Test Screen**: Interactive testing interface for BLE functionality

### Technical Details

- **Battery Optimization**:
  - Interval scanning (5s every 30s) rather than continuous
  - Platform-specific scan modes (LOW_POWER on Android, BALANCED on iOS)
  - Pauses scanning and advertising when app is in background

- **Privacy Controls**:
  - Permission management for BLE operations
  - User toggle for enabling/disabling discovery
  - Peer data expiration (5-minute timeout)

- **Encoded Profiles**:
  - Compact encoding for BLE advertisements (max 31 bytes)
  - Efficient profile data transmission

- **Graceful Degradation**:
  - Mock mode for testing without BLE hardware
  - Clear user feedback when Bluetooth is unavailable

## 🚀 Getting Started

### Prerequisites

- Node.js (18+)
- npm or yarn
- iOS: XCode & CocoaPods
- Android: Android Studio & SDK

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/relycapital/beaconAI.git
   cd beaconAI/mobile-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Run on iOS:
   ```bash
   npm run ios
   ```

5. Run on Android:
   ```bash
   npm run android
   ```

### Testing

Run unit and integration tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 🌐 Project Structure

```
mobile-frontend/
├── app/                  # Expo Router screens
│   └── test-ble.tsx      # BLE testing screen
├── components/           # Reusable UI components
├── context/              # React Context providers
│   ├── DiscoveryContext.tsx  # BLE discovery state management
│   └── ProfileContext.tsx    # User profile management
├── services/             # Service layer
│   └── BleService.ts     # BLE functionality
├── types/                # TypeScript type definitions
│   ├── ble.ts            # BLE-related types
│   └── profile.ts        # User profile types
├── __tests__/            # Tests
│   ├── BleService.test.ts          # Unit tests
│   └── BleDiscovery.integration.test.ts  # Integration tests
└── [configuration files]
```

## 🔄 Development Workflow

Following the Semantic Seed Coding Standards:

1. Branch Naming:
   - `feature/{id}` for new features
   - `bug/{id}` for bug fixes
   - `chore/{id}` for maintenance tasks

2. TDD Workflow:
   - Write failing tests
   - Implement to make tests pass
   - Refactor and commit

3. Commit Messages:
   - Format: `[Type] #{id} - Brief description`
   - Example: `[Feature] #6 - Add BLE advertising functionality`

## 📋 Backlog Management

Issues and tasks are managed in GitHub Issues following a structured workflow:

1. Issues are classified as:
   - Features (new functionality)
   - Bugs (problems in existing functionality)
   - Chores (maintenance tasks)

2. Point-based estimation:
   - 0 points: Quick fixes
   - 1-2 points: Straightforward tasks
   - 3-5 points: More complex tasks
   - 8+ points: Large tasks that should be broken down

## 📄 License

[MIT License](LICENSE)

## 🤝 Contributing

Contributions are welcome! Please follow the established coding standards and workflow.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m '[Feature] #id - Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request