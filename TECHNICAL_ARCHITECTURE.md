# BeaconAI Technical Architecture

## Overview

BeaconAI implements a three-layer architecture combining biometric encoding, cryptographic signing, and proximity-based discovery for offline identity verification.

## 🔧 Technical Workflow

### 1. Local Identity Capture

Each user creates a lightweight identity profile through multi-modal data collection:

#### Biometric Collection
- **Selfie capture** using device camera
- **Fingerprint** (optional, platform-dependent)
- **Voice sample** (future enhancement)

#### Semantic Information
- Name, role, organization
- Professional credentials
- Event-specific metadata

### 2. Vector Encoding Pipeline

#### Biometric Vector Generation
```
Selfie Image → MobileNetV2/FaceNet → 128/512-dim vector
Fingerprint → Custom CNN → 256-dim vector
```

**Models:**
- **FaceNet**: 128-dimensional face embeddings
- **MobileNetV2**: Lightweight feature extraction
- **Custom Fingerprint CNN**: Minutiae-based encoding

#### Semantic Vector Generation
```
Text Input → TinyBERT/DistilBERT → 768-dim vector → PCA → 128-dim vector
```

**Models:**
- **TinyBERT**: Compressed BERT for mobile deployment
- **DistilBERT**: Knowledge distillation for efficiency
- **PCA Compression**: Dimensionality reduction

### 3. Token Creation & Signing

#### Identity Token Structure
```json
{
  "version": "1.0",
  "biometric_vector": "base64_encoded_vector",
  "semantic_vector": "base64_encoded_vector",
  "metadata": {
    "created_at": "2025-05-16T00:00:00Z",
    "expires_at": "2025-05-17T00:00:00Z",
    "issuer": "BeaconAI:LocalSession01",
    "event_id": "conf2025_tech_summit",
    "permissions": ["discover", "verify"]
  },
  "signature": "ed25519_signature_base64"
}
```

#### Cryptographic Operations
1. **Key Generation**: Ed25519 keypair creation
2. **Token Serialization**: CBOR encoding for compactness
3. **Signing**: Ed25519 signature over serialized token
4. **Verification**: Public key validation

### 4. Bluetooth Discovery Protocol

#### BLE Advertisement Structure
```
Service UUID: 0x180F (Custom BeaconAI service)
Characteristics:
  - Identity Metadata (0x2A00): Anonymized profile info
  - Token Exchange (0x2A01): Full token on connection
  - Verification (0x2A02): Challenge-response validation
```

#### Discovery Flow
1. **Advertising**: Broadcast anonymized metadata
2. **Scanning**: Detect nearby BeaconAI devices
3. **Connection**: Establish BLE GATT connection
4. **Token Exchange**: Share identity tokens
5. **Verification**: Validate signatures and vectors

### 5. On-Device Verification

#### Signature Validation
```python
def verify_token(token, public_key):
    # 1. Parse token structure
    # 2. Verify Ed25519 signature
    # 3. Check expiration
    # 4. Validate issuer
    return is_valid
```

#### Biometric Verification (Optional)
```python
def verify_biometric(stored_vector, live_capture):
    # 1. Capture new biometric sample
    # 2. Generate vector using same model
    # 3. Compute cosine similarity
    # 4. Apply threshold (e.g., 0.85)
    return similarity_score > threshold
```

## 🏗️ System Architecture

### Mobile Application Layer
- **React Native** frontend
- **TypeScript** for type safety
- **React Context** for state management
- **Expo** for development workflow

### ML/AI Layer
- **TensorFlow Lite** for on-device inference
- **MediaPipe** for face detection preprocessing
- **CoreML** (iOS) / **ML Kit** (Android) integration
- **ONNX Runtime** for cross-platform models

### Cryptography Layer
- **libsodium** (via react-native-sodium)
- **Ed25519** for digital signatures
- **ChaCha20-Poly1305** for token encryption
- **JOSE** for JSON Web Token compatibility

### Storage Layer
- **MMKV** for high-performance key-value storage
- **SecureStore** for sensitive data encryption
- **SQLite** for structured data (optional)
- **Keychain** (iOS) / **Keystore** (Android) for keys

### Bluetooth Layer
- **react-native-ble-plx** for BLE operations
- **Custom GATT services** for BeaconAI protocol
- **Background processing** for continuous discovery
- **Power optimization** for battery efficiency

## 🔄 Data Flow

```
[User Input] → [Biometric Capture] → [Vector Encoding]
     ↓
[Semantic Input] → [Text Embedding] → [Vector Compression]
     ↓
[Token Creation] → [Cryptographic Signing] → [Local Storage]
     ↓
[BLE Advertising] ↔ [Peer Discovery] ↔ [Token Exchange]
     ↓
[Verification] → [UI Display] → [User Interaction]
```

## 🚀 Performance Optimizations

### Model Quantization
- **INT8 quantization** for TensorFlow Lite models
- **Dynamic range quantization** to reduce model size
- **Model pruning** to remove unnecessary parameters

### Caching Strategy
- **Vector caching** to avoid re-computation
- **Model caching** for faster inference
- **Token caching** with TTL expiration

### Battery Optimization
- **Adaptive scanning intervals** based on discovery activity
- **Background task optimization** for iOS/Android
- **CPU/GPU workload balancing** for ML inference

## 📱 Platform Considerations

### iOS Specific
- **Core ML** integration for native performance
- **Background App Refresh** limitations
- **Privacy permissions** for camera/biometrics

### Android Specific
- **ML Kit** for Google services integration
- **Doze mode** compatibility
- **Runtime permissions** handling

## 🔍 Testing Strategy

### Unit Testing
- **Vector encoding accuracy** tests
- **Cryptographic operations** validation
- **Token serialization/deserialization** tests

### Integration Testing
- **BLE discovery** end-to-end scenarios
- **Cross-platform compatibility** testing
- **Performance benchmarking** on target devices

### Security Testing
- **Penetration testing** of BLE protocol
- **Cryptographic audit** of signing implementation
- **Privacy assessment** of data handling