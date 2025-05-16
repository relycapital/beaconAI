# 🧩 BeaconAI – Data Model

### 🗂️ 1. `UserProfile`

Stores the local user’s identity for BLE broadcast and UI display.

```json
{
  "id": "uuid",                  // Locally generated unique user ID
  "name": "string",
  "role": "string",
  "company": "string",
  "avatar_uri": "string (optional)",
  "social_links": {
    "linkedin": "string",
    "twitter": "string",
    "email": "string"
  },
  "interest_tags": ["string"],   // Optional (v1.1+)
  "qr_code": "string",           // Base64 (v1.1+)
  "last_updated": "timestamp"
}

```

---

### 🛰️ 2. `PeerDevice`

Stores information about a nearby discovered device.

```json
{
  "peer_id": "uuid",
  "name": "string",
  "role": "string",
  "company": "string",
  "avatar_uri": "string",
  "interest_tags": ["string"],    // Optional (v1.1+)
  "rssi": "number",               // Signal strength for proximity estimation (v1.1+)
  "discovered_at": "timestamp",
  "expires_at": "timestamp",
  "session_id": "uuid",           // Link to discovery session
  "contact_saved": "boolean"
}

```

---

### 🧭 3. `DiscoverySession`

Logs the ephemeral peer discovery session (optional for MVP, default to local only).

```json
{
  "session_id": "uuid",
  "started_at": "timestamp",
  "ended_at": "timestamp",
  "mode": "string",               // e.g. "default" | "event"
  "room_code": "string",          // v1.1+ Event Mode
  "session_name": "string",       // v1.1+ Event Mode
  "peer_ids": ["uuid"]
}

```

---

### 📒 4. `ConnectionLog` (v1.1+)

Optional local history of people discovered.

```json
{
  "log_id": "uuid",
  "peer_id": "uuid",
  "session_id": "uuid",
  "saved": "boolean",             // Did user tap save?
  "notes": "string",              // Optional: custom notes or tags
  "interaction_type": "string",   // e.g. "viewed" | "saved" | "shared"
  "timestamp": "timestamp"
}

```

---

### 💬 5. `ConversationStarter` (AI suggestion – v1.1+)

Locally suggested openers based on tags or shared interests.

```json
{
  "starter_id": "uuid",
  "context_tags": ["string"],   // e.g. ["developer", "ai", "web3"]
  "text": "string",
  "displayed_count": "integer",
  "created_at": "timestamp"
}

```

---

### 🧩 6. `Settings`

Local preferences for broadcast and scan behaviors.

```json
{
  "scan_interval": "integer",     // in seconds
  "advertising_enabled": "boolean",
  "notifications_enabled": "boolean",
  "auto_expire_timeout": "integer", // in minutes
  "privacy_mode": "boolean",
  "default_discovery_mode": "string"  // e.g. "default" | "event"
}

```

---

### 🛠️ Storage Notes

- Use **AsyncStorage** or **MMKV** for high-performance local storage.
- `PeerDevice` and `DiscoverySession` can be cleared on app close or persisted short-term.
- `UserProfile` and `Settings` should be persistent across sessions.
- `ConnectionLog` can be pruned periodically to save space.

---

 **Supabase JSON format:**

---

### 📦 `user_profile`

```json
{
  "table": "user_profile",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "name", "type": "text" },
    { "name": "role", "type": "text" },
    { "name": "company", "type": "text" },
    { "name": "avatar_uri", "type": "text" },
    { "name": "social_links", "type": "jsonb" },
    { "name": "interest_tags", "type": "text[]" },
    { "name": "qr_code", "type": "text" },
    { "name": "last_updated", "type": "timestamp with time zone" }
  ]
}

```

---

### 📡 `peer_device`

```json
{
  "table": "peer_device",
  "columns": [
    { "name": "peer_id", "type": "uuid", "primary_key": true },
    { "name": "name", "type": "text" },
    { "name": "role", "type": "text" },
    { "name": "company", "type": "text" },
    { "name": "avatar_uri", "type": "text" },
    { "name": "interest_tags", "type": "text[]" },
    { "name": "rssi", "type": "integer" },
    { "name": "discovered_at", "type": "timestamp with time zone" },
    { "name": "expires_at", "type": "timestamp with time zone" },
    { "name": "session_id", "type": "uuid", "references": "discovery_session.id" },
    { "name": "contact_saved", "type": "boolean" }
  ]
}

```

