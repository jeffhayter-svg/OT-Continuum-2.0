// ============================================================================
// Pact Consumer Test: Workflow & Work Items
// Tests what the web frontend expects from the Workflow API
// ============================================================================

import { Pact, Matchers } from '@pact-foundation/pact';
import { consumerConfig, mockAuthToken, testSiteId, testTenantId, testUserId, testWorkflowId, testWorkItemId } from '../config';

const { eachLike, like, iso8601DateTime, uuid } = Matchers;

describe('Workflow API Consumer Tests', () => {
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

  describe('GET /workflows', () => {
    it('returns a list of workflows', async () => {
      await provider.addInteraction({
        state: 'workflows exist for tenant',
        uponReceiving: 'a request to list workflows',
        withRequest: {
          method: 'GET',
          path: '/workflows',
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
              name: like('Management of Change (MoC)'),
              description: like('Standard MoC approval workflow'),
              workflow_type: like('moc'),
              definition: like({
                steps: [
                  { id: 1, name: 'Submit Request' },
                  { id: 2, name: 'Manager Approval' },
                  { id: 3, name: 'Implementation' }
                ]
              }),
              is_template: like(true),
              is_active: like(true),
              version: like(1),
              parent_workflow_id: null,
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime()
            }),
            pagination: {
              limit: like(20),
              offset: like(0),
              total: like(10)
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(
        `${provider.mockService.baseUrl}/workflows?limit=20&offset=0`,
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

  describe('POST /workflows', () => {
    it('creates a new workflow (manager role)', async () => {
      const workflowData = {
        name: 'Custom Inspection Workflow',
        description: 'Monthly equipment inspection',
        workflow_type: 'inspection',
        definition: {
          steps: [
            { id: 1, name: 'Schedule Inspection' },
            { id: 2, name: 'Perform Inspection' },
            { id: 3, name: 'Review Results' }
          ]
        },
        is_template: false
      };

      await provider.addInteraction({
        state: 'user has manager role',
        uponReceiving: 'a request to create a workflow',
        withRequest: {
          method: 'POST',
          path: '/workflows',
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: workflowData
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
              name: like('Custom Inspection Workflow'),
              description: like('Monthly equipment inspection'),
              workflow_type: like('inspection'),
              definition: like(workflowData.definition),
              is_template: like(false),
              is_active: like(true),
              version: like(1),
              parent_workflow_id: null,
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime()
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/workflows`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(workflowData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBeDefined();
      expect(data.data.name).toBe('Custom Inspection Workflow');
      expect(data.error).toBeNull();
    });
  });

  describe('GET /work-items', () => {
    it('returns work items with assignee bypass', async () => {
      await provider.addInteraction({
        state: 'work items exist for tenant',
        uponReceiving: 'a request to list work items',
        withRequest: {
          method: 'GET',
          path: '/work-items',
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
              workflow_id: uuid(),
              title: like('Complete quarterly inspection'),
              description: like('Perform routine equipment inspection'),
              work_item_type: like('inspection'),
              status: like('in_progress'),
              priority: like('high'),
              assigned_to: testUserId,
              created_by: uuid(),
              due_at: iso8601DateTime(),
              started_at: iso8601DateTime(),
              completed_at: null,
              data: like({}),
              audit_trail: eachLike({
                timestamp: iso8601DateTime(),
                user_id: uuid(),
                action: like('created'),
                changes: like({})
              }),
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime()
            }),
            pagination: {
              limit: like(20),
              offset: like(0),
              total: like(25)
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(
        `${provider.mockService.baseUrl}/work-items?limit=20&offset=0`,
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

  describe('POST /work-items', () => {
    it('creates a new work item', async () => {
      const workItemData = {
        title: 'Inspect cooling system',
        description: 'Quarterly inspection of cooling equipment',
        site_id: testSiteId,
        work_item_type: 'inspection',
        priority: 'high',
        assigned_to: testUserId,
        due_at: '2024-12-31T23:59:59Z',
        data: {
          equipment_id: 'COOL-001',
          checklist_id: 'CHECK-123'
        }
      };

      await provider.addInteraction({
        state: 'user has contributor role and site access',
        uponReceiving: 'a request to create a work item',
        withRequest: {
          method: 'POST',
          path: '/work-items',
          headers: {
            Authorization: `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: workItemData
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
              workflow_id: null,
              title: like('Inspect cooling system'),
              description: like('Quarterly inspection of cooling equipment'),
              work_item_type: like('inspection'),
              status: like('draft'),
              priority: like('high'),
              assigned_to: testUserId,
              created_by: testUserId,
              due_at: iso8601DateTime(),
              started_at: null,
              completed_at: null,
              data: like(workItemData.data),
              audit_trail: eachLike({
                timestamp: iso8601DateTime(),
                user_id: testUserId,
                action: like('created'),
                changes: like({})
              }),
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime()
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(`${provider.mockService.baseUrl}/work-items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(workItemData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.id).toBeDefined();
      expect(data.data.title).toBe('Inspect cooling system');
      expect(data.data.status).toBe('draft');
      expect(data.error).toBeNull();
    });
  });

  describe('PATCH /work-items/:id', () => {
    it('updates work item status and audit trail', async () => {
      const updateData = {
        status: 'completed',
        data: {
          completion_notes: 'All equipment functioning normally'
        }
      };

      await provider.addInteraction({
        state: 'work item exists and user is assignee',
        uponReceiving: 'a request to update work item status',
        withRequest: {
          method: 'PATCH',
          path: `/work-items/${testWorkItemId}`,
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
              id: testWorkItemId,
              tenant_id: testTenantId,
              site_id: testSiteId,
              title: like('Inspect cooling system'),
              status: like('completed'),
              priority: like('high'),
              assigned_to: testUserId,
              completed_at: iso8601DateTime(),
              data: like(updateData.data),
              audit_trail: eachLike({
                timestamp: iso8601DateTime(),
                user_id: testUserId,
                action: like('updated'),
                changes: like(updateData)
              }),
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime()
            },
            error: null,
            request_id: uuid()
          }
        }
      });

      const response = await fetch(
        `${provider.mockService.baseUrl}/work-items/${testWorkItemId}`,
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
      expect(data.data.id).toBe(testWorkItemId);
      expect(data.data.status).toBe('completed');
      expect(data.data.completed_at).toBeDefined();
      expect(data.error).toBeNull();
    });
  });
});
