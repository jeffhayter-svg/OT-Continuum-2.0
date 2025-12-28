// ============================================================================
// Pact Consumer Test: Risk Register
// Tests what the web frontend expects from the Risk API
// ============================================================================

import { Pact, Matchers } from '@pact-foundation/pact';
import { consumerConfig, mockAuthToken, testSiteId, testTenantId, testUserId, testRiskId } from '../config';

const { eachLike, like, iso8601DateTime, uuid } = Matchers;

describe('Risk API Consumer Tests', () => {
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

  describe('GET /risks', () => {
    it('returns a list of risks with ownership bypass', async () => {
      await provider.addInteraction({
        state: 'risks exist for tenant',
        uponReceiving: 'a request to list risks',
        withRequest: {
          method: 'GET',
          path: '/risks',
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
              risk_id: like('RISK-001'),
              title: like('High temperature alarm'),
              description: like('Temperature exceeding safe limits'),
              category: like('operational'),
              severity: like('major'),
              likelihood: like('likely'),
              risk_score: like(16),
              owner_id: uuid(),
              decision: like('mitigate'),
              decision_rationale: like('Install cooling system'),
              decision_date: iso8601DateTime(),
              decision_by: uuid(),
              status: like('open'),
              existing_controls: like('Temperature monitoring'),
              mitigation_plan: like('Install additional cooling'),
              target_completion_date: iso8601DateTime(),
              related_work_item_id: null,
              last_reviewed_at: iso8601DateTime(),
              next_review_due: iso8601DateTime(),
              closed_at: null,
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime()
            }),
            pagination: {
              limit: like(20),
              offset: like(0),
              total: like(50)
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(
        `${provider.mockService.baseUrl}/risks?limit=20&offset=0`,
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
      expect(data.pagination).toBeDefined();
      expect(data.error).toBeNull();
    });
  });

  describe('POST /risks', () => {
    it('creates a new risk with required owner_id', async () => {
      const riskData = {
        site_id: testSiteId,
        risk_id: 'RISK-002',
        title: 'Equipment failure risk',
        description: 'Potential pump failure',
        severity: 'major',
        likelihood: 'possible',
        owner_id: testUserId,
        decision: 'mitigate',
        decision_rationale: 'Schedule preventive maintenance',
        category: 'equipment',
        existing_controls: 'Regular inspections',
        mitigation_plan: 'Implement predictive maintenance'
      };

      await provider.addInteraction({
        state: 'user has contributor role and site access',
        uponReceiving: 'a request to create a risk',
        withRequest: {
          method: 'POST',
          path: '/risks',
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: riskData
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
              risk_id: like('RISK-002'),
              title: like('Equipment failure risk'),
              description: like('Potential pump failure'),
              category: like('equipment'),
              severity: like('major'),
              likelihood: like('possible'),
              risk_score: like(12), // major (4) × possible (3) = 12
              owner_id: testUserId,
              decision: like('mitigate'),
              decision_rationale: like('Schedule preventive maintenance'),
              decision_date: iso8601DateTime(),
              decision_by: testUserId,
              status: like('open'),
              existing_controls: like('Regular inspections'),
              mitigation_plan: like('Implement predictive maintenance'),
              target_completion_date: null,
              related_work_item_id: null,
              last_reviewed_at: iso8601DateTime(),
              next_review_due: null,
              closed_at: null,
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime(),
              audit_trail: []
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/risks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(riskData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBeDefined();
      expect(data.data.owner_id).toBe(testUserId);
      expect(data.data.risk_score).toBe(12);
      expect(data.error).toBeNull();
    });
  });

  describe('PATCH /risks/:id', () => {
    it('updates a risk and creates audit trail', async () => {
      const updateData = {
        severity: 'catastrophic',
        likelihood: 'likely',
        decision: 'accept',
        decision_rationale: 'Risk accepted with monitoring'
      };

      await provider.addInteraction({
        state: 'risk exists and user is owner',
        uponReceiving: 'a request to update a risk',
        withRequest: {
          method: 'PATCH',
          path: `/risks/${testRiskId}`,
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: updateData
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            data: {
              id: testRiskId,
              tenant_id: testTenantId,
              site_id: testSiteId,
              risk_id: like('RISK-001'),
              title: like('High temperature alarm'),
              description: like('Temperature exceeding safe limits'),
              severity: like('catastrophic'),
              likelihood: like('likely'),
              risk_score: like(20), // catastrophic (5) × likely (4) = 20
              owner_id: testUserId,
              decision: like('accept'),
              decision_rationale: like('Risk accepted with monitoring'),
              decision_date: iso8601DateTime(),
              decision_by: testUserId,
              status: like('open'),
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime()
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(
        `${provider.mockService.baseUrl}/risks/${testRiskId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.id).toBe(testRiskId);
      expect(data.data.severity).toBe('catastrophic');
      expect(data.data.risk_score).toBe(20);
      expect(data.error).toBeNull();
    });
  });

  describe('GET /risks/:id/events', () => {
    it('returns risk event history (audit trail)', async () => {
      await provider.addInteraction({
        state: 'risk exists with event history',
        uponReceiving: 'a request to get risk events',
        withRequest: {
          method: 'GET',
          path: `/risks/${testRiskId}/events`,
          query: {
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
              risk_id: testRiskId,
              event_type: like('score_changed'),
              severity: like('major'),
              likelihood: like('likely'),
              risk_score: like(16),
              previous_severity: like('moderate'),
              previous_likelihood: like('possible'),
              previous_risk_score: like(9),
              notes: like('Risk score changed from 9 to 16'),
              triggered_by: testUserId,
              created_at: iso8601DateTime()
            }),
            pagination: {
              limit: like(10),
              offset: like(0),
              total: like(5)
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(
        `${provider.mockService.baseUrl}/risks/${testRiskId}/events?limit=10&offset=0`,
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
      expect(data.data[0].risk_id).toBe(testRiskId);
      expect(data.data[0].event_type).toBeDefined();
      expect(data.error).toBeNull();
    });
  });

  describe('MS2 Requirements', () => {
    it('enforces decision_rationale for non-under_review decisions', async () => {
      const invalidData = {
        site_id: testSiteId,
        risk_id: 'RISK-003',
        title: 'Test risk',
        description: 'Test',
        severity: 'major',
        likelihood: 'likely',
        owner_id: testUserId,
        decision: 'accept'
        // Missing decision_rationale
      };

      await provider.addInteraction({
        state: 'user has contributor role',
        uponReceiving: 'a request to create risk without decision_rationale',
        withRequest: {
          method: 'POST',
          path: '/risks',
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
              message: like('decision_rationale is required for this decision'),
              details: like({
                errors: [
                  {
                    field: 'decision_rationale',
                    message: 'Required when decision is accept, mitigate, transfer, or avoid'
                  }
                ]
              })
            },
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/risks`, {
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