---

### ⏱️ `discovery_session`

```json
{
  "table": "discovery_session",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "started_at", "type": "timestamp with time zone" },
    { "name": "ended_at", "type": "timestamp with time zone" },
    { "name": "mode", "type": "text" },
    { "name": "room_code", "type": "text" },
    { "name": "session_name", "type": "text" }
  ]
}

```

---

### 📘 `connection_log`

```json
{
  "table": "connection_log",
  "columns": [
    { "name": "log_id", "type": "uuid", "primary_key": true },
    { "name": "peer_id", "type": "uuid", "references": "peer_device.peer_id" },
    { "name": "session_id", "type": "uuid", "references": "discovery_session.id" },
    { "name": "saved", "type": "boolean" },
    { "name": "notes", "type": "text" },
    { "name": "interaction_type", "type": "text" },
    { "name": "timestamp", "type": "timestamp with time zone" }
  ]
}

```

---

### 💬 `conversation_starter`

```json
{
  "table": "conversation_starter",
  "columns": [
    { "name": "starter_id", "type": "uuid", "primary_key": true },
    { "name": "context_tags", "type": "text[]" },
    { "name": "text", "type": "text" },
    { "name": "displayed_count", "type": "integer" },
    { "name": "created_at", "type": "timestamp with time zone" }
  ]
}

```

---

### ⚙️ `settings`

```json
{
  "table": "settings",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "scan_interval", "type": "integer" },
    { "name": "advertising_enabled", "type": "boolean" },
    { "name": "notifications_enabled", "type": "boolean" },
    { "name": "auto_expire_timeout", "type": "integer" },
    { "name": "privacy_mode", "type": "boolean" },
    { "name": "default_discovery_mode", "type": "text" }
  ]
}

```

---

Would you like me to generate SQL import scripts for Supabase next?

Here is the **BeaconAI Data Model in Supabase JSON format**, designed to match your React Native app's local-first architecture, with **Post-MVP stretch features** included. This format can be directly used to set up tables in Supabase.

---

### 📦 `user_profile`

```json
{
  "table": "user_profile",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "name", "type": "text" },
    { "name": "role", "type": "text" },
    { "name": "company", "type": "text" },
    { "name": "avatar_uri", "type": "text" },
    { "name": "social_links", "type": "jsonb" },
    { "name": "interest_tags", "type": "text[]" },
    { "name": "qr_code", "type": "text" },
    { "name": "last_updated", "type": "timestamp with time zone" }
  ]
}

```

---

### 📡 `peer_device`

```json
{
  "table": "peer_device",
  "columns": [
    { "name": "peer_id", "type": "uuid", "primary_key": true },
    { "name": "name", "type": "text" },
    { "name": "role", "type": "text" },
    { "name": "company", "type": "text" },
    { "name": "avatar_uri", "type": "text" },
    { "name": "interest_tags", "type": "text[]" },
    { "name": "rssi", "type": "integer" },
    { "name": "discovered_at", "type": "timestamp with time zone" },
    { "name": "expires_at", "type": "timestamp with time zone" },
    { "name": "session_id", "type": "uuid", "references": "discovery_session.id" },
    { "name": "contact_saved", "type": "boolean" }
  ]
}

```

---

### ⏱️ `discovery_session`

```json
{
  "table": "discovery_session",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "started_at", "type": "timestamp with time zone" },
    { "name": "ended_at", "type": "timestamp with time zone" },
    { "name": "mode", "type": "text" },
    { "name": "room_code", "type": "text" },
    { "name": "session_name", "type": "text" }
  ]
}

```

---

### 📘 `connection_log`

```json
{
  "table": "connection_log",
  "columns": [
    { "name": "log_id", "type": "uuid", "primary_key": true },
    { "name": "peer_id", "type": "uuid", "references": "peer_device.peer_id" },
    { "name": "session_id", "type": "uuid", "references": "discovery_session.id" },
    { "name": "saved", "type": "boolean" },
    { "name": "notes", "type": "text" },
    { "name": "interaction_type", "type": "text" },
    { "name": "timestamp", "type": "timestamp with time zone" }
  ]
}

```

