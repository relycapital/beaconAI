// Set test environment before importing
process.env.NODE_ENV = 'test';

import { TinyMLService } from '../services/TinyMLService';
import { BiometricVector } from '../types/enhanced-profile';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/documents/',
  downloadAsync: jest.fn().mockResolvedValue({ uri: '/mock/downloaded/file' }),
}));

// Mock expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn().mockReturnValue({
      downloadAsync: jest.fn().mockResolvedValue(undefined),
      localUri: '/mock/asset/path'
    })
  }
}));

// Mock TensorFlow.js in test environment
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(true),
  version: { tfjs: '4.22.0' },
  getBackend: jest.fn().mockReturnValue('cpu'),
  browser: {
    decodeImage: jest.fn().mockReturnValue({
      dispose: jest.fn()
    })
  },
  util: {
    decodeString: jest.fn().mockReturnValue(new Uint8Array(1000))
  },
  randomUniform: jest.fn().mockReturnValue({
    dispose: jest.fn()
  })
}));

// Mock BlazeFace
jest.mock('@tensorflow-models/blazeface', () => ({
  load: jest.fn().mockResolvedValue({
    estimateFaces: jest.fn().mockResolvedValue([
      {
        topLeft: [100, 100],
        bottomRight: [200, 200],
        landmarks: [[150, 120], [170, 120], [160, 140], [150, 160], [170, 160]],
        probability: [0.95]
      }
    ])
  })
}));

// Mock Universal Sentence Encoder
jest.mock('@tensorflow-models/universal-sentence-encoder', () => ({
  load: jest.fn().mockResolvedValue({
    embed: jest.fn().mockResolvedValue({
      data: jest.fn().mockResolvedValue(new Float32Array(512).fill(0.1)),
      dispose: jest.fn()
    })
  })
}));

