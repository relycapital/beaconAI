# 🏃‍♂️ BeaconAI MVP Sprint Plan

**Duration**: 2 Weeks (10 working days)

**Team**: 2 developers

**Goal**: Complete the MVP functionality using local storage and BLE-based peer discovery.

---

### ✅ Sprint Goals

| Day(s) | Task | Owner | Outcome |
| --- | --- | --- | --- |
| 1 | **Project Setup** – Initialize React Native app, navigation, state management (Zustand/Context), Tailwind or NativeBase setup | Dev | App skeleton ready |
| 1–2 | **Profile Screen** – Form for name, role, company, social links; store in AsyncStorage/MMKV | Dev | `UserProfile` saved locally |
| 2–3 | **BLE Integration Setup** – Configure `react-native-ble-plx`, permissions, start BLE advertiser | Dev | Device can advertise profile UUID |
| 3–4 | **Scan Nearby Peers** – Start BLE scan loop, decode payloads, display discovered users in UI | Dev | `PeerDevice` list updates live |
| 5 | **Peer List UI** – List view with name, role, company, RSSI (optional) | Dev | Basic peer discovery UX |
| 6 | **Session Control UI** – Start/stop discovery session button, local session timer | Dev | Discovery UX complete |
| 7 | **Expire Logic** – Timeout discovered users after 5 mins, clear old sessions | Dev | No persistent tracking |
| 8 | **Profile Detail Modal** – Tap profile → view expanded info with copy/share options | Dev | User can view/save contacts |
| 9 | **Settings Panel** – Toggle advertising, privacy mode, scan interval (Settings table) | Dev | Preferences applied |
| 10 | **QA, Polishing & Build** – Minor bug fixes, polish UI, finalize APK/IPA test build | Dev | MVP complete |

---

### 🧪 Stretch Goals (Post-MVP / v1.1+ Candidates)

| Feature | Description |
| --- | --- |
| QR Code Sharing | Generate/share encoded profile via QR |
| RSSI Sorting | Sort users by signal strength (proximity) |
| Tags & Filters | Add interest tags and filter discovered peers |
| Connection Log | Save viewed/saved profiles locally |
| Conversation Starters | AI-suggested openers based on profile info |
| Event Mode | Room/session codes for curated discovery |

---

### 🛠 Tools & Stack

- **React Native** + `react-native-ble-plx`
- **State**: Zustand or Context
- **Storage**: AsyncStorage or MMKV
- **UI**: Tailwind RN or NativeBase
- **Database**: Supabase (optional for Post-MVP)
- **Testing**: Manual (MVP), E2E with Detox (v1.1+)

---