---

### 💬 `conversation_starter`

```json
{
  "table": "conversation_starter",
  "columns": [
    { "name": "starter_id", "type": "uuid", "primary_key": true },
    { "name": "context_tags", "type": "text[]" },
    { "name": "text", "type": "text" },
    { "name": "displayed_count", "type": "integer" },
    { "name": "created_at", "type": "timestamp with time zone" }
  ]
}

```

---

### ⚙️ `settings`

```json
{
  "table": "settings",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "scan_interval", "type": "integer" },
    { "name": "advertising_enabled", "type": "boolean" },
    { "name": "notifications_enabled", "type": "boolean" },
    { "name": "auto_expire_timeout", "type": "integer" },
    { "name": "privacy_mode", "type": "boolean" },
    { "name": "default_discovery_mode", "type": "text" }
  ]
}

```

---

Would you like me to generate SQL import scripts for Supabase next?

Here is the **BeaconAI Data Model in Supabase JSON format**, designed to match your React Native app's local-first architecture, with **Post-MVP stretch features** included. This format can be directly used to set up tables in Supabase.

---

### 📦 `user_profile`

```json
{
  "table": "user_profile",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "name", "type": "text" },
    { "name": "role", "type": "text" },
    { "name": "company", "type": "text" },
    { "name": "avatar_uri", "type": "text" },
    { "name": "social_links", "type": "jsonb" },
    { "name": "interest_tags", "type": "text[]" },
    { "name": "qr_code", "type": "text" },
    { "name": "last_updated", "type": "timestamp with time zone" }
  ]
}

```

---

### 📡 `peer_device`

```json
{
  "table": "peer_device",
  "columns": [
    { "name": "peer_id", "type": "uuid", "primary_key": true },
    { "name": "name", "type": "text" },
    { "name": "role", "type": "text" },
    { "name": "company", "type": "text" },
    { "name": "avatar_uri", "type": "text" },
    { "name": "interest_tags", "type": "text[]" },
    { "name": "rssi", "type": "integer" },
    { "name": "discovered_at", "type": "timestamp with time zone" },
    { "name": "expires_at", "type": "timestamp with time zone" },
    { "name": "session_id", "type": "uuid", "references": "discovery_session.id" },
    { "name": "contact_saved", "type": "boolean" }
  ]
}

```

---

### ⏱️ `discovery_session`

```json
{
  "table": "discovery_session",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "started_at", "type": "timestamp with time zone" },
    { "name": "ended_at", "type": "timestamp with time zone" },
    { "name": "mode", "type": "text" },
    { "name": "room_code", "type": "text" },
    { "name": "session_name", "type": "text" }
  ]
}

```

---

### 📘 `connection_log`

```json
{
  "table": "connection_log",
  "columns": [
    { "name": "log_id", "type": "uuid", "primary_key": true },
    { "name": "peer_id", "type": "uuid", "references": "peer_device.peer_id" },
    { "name": "session_id", "type": "uuid", "references": "discovery_session.id" },
    { "name": "saved", "type": "boolean" },
    { "name": "notes", "type": "text" },
    { "name": "interaction_type", "type": "text" },
    { "name": "timestamp", "type": "timestamp with time zone" }
  ]
}

```

---

### 💬 `conversation_starter`

```json
{
  "table": "conversation_starter",
  "columns": [
    { "name": "starter_id", "type": "uuid", "primary_key": true },
    { "name": "context_tags", "type": "text[]" },
    { "name": "text", "type": "text" },
    { "name": "displayed_count", "type": "integer" },
    { "name": "created_at", "type": "timestamp with time zone" }
  ]
}

```

---

### ⚙️ `settings`

```json
{
  "table": "settings",
  "columns": [
    { "name": "id", "type": "uuid", "primary_key": true },
    { "name": "scan_interval", "type": "integer" },
    { "name": "advertising_enabled", "type": "boolean" },
    { "name": "notifications_enabled", "type": "boolean" },
    { "name": "auto_expire_timeout", "type": "integer" },
    { "name": "privacy_mode", "type": "boolean" },
    { "name": "default_discovery_mode", "type": "text" }
  ]
}

```

---
