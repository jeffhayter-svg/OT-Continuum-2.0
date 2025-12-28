import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';

const { like, eachLike, iso8601DateTime, uuid } = MatchersV3;

const provider = new PactV3({
  consumer: 'OTContinuumFrontend',
  provider: 'OTContinuumAPI',
  dir: path.resolve(process.cwd(), 'pact', 'pacts'),
  logLevel: 'info',
});

describe('Sites API Consumer Tests', () => {
  const orgId = '00000000-0000-0000-0000-000000000001';
  const siteId = '11111111-1111-1111-1111-111111111111';
  const authToken = 'mock-auth-token';

  describe('GET /organizations/:orgId/sites', () => {
    it('returns list of sites', async () => {
      await provider
        .given('organization exists with sites')
        .uponReceiving('a request to list sites')
        .withRequest({
          method: 'GET',
          path: `/make-server-fb677d93/organizations/${orgId}/sites`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          query: {
            limit: '50',
            offset: '0',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike({
              id: uuid(),
              organization_id: like(orgId),
              name: like('Site Alpha'),
              location: like('Building A'),
              site_code: like('ALPHA-001'),
              status: like('active'),
              metadata: like({}),
              created_at: iso8601DateTime(),
              updated_at: iso8601DateTime(),
            }),
            pagination: {
              limit: like(50),
              offset: like(0),
              total: like(1),
            },
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/make-server-fb677d93/organizations/${orgId}/sites?limit=50&offset=0`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          assert.strictEqual(response.status, 200);
          const data = await response.json();
          assert(Array.isArray(data.data));
          assert(data.pagination);
        });
    });
  });

  describe('POST /organizations/:orgId/sites', () => {
    it('creates a new site', async () => {
      await provider
        .given('organization exists')
        .uponReceiving('a request to create a site')
        .withRequest({
          method: 'POST',
          path: `/make-server-fb677d93/organizations/${orgId}/sites`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            name: 'New Site',
            location: 'Building B',
            site_code: 'NEW-001',
            status: 'active',
          },
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: uuid(),
            organization_id: like(orgId),
            name: like('New Site'),
            location: like('Building B'),
            site_code: like('NEW-001'),
            status: like('active'),
            metadata: like({}),
            created_at: iso8601DateTime(),
            updated_at: iso8601DateTime(),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/make-server-fb677d93/organizations/${orgId}/sites`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                name: 'New Site',
                location: 'Building B',
                site_code: 'NEW-001',
                status: 'active',
              }),
            }
          );

          assert.strictEqual(response.status, 201);
          const data = await response.json();
          assert.strictEqual(data.name, 'New Site');
        });
    });
  });

  describe('GET /organizations/:orgId/sites/:siteId', () => {
    it('returns site details', async () => {
      await provider
        .given('site exists')
        .uponReceiving('a request to get site details')
        .withRequest({
          method: 'GET',
          path: `/make-server-fb677d93/organizations/${orgId}/sites/${siteId}`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like(siteId),
            organization_id: like(orgId),
            name: like('Site Alpha'),
            location: like('Building A'),
            site_code: like('ALPHA-001'),
            status: like('active'),
            metadata: like({}),
            created_at: iso8601DateTime(),
            updated_at: iso8601DateTime(),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/make-server-fb677d93/organizations/${orgId}/sites/${siteId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          assert.strictEqual(response.status, 200);
          const data = await response.json();
          assert.strictEqual(data.id, siteId);
        });
    });
  });

  describe('PATCH /organizations/:orgId/sites/:siteId', () => {
    it('updates site', async () => {
      await provider
        .given('site exists')
        .uponReceiving('a request to update site')
        .withRequest({
          method: 'PATCH',
          path: `/make-server-fb677d93/organizations/${orgId}/sites/${siteId}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: {
            status: 'inactive',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: like(siteId),
            organization_id: like(orgId),
            name: like('Site Alpha'),
            status: like('inactive'),
            created_at: iso8601DateTime(),
            updated_at: iso8601DateTime(),
          },
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/make-server-fb677d93/organizations/${orgId}/sites/${siteId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                status: 'inactive',
              }),
            }
          );

          assert.strictEqual(response.status, 200);
          const data = await response.json();
          assert.strictEqual(data.status, 'inactive');
        });
    });
  });

  describe('DELETE /organizations/:orgId/sites/:siteId', () => {
    it('deletes site', async () => {
      await provider
        .given('site exists')
        .uponReceiving('a request to delete site')
        .withRequest({
          method: 'DELETE',
          path: `/make-server-fb677d93/organizations/${orgId}/sites/${siteId}`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
        .willRespondWith({
          status: 204,
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(
            `${mockServer.url}/make-server-fb677d93/organizations/${orgId}/sites/${siteId}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          assert.strictEqual(response.status, 204);
        });
    });
  });
});
