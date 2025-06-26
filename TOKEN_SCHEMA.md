# BeaconAI Identity Token Schema

## Overview

The BeaconAI identity token is a cryptographically signed, compact data structure that encodes biometric and semantic identity information for offline verification.

## 🗺️ Token Structure

### Base Token Format

```json
{
  "version": "1.0",
  "id": "uuid_v4",
  "biometric_vector": "base64_encoded_vector",
  "semantic_vector": "base64_encoded_vector",
  "metadata": {
    "created_at": "2025-05-16T00:00:00Z",
    "expires_at": "2025-05-17T00:00:00Z",
    "issuer": "BeaconAI:LocalSession01",
    "event_id": "optional_event_identifier",
    "permissions": ["discover", "verify", "exchange"],
    "revocation_id": "optional_revocation_identifier"
  },
  "signature": "ed25519_signature_base64"
}
```

### Field Specifications

#### Core Fields

| Field | Type | Size | Description |
|-------|------|------|-------------|
| `version` | String | 8 bytes | Token format version (semver) |
| `id` | String | 36 bytes | Unique token identifier (UUID v4) |
| `biometric_vector` | String | ~172 bytes | Base64-encoded 128-dim float32 vector |
| `semantic_vector` | String | ~172 bytes | Base64-encoded 128-dim float32 vector |
| `signature` | String | 88 bytes | Ed25519 signature (base64) |

#### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `created_at` | ISO8601 | Yes | Token creation timestamp |
| `expires_at` | ISO8601 | Yes | Token expiration timestamp |
| `issuer` | String | Yes | Token issuer identifier |
| `event_id` | String | No | Event or session identifier |
| `permissions` | Array | Yes | Allowed operations |
| `revocation_id` | String | No | Revocation list identifier |

## 🔢 Vector Specifications

### Biometric Vector

**Dimensions**: 128 (float32)
**Range**: [-1.0, 1.0] (normalized)
**Encoding**: IEEE 754 single precision

```python
# Example biometric vector structure
biometric_vector = {
    "face_embedding": [0.123, -0.456, 0.789, ...],  # 128 dimensions
    "encoding_model": "FaceNet_v1.0",
    "normalization": "l2_norm"
}
```

### Semantic Vector

**Dimensions**: 128 (float32)
**Range**: [-1.0, 1.0] (normalized)
**Source**: Compressed 768-dim BERT embedding

```python
# Example semantic vector structure
semantic_vector = {
    "text_embedding": [0.234, -0.567, 0.890, ...],  # 128 dimensions
    "source_text": "John Doe, Senior Engineer, TechCorp",
    "encoding_model": "TinyBERT_v1.0",
    "compression": "PCA_128"
}
```

## 🔐 Cryptographic Specifications

### Signing Algorithm

**Algorithm**: Ed25519 (EdDSA)
**Key Size**: 32 bytes (private), 32 bytes (public)
**Signature Size**: 64 bytes

### Signing Process

```python
def create_signature(token_data, private_key):
    # 1. Serialize token data (excluding signature field)
    canonical_data = cbor.dumps(token_data, sort_keys=True)
    
    # 2. Create Ed25519 signature
    signature = ed25519.sign(canonical_data, private_key)
    
    # 3. Encode as base64
    return base64.b64encode(signature).decode('utf-8')
```

### Verification Process

```python
def verify_signature(token, public_key):
    # 1. Extract signature
    signature = base64.b64decode(token['signature'])
    
    # 2. Recreate canonical data
    token_copy = token.copy()
    del token_copy['signature']
    canonical_data = cbor.dumps(token_copy, sort_keys=True)
    
    # 3. Verify signature
    return ed25519.verify(signature, canonical_data, public_key)
```

## 📎 Serialization Formats

### Compact Binary (CBOR)

**Use Case**: BLE transmission, storage
**Size**: ~600-800 bytes
**Encoding**: CBOR (RFC 7049)