describe('TinyMLService', () => {
  let tinyMLService: TinyMLService;
  
  beforeEach(() => {
    tinyMLService = TinyMLService.getInstance();
    jest.clearAllMocks();
  });

  describe('Model Loading', () => {
    it('should load models successfully', async () => {
      await tinyMLService.loadModels();
      
      expect(tinyMLService.isReady()).toBe(true);
    });

    it('should handle model loading errors', async () => {
      // Mock a failed model load
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error in one of the model loading methods
      const originalMethod = (tinyMLService as any).loadBlazeFaceModel;
      (tinyMLService as any).loadBlazeFaceModel = jest.fn().mockRejectedValue(new Error('Model load failed'));
      
      await expect(tinyMLService.loadModels()).rejects.toThrow();
      
      // Restore original method
      (tinyMLService as any).loadBlazeFaceModel = originalMethod;
      consoleSpy.mockRestore();
    });

    it('should return model info', () => {
      const modelInfo = tinyMLService.getModelInfo();
      
      expect(modelInfo).toHaveProperty('faceNet');
      expect(modelInfo).toHaveProperty('textEncoder');
      expect(modelInfo.faceNet).toHaveProperty('version', 'BlazeFace_v1.0');
      expect(modelInfo.faceNet).toHaveProperty('dimensions', 128);
      expect(modelInfo.textEncoder).toHaveProperty('version', 'UniversalSentenceEncoder_v4.0');
      expect(modelInfo.textEncoder).toHaveProperty('dimensions', 128);
    });
  });

  describe('Face Encoding', () => {
    beforeEach(async () => {
      await tinyMLService.loadModels();
    });

    it('should encode face image to vector', async () => {
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
      
      const faceVector = await tinyMLService.encodeFace(mockImageData);
      
      expect(faceVector).toBeInstanceOf(Float32Array);
      expect(faceVector.length).toBe(128);
      
      // Check normalization (L2 norm should be approximately 1)
      let magnitude = 0;
      for (let i = 0; i < faceVector.length; i++) {
        magnitude += faceVector[i] * faceVector[i];
      }
      magnitude = Math.sqrt(magnitude);
      expect(magnitude).toBeCloseTo(1, 1);
    });

    it('should produce consistent encodings for same image', async () => {
      const mockImageData = 'consistent-image-data';
      
      const vector1 = await tinyMLService.encodeFace(mockImageData);
      const vector2 = await tinyMLService.encodeFace(mockImageData);
      
      expect(vector1).toEqual(vector2);
    });

    it('should produce different encodings for different images', async () => {
      const image1 = 'image-data-1';
      const image2 = 'image-data-2';
      
      const vector1 = await tinyMLService.encodeFace(image1);
      const vector2 = await tinyMLService.encodeFace(image2);
      
      expect(vector1).not.toEqual(vector2);
    });

    it('should handle invalid image data gracefully', async () => {
      const invalidImageData = '';
      
      // With real models, we expect specific error handling
      await expect(tinyMLService.encodeFace(invalidImageData)).rejects.toThrow();
    });
  });

  describe('Text Encoding', () => {
    beforeEach(async () => {
      await tinyMLService.loadModels();
    });

    it('should encode text to vector', async () => {
      const text = 'John Doe, Senior Engineer, TechCorp';
      
      const textVector = await tinyMLService.encodeText(text);
      
      expect(textVector).toBeInstanceOf(Float32Array);
      expect(textVector.length).toBe(128);
    });

    it('should produce consistent encodings for same text', async () => {
      const text = 'Test text for encoding';
      
      const vector1 = await tinyMLService.encodeText(text);
      const vector2 = await tinyMLService.encodeText(text);
      
      expect(vector1).toEqual(vector2);
    });

    it('should handle empty text', async () => {
      const emptyText = '';
      
      const vector = await tinyMLService.encodeText(emptyText);
      expect(vector).toBeInstanceOf(Float32Array);
      expect(vector.length).toBe(128);
    });

    it('should handle special characters', async () => {
      const specialText = 'Test with émojis 🚀 and spéciål chàracters!';
      
      const vector = await tinyMLService.encodeText(specialText);
      expect(vector).toBeInstanceOf(Float32Array);
      expect(vector.length).toBe(128);
    });
  });

  describe('Biometric Verification', () => {
    beforeEach(async () => {
      await tinyMLService.loadModels();
    });

    it('should verify identical biometrics with high similarity', async () => {
      const imageData = 'test-image-data';
      const vector = await tinyMLService.encodeFace(imageData);
      const vectorBase64 = tinyMLService.float32ArrayToBase64(vector);
      
      const storedBiometric: BiometricVector = {
        data: vectorBase64,
        model: 'FaceNet_v1.0',
        dimensions: 128,
        normalization: 'l2_norm',
        capturedAt: new Date().toISOString()
      };
      
      const similarity = await tinyMLService.verifyBiometric(storedBiometric, imageData);
      
      expect(similarity).toBeCloseTo(1, 2); // Should be very close to 1
    });

    it('should verify different biometrics with lower similarity', async () => {
      const imageData1 = 'test-image-data-1';
      const imageData2 = 'test-image-data-2';
      
      const vector1 = await tinyMLService.encodeFace(imageData1);
      const vectorBase64 = tinyMLService.float32ArrayToBase64(vector1);
      
      const storedBiometric: BiometricVector = {
        data: vectorBase64,
        model: 'FaceNet_v1.0',
        dimensions: 128,
        normalization: 'l2_norm',
        capturedAt: new Date().toISOString()
      };
      
      const similarity = await tinyMLService.verifyBiometric(storedBiometric, imageData2);
      
      expect(similarity).toBeLessThan(1);
      expect(similarity).toBeGreaterThanOrEqual(-1);
    });

    it('should handle invalid stored biometric data', async () => {
      const invalidBiometric: BiometricVector = {
        data: 'invalid-base64-data!@#',
        model: 'FaceNet_v1.0',
        dimensions: 128,
        normalization: 'l2_norm',
        capturedAt: new Date().toISOString()
      };
      
      const imageData = 'test-image-data';
      
      await expect(tinyMLService.verifyBiometric(invalidBiometric, imageData)).rejects.toThrow();
    });
  });

  describe('Liveness Detection', () => {
    beforeEach(async () => {
      await tinyMLService.loadModels();
    });

    it('should detect liveness with sufficient image sequence', async () => {
      const imageSequence = [
        'image-frame-1',
        'image-frame-2',
        'image-frame-3',
        'image-frame-4'
      ];
      
      const isLive = await tinyMLService.checkLiveness(imageSequence);
      
      expect(typeof isLive).toBe('boolean');
    });

    it('should reject insufficient image sequence', async () => {
      const imageSequence = ['image-frame-1', 'image-frame-2'];
      
      const isLive = await tinyMLService.checkLiveness(imageSequence);
      
      expect(isLive).toBe(false);
    });

    it('should reject empty image sequence', async () => {
      const imageSequence: string[] = [];
      
      const isLive = await tinyMLService.checkLiveness(imageSequence);
      
      expect(isLive).toBe(false);
    });

    it('should detect variation in image sequence', async () => {
      const { blazeface } = require('@tensorflow-models/blazeface');
      
      // Mock different face positions for varied sequence
      const mockModel = {
        estimateFaces: jest.fn()
          .mockResolvedValueOnce([{ topLeft: [100, 100], probability: [0.9] }]) // Static position
          .mockResolvedValueOnce([{ topLeft: [100, 100], probability: [0.9] }])
          .mockResolvedValueOnce([{ topLeft: [100, 100], probability: [0.9] }])
          .mockResolvedValueOnce([{ topLeft: [100, 100], probability: [0.9] }]) // Start varied sequence
          .mockResolvedValueOnce([{ topLeft: [120, 110], probability: [0.9] }]) // Moved
          .mockResolvedValueOnce([{ topLeft: [110, 120], probability: [0.9] }]) // Moved again
      };
      
      blazeface.load = jest.fn().mockResolvedValue(mockModel);
      
      // Reload models with new mock
      await tinyMLService.loadModels();
      
      const staticSequence = ['same-image', 'same-image', 'same-image'];
      const variedSequence = ['image-1', 'image-2', 'image-3'];
      
      const staticLiveness = await tinyMLService.checkLiveness(staticSequence);
      const variedLiveness = await tinyMLService.checkLiveness(variedSequence);
      
      expect(staticLiveness).toBe(false); // No movement
      expect(variedLiveness).toBe(true);  // Movement detected
    });
  });

  describe('Utility Functions', () => {
    it('should convert Float32Array to base64 and back', () => {
      const originalArray = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      
      const base64String = tinyMLService.float32ArrayToBase64(originalArray);
      expect(typeof base64String).toBe('string');
      
      const restoredArray = (tinyMLService as any).base64ToFloat32Array(base64String);
      expect(restoredArray).toBeInstanceOf(Float32Array);
      expect(restoredArray.length).toBe(originalArray.length);
      
      // Check values are approximately equal (floating point precision)
      for (let i = 0; i < originalArray.length; i++) {
        expect(restoredArray[i]).toBeCloseTo(originalArray[i], 5);
      }
    });

    it('should preprocess images', async () => {
      const imageData = 'test-image-data';
      
      const processedImage = await tinyMLService.preprocessImage(imageData);
      
      expect(typeof processedImage).toBe('string');
      expect(processedImage).toBe(imageData); // BlazeFace handles preprocessing internally
    });
  });

  describe('Error Handling', () => {
    it('should handle encoding errors gracefully', async () => {
      await tinyMLService.loadModels();
      
      // Mock the BlazeFace model to throw an error
      const originalModel = (tinyMLService as any).models.blazeFace;
      (tinyMLService as any).models.blazeFace = {
        estimateFaces: jest.fn().mockRejectedValue(new Error('Encoding failed'))
      };
      
      await expect(tinyMLService.encodeFace('test-image')).rejects.toThrow();
      
      // Restore original model
      (tinyMLService as any).models.blazeFace = originalModel;
    });

    it('should handle verification errors gracefully', async () => {
      await tinyMLService.loadModels();
      
      const invalidBiometric: BiometricVector = {
        data: 'completely-invalid-data',
        model: 'Unknown_Model',
        dimensions: 64, // Wrong dimensions
        normalization: 'unknown',
        capturedAt: 'invalid-date'
      };
      
      await expect(tinyMLService.verifyBiometric(invalidBiometric, 'test-image')).rejects.toThrow();
    });

    it('should handle liveness check errors gracefully', async () => {
      await tinyMLService.loadModels();
      
      // Mock the BlazeFace model to throw an error during liveness check
      const originalModel = (tinyMLService as any).models.blazeFace;
      (tinyMLService as any).models.blazeFace = {
        estimateFaces: jest.fn().mockRejectedValue(new Error('Detection failed'))
      };
      
      await expect(tinyMLService.checkLiveness(['image1', 'image2', 'image3'])).rejects.toThrow();
      
      // Restore original model
      (tinyMLService as any).models.blazeFace = originalModel;
    });
  });

  describe('Cleanup', () => {
    it('should cleanup models properly', async () => {
      await tinyMLService.loadModels();
      expect(tinyMLService.isReady()).toBe(true);
      
      await tinyMLService.cleanup();
      expect(tinyMLService.isReady()).toBe(false);
    });
  });
});