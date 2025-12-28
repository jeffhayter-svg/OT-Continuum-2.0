// ============================================================================
// Pact Consumer Test: Signals
// Tests what the web frontend expects from the Signals API
// ============================================================================

import { Pact, Matchers } from '@pact-foundation/pact';
import * as path from 'node:path';
import { consumerConfig, mockAuthToken, testSiteId, testTenantId } from '../config';

const { eachLike, like, iso8601DateTime, uuid } = Matchers;

describe('Signals API Consumer Tests', () => {
  let provider: Pact;

  beforeAll(async () => {
    provider = new Pact({
      consumer: consumerConfig.consumer,
      provider: consumerConfig.provider,
      port: consumerConfig.port,
      log: consumerConfig.log,
      dir: consumerConfig.dir,
      logLevel: consumerConfig.logLevel,
      spec: consumerConfig.spec,
      pactfileWriteMode: consumerConfig.pactfileWriteMode
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  afterEach(async () => {
    await provider.verify();
  });

  describe('GET /signals', () => {
    it('returns a list of signals with pagination', async () => {
      // Define the expected interaction
      await provider.addInteraction({
        state: 'signals exist for tenant',
        uponReceiving: 'a request to list signals',
        withRequest: {
          method: 'GET',
          path: '/signals',
          query: {
            limit: '20',
            offset: '0'
          },
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: eachLike({
              id: uuid(),
              tenant_id: testTenantId,
              site_id: testSiteId,
              signal_type: like('sensor'),
              source: like('temperature_sensor_01'),
              tag: like('TEMP-001'),
              value: like(85.5),
              unit: like('celsius'),
              status: like('validated'),
              quality_score: like(0.95),
              measured_at: iso8601DateTime(),
              received_at: iso8601DateTime(),
              processed_at: iso8601DateTime(),
              created_at: iso8601DateTime()
            }),
            pagination: {
              limit: like(20),
              offset: like(0),
              total: like(100)
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      // Make the actual API call
      const response = await fetch(
        `${provider.mockService.baseUrl}/signals?limit=20&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            Accept: 'application/json'
          }
        }
      );

      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(20);
      expect(data.pagination.offset).toBe(0);
      expect(data.error).toBeNull();
      expect(data.request_id).toBeDefined();
    });

    it('filters signals by site_id', async () => {
      await provider.addInteraction({
        state: 'signals exist for specific site',
        uponReceiving: 'a request to list signals for a specific site',
        withRequest: {
          method: 'GET',
          path: '/signals',
          query: {
            site_id: testSiteId,
            limit: '10',
            offset: '0'
          },
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: eachLike({
              id: uuid(),
              tenant_id: testTenantId,
              site_id: testSiteId,
              signal_type: like('sensor'),
              source: like('temperature_sensor_01'),
              value: like(85.5),
              unit: like('celsius'),
              status: like('validated'),
              measured_at: iso8601DateTime(),
              received_at: iso8601DateTime(),
              created_at: iso8601DateTime()
            }),
            pagination: like({
              limit: 10,
              offset: 0,
              total: 50
            }),
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(
        `${provider.mockService.baseUrl}/signals?site_id=${testSiteId}&limit=10&offset=0`,
        {
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            Accept: 'application/json'
          }
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data[0].site_id).toBe(testSiteId);
    });
  });

  describe('POST /signals', () => {
    it('creates a new signal and returns it', async () => {
      const signalData = {
        site_id: testSiteId,
        signal_type: 'sensor',
        source: 'temperature_sensor_01',
        tag: 'TEMP-001',
        value: 85.5,
        unit: 'celsius',
        status: 'raw',
        measured_at: '2024-12-22T10:00:00Z'
      };

      await provider.addInteraction({
        state: 'user has contributor role and site access',
        uponReceiving: 'a request to create a signal',
        withRequest: {
          method: 'POST',
          path: '/signals',
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: signalData
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: {
              id: uuid(),
              tenant_id: testTenantId,
              site_id: testSiteId,
              signal_type: like('sensor'),
              source: like('temperature_sensor_01'),
              tag: like('TEMP-001'),
              value: like(85.5),
              unit: like('celsius'),
              status: like('raw'),
              quality_score: null,
              validation_notes: null,
              measured_at: iso8601DateTime(),
              received_at: iso8601DateTime(),
              processed_at: null,
              created_at: iso8601DateTime(),
              metadata: null
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/signals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(signalData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBeDefined();
      expect(data.data.site_id).toBe(testSiteId);
      expect(data.data.signal_type).toBe('sensor');
      expect(data.data.source).toBe('temperature_sensor_01');
      expect(data.error).toBeNull();
    });
  });

  describe('POST /signals/batch', () => {
    it('creates multiple signals in a batch', async () => {
      const batchData = {
        signals: [
          {
            site_id: testSiteId,
            signal_type: 'sensor',
            source: 'temp_01',
            value: 85.5,
            unit: 'celsius'
          },
          {
            site_id: testSiteId,
            signal_type: 'sensor',
            source: 'temp_02',
            value: 82.3,
            unit: 'celsius'
          }
        ]
      };

      await provider.addInteraction({
        state: 'user has contributor role and site access',
        uponReceiving: 'a request to batch create signals',
        withRequest: {
          method: 'POST',
          path: '/signals/batch',
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: batchData
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: {
              created: like(2),
              failed: like(0),
              errors: []
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/signals/batch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(batchData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.created).toBe(2);
      expect(data.data.failed).toBe(0);
      expect(data.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('returns 401 when not authenticated', async () => {
      await provider.addInteraction({
        state: 'no authentication provided',
        uponReceiving: 'a request without authentication',
        withRequest: {
          method: 'GET',
          path: '/signals',
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: null,
            error: {
              code: 'NOT_AUTHENTICATED',
              message: like('Authentication required')
            },
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/signals`, {
        headers: {
          Accept: 'application/json'
        }
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('NOT_AUTHENTICATED');
    });

    it('returns 422 when validation fails', async () => {
      const invalidData = {
        // Missing required fields
        site_id: 'not-a-uuid',
        signal_type: 'invalid_type'
      };

      await provider.addInteraction({
        state: 'user has contributor role',
        uponReceiving: 'a request with invalid signal data',
        withRequest: {
          method: 'POST',
          path: '/signals',
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: invalidData
        },
        willRespondWith: {
          status: 422,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: null,
            error: {
              code: 'VALIDATION_ERROR',
              message: like('Validation failed'),
              details: like({
                errors: [
                  {
                    field: 'site_id',
                    message: 'Must be a valid UUID'
                  }
                ]
              })
            },
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/signals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(invalidData)
      });

      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