```python
# CBOR serialization
import cbor2

def serialize_token(token):
    return cbor2.dumps(token)

def deserialize_token(cbor_data):
    return cbor2.loads(cbor_data)
```

### JSON Format

**Use Case**: Debugging, API interchange
**Size**: ~1200-1500 bytes
**Encoding**: UTF-8 JSON

```python
# JSON serialization
import json

def serialize_token_json(token):
    return json.dumps(token, separators=(',', ':'))
```

### QR Code Format

**Use Case**: Visual sharing, backup
**Encoding**: Base64-encoded CBOR
**QR Version**: 10-15 (depending on token size)

```python
# QR code generation
import qrcode
import base64

def generate_qr_token(token):
    cbor_data = cbor2.dumps(token)
    b64_data = base64.b64encode(cbor_data).decode('utf-8')
    qr = qrcode.make(b64_data)
    return qr
```

## 🔄 Token Lifecycle

### Creation

1. **Profile Setup**: User provides biometric and semantic data
2. **Vector Generation**: ML models encode data into vectors
3. **Metadata Assembly**: Add timestamps, permissions, issuer info
4. **Signing**: Create Ed25519 signature over canonical token
5. **Storage**: Save to secure local storage

### Exchange

1. **Discovery**: BLE advertising announces token availability
2. **Connection**: Establish secure BLE connection
3. **Authentication**: Optional challenge-response
4. **Transfer**: Send token via BLE characteristic
5. **Verification**: Recipient validates signature and vectors

### Expiration

1. **Time-based**: Automatic expiration after configured TTL
2. **Event-based**: Invalidation when event ends
3. **Manual**: User-initiated revocation
4. **Cleanup**: Remove expired tokens from storage

## 🔒 Security Considerations

### Token Integrity

- **Immutable**: Tokens cannot be modified after signing
- **Tamper-evident**: Signature verification detects modifications
- **Replay protection**: Nonce and timestamp prevent reuse

### Privacy Protection

- **Selective revelation**: Only necessary data is shared
- **Pseudonymous**: No direct PII in biometric vectors
- **Ephemeral**: Short-lived tokens reduce exposure

### Revocation Mechanism

```json
{
  "revocation_list": {
    "version": "1.0",
    "created_at": "2025-05-16T00:00:00Z",
    "revoked_tokens": [
      "token_id_1",
      "token_id_2"
    ],
    "signature": "revocation_list_signature"
  }
}
```

## 📊 Token Analytics

### Size Analysis

| Component | Size (bytes) | Percentage |
|-----------|--------------|------------|
| Biometric Vector | 512 | 65% |
| Semantic Vector | 512 | 65% |
| Metadata | 150 | 19% |
| Signature | 88 | 11% |
| **Total (JSON)** | **~1300** | **100%** |
| **Total (CBOR)** | **~800** | **62%** |

### Performance Metrics

- **Generation Time**: <100ms on modern mobile devices
- **Verification Time**: <50ms for signature + vectors
- **Transmission Time**: <2s over BLE connection
- **Storage Overhead**: <1KB per token

## 🔧 Implementation Examples

### TypeScript Interface

```typescript
interface BeaconAIToken {
  version: string;
  id: string;
  biometric_vector: string; // base64
  semantic_vector: string;   // base64
  metadata: {
    created_at: string;
    expires_at: string;
    issuer: string;
    event_id?: string;
    permissions: string[];
    revocation_id?: string;
  };
  signature: string; // base64
}

interface TokenVector {
  data: Float32Array;
  model: string;
  normalization: string;
}
```

### Validation Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "id", "biometric_vector", "semantic_vector", "metadata", "signature"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$"
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "biometric_vector": {
      "type": "string",
      "contentEncoding": "base64"
    },
    "semantic_vector": {
      "type": "string",
      "contentEncoding": "base64"
    },
    "signature": {
      "type": "string",
      "contentEncoding": "base64",
      "minLength": 88,
      "maxLength": 88
    }
  }
}
```