import { bleService } from '../services/BleService';
import { enhancedBleService } from '../services/EnhancedBleService';
import { tinyMLService } from '../services/TinyMLService';
import { cryptoService } from '../services/CryptoService';
import { Profile } from '../types/profile';
import { EnhancedProfile } from '../types/enhanced-profile';

// Set longer timeout for performance tests
jest.setTimeout(30000);

const mockProfile: Profile = {
  uuid: 'perf-test-uuid',
  name: 'Performance Test User',
  role: 'Tester',
  company: 'Performance Corp',
  socialLinks: {}
};

const mockEnhancedProfile: EnhancedProfile = {
  ...mockProfile,
  isEnhanced: true,
  enhancementLevel: 'full',
  tokenMetadata: {
    version: '1.0',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    issuer: 'BeaconAI:Performance',
    permissions: ['discover', 'verify']
  }
};

describe('Performance Tests', () => {
  beforeAll(async () => {
    // Set test mode for all services
    bleService.setTestMode(true);
    await bleService.initialize();
  });

  afterEach(async () => {
    // Clean up after each test
    await bleService.stopScanning();
    await bleService.stopAdvertising();
    await enhancedBleService.stopEnhancedDiscovery();
  });

  describe('BLE Performance', () => {
    it('should start scanning within performance threshold', async () => {
      const startTime = performance.now();
      
      const result = await bleService.startScanning(() => {});
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toBe(true);
      expect(duration).toBeLessThan(1000); // Should start within 1 second
    });

    it('should start advertising within performance threshold', async () => {
      const startTime = performance.now();
      
      const result = await bleService.startAdvertising(mockProfile);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toBe(true);
      expect(duration).toBeLessThan(1000); // Should start within 1 second
    });

    it('should handle multiple peer discoveries efficiently', async () => {
      const discoveredPeers: any[] = [];
      const startTime = performance.now();
      
      await bleService.startScanning((peer) => {
        discoveredPeers.push(peer);
      });
      
      // Wait for multiple discoveries
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      expect(discoveredPeers.length).toBeGreaterThan(0);
      
      // Should handle peer discovery without significant performance degradation
      const avgDiscoveryTime = totalDuration / discoveredPeers.length;
      expect(avgDiscoveryTime).toBeLessThan(2000); // Average of 2 seconds per peer
    });

    it('should stop services quickly', async () => {
      await bleService.startScanning(() => {});
      await bleService.startAdvertising(mockProfile);
      
      const startTime = performance.now();
      
      await bleService.stopScanning();
      await bleService.stopAdvertising();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // Should stop within 500ms
    });
  });

  describe('Enhanced BLE Performance', () => {
    it('should start enhanced discovery within performance threshold', async () => {
      const startTime = performance.now();
      
      const result = await enhancedBleService.startEnhancedDiscovery(
        mockEnhancedProfile,
        () => {}
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toBe(true);
      expect(duration).toBeLessThan(2000); // Should start within 2 seconds
    });

    it('should handle enhanced peer exchange efficiently', async () => {
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, () => {});
      
      const startTime = performance.now();
      
      const exchangedProfile = await enhancedBleService.exchangeEnhancedProfile(
        'test-peer-uuid',
        mockEnhancedProfile
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(exchangedProfile).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should exchange within 5 seconds
    });

    it('should manage peer storage efficiently with large numbers', async () => {
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, () => {});
      
      // Wait for peer discovery
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const startTime = performance.now();
      
      const peers = enhancedBleService.getDiscoveredPeers();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(peers).toBeDefined();
      expect(duration).toBeLessThan(100); // Should retrieve peers within 100ms
    });
  });

  describe('Crypto Performance', () => {
    it('should generate key pairs within performance threshold', async () => {
      const startTime = performance.now();
      
      await cryptoService.generateKeyPair();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // Should generate within 2 seconds
    });

    it('should sign profiles efficiently', async () => {
      await cryptoService.generateKeyPair();
      
      const startTime = performance.now();
      
      const signature = await cryptoService.signProfile(mockEnhancedProfile);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(signature).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should sign within 1 second
    });

    it('should verify signatures efficiently', async () => {
      await cryptoService.generateKeyPair();
      const signature = await cryptoService.signProfile(mockEnhancedProfile);
      const profileWithSignature = { ...mockEnhancedProfile, signature };
      
      const startTime = performance.now();
      
      const isValid = await cryptoService.verifySignature(profileWithSignature);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(isValid).toBe(true);
      expect(duration).toBeLessThan(500); // Should verify within 500ms
    });

    it('should handle multiple crypto operations without performance degradation', async () => {
      await cryptoService.generateKeyPair();
      
      const operations = [];
      const startTime = performance.now();
      
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        operations.push(cryptoService.signProfile(mockEnhancedProfile));
      }
      
      const signatures = await Promise.all(operations);
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgOperationTime = totalDuration / operations.length;
      
      expect(signatures.length).toBe(10);
      expect(avgOperationTime).toBeLessThan(1000); // Average operation under 1 second
    });
  });

  describe('TinyML Performance', () => {
    it('should load models within performance threshold', async () => {
      const startTime = performance.now();
      
      await tinyMLService.loadModels();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(tinyMLService.isReady()).toBe(true);
      expect(duration).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should encode face data efficiently', async () => {
      await tinyMLService.loadModels();
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      
      const startTime = performance.now();
      
      const embedding = await tinyMLService.encodeFace(mockImageData);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(128);
      expect(duration).toBeLessThan(3000); // Should encode within 3 seconds
    });

    it('should encode text efficiently', async () => {
      await tinyMLService.loadModels();
      const mockText = 'Senior Software Engineer at TechCorp';
      
      const startTime = performance.now();
      
      const embedding = await tinyMLService.encodeText(mockText);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(128);
      expect(duration).toBeLessThan(2000); // Should encode within 2 seconds
    });

    it('should perform biometric verification efficiently', async () => {
      await tinyMLService.loadModels();
      const mockImageData = 'data:image/jpeg;base64,test';
      
      // Create a stored biometric vector
      const storedVector = {
        type: 'face' as const,
        data: tinyMLService.float32ArrayToBase64(new Float32Array(128).fill(0.5)),
        capturedAt: new Date().toISOString(),
        quality: 0.95
      };
      
      const startTime = performance.now();
      
      const similarity = await tinyMLService.verifyBiometric(storedVector, mockImageData);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(similarity).toBeGreaterThanOrEqual(0);
      expect(similarity).toBeLessThanOrEqual(1);
      expect(duration).toBeLessThan(3000); // Should verify within 3 seconds
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks during repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform repeated operations
      for (let i = 0; i < 100; i++) {
        await bleService.startScanning(() => {});
        await bleService.stopScanning();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up resources properly', async () => {
      await bleService.startScanning(() => {});
      await bleService.startAdvertising(mockProfile);
      await enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, () => {});
      
      const startTime = performance.now();
      
      // Stop all services
      await bleService.stopScanning();
      await bleService.stopAdvertising();
      await enhancedBleService.stopEnhancedDiscovery();
      await tinyMLService.cleanup();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // Should cleanup within 2 seconds
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid start/stop cycles', async () => {
      const cycles = 20;
      const startTime = performance.now();
      
      for (let i = 0; i < cycles; i++) {
        await bleService.startScanning(() => {});
        await bleService.stopScanning();
      }
      
      const endTime = performance.now();
      const avgCycleTime = (endTime - startTime) / cycles;
      
      expect(avgCycleTime).toBeLessThan(1000); // Average cycle under 1 second
    });

    it('should handle concurrent operations efficiently', async () => {
      const startTime = performance.now();
      
      // Start multiple operations concurrently
      const operations = [
        bleService.startScanning(() => {}),
        bleService.startAdvertising(mockProfile),
        enhancedBleService.startEnhancedDiscovery(mockEnhancedProfile, () => {}),
        tinyMLService.loadModels(),
        cryptoService.generateKeyPair()
      ];
      
      await Promise.all(operations);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(10000); // Should complete all within 10 seconds
    });
  });
});