# 📱 **BeaconAI: Peer Discovery via Bluetooth**

---

## 🔍 Objective

Build a React Native mobile app that allows users to discover and connect with others **physically nearby** using **Bluetooth**, without requiring Wi-Fi, GPS, or an internet connection.

---

## 🧠 Core Feature: Bluetooth-Based Peer Discovery

### 🔧 TECH BREAKDOWN

**1. Bluetooth Low Energy (BLE)**

- Uses BLE advertising and scanning.
- Each device **broadcasts a compact, encoded user profile**.
- Other devices **scan for nearby signals** and decode the advertised data.

**Recommended React Native BLE Libraries:**

- [`react-native-ble-plx`](https://github.com/dotintent/react-native-ble-plx): BLE scanning + advertising, well-maintained.
- [`react-native-bluetooth-classic`](https://github.com/kenjdavidson/react-native-bluetooth-classic): For classic Bluetooth (fallback only if needed).

---

## 🧱 Architecture

### 1. **User Profile Setup**

- Simple local profile with:
    - `Name`
    - `Role`
    - `Company`
    - `Optional: Social links`
- Stored locally on device (AsyncStorage or MMKV).
- Generate and store a compact `UUID` to represent identity.

### 2. **BLE Advertising**

- Broadcasts a minimal profile payload (e.g., name + UUID).
- Emitted at a regular interval (e.g., every 3–5 seconds).
- Optionally use a compact binary encoding or Base64.

### 3. **BLE Scanning**

- Scans in the background or foreground for nearby BLE advertisements.
- On discovery:
    - Parse payload.
    - Display decoded profiles in the UI.
    - Use RSSI to **approximate proximity** if needed.
    - Expire/discard profiles after a timeout (e.g., 5 minutes).

### 4. **Peer List UI**

- Live-updating list of nearby users.
- UI elements:
    - Avatar placeholder
    - Name, role, and company
    - Tap action to expand or copy contact

### 5. **Connection Flow (Optional in MVP)**

- Basic options:
    - Tap to view profile
    - Copy contact info to clipboard
    - (v1.1+) Share QR code or initiate chat

---

## 🧪 UX Flow

1. Launch app → Home screen with “Discover Nearby” button
2. Tap to begin **Advertising + Scanning**
3. See a live list of nearby profiles
4. Tap a profile to view details or save info
5. End session to stop broadcasting and clear peer list

---

## 🔒 Privacy & Safety Principles

- **No GPS or internet tracking**
- **Ephemeral discovery sessions** (no persistent logs)
- Only **minimal data is broadcasted**
- Users can **opt-out anytime**
- Cached profiles expire after short intervals (~5 mins)

---

## 🧪 MVP Tech Stack

| Component | Technology |
| --- | --- |
| Framework | React Native |
| BLE Integration | `react-native-ble-plx` |
| State Management | Zustand or React Context |
| Local Storage | AsyncStorage or MMKV |
| UI/UX Styling | NativeBase or Tailwind RN |
| Backend | None for MVP (fully local) |

---

## 🚧 Reserved for v1.1+ (Post-MVP Features)

- 🔗 Share profile via **QR Code**
- 📶 Sort users by **signal proximity (RSSI)**
- 🧬 Add **interest tags** to filter or group users
- 📜 Temporary **connection log** (locally stored)
- 🧠 Suggest **conversation starters** with AI
- 📤 Export contact to phone or LinkedIn
- 🧑‍🤝‍🧑 “Event Mode” with room codes and session names

---
