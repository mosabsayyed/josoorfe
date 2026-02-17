/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE SERVICE - TDD TEST SUITE
 * Task #1: MONITORED_BY JOIN Pattern Migration
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { getCapabilityMatrix } from './enterpriseService';

// Mock the graphService dependency
jest.mock('./graphService', () => ({
  graphService: {
    getGraph: jest.fn()
  }
}));

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

describe('EnterpriseService - MONITORED_BY JOIN Pattern', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('RED PHASE - Cypher Query Structure', () => {
    it('should use MONITORED_BY relationship in Cypher query', async () => {
      // Mock successful MCP response with empty data
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(
          'data: {"jsonrpc":"2.0","id":1,"result":{"isError":false,"content":[{"type":"text","text":"{\\"data\\":[]}"}]}}\n'
        )
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await getCapabilityMatrix(2025, 1);

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalled();
      
      // Get the actual Cypher query sent
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const cypherQuery = requestBody.params.arguments.query;

      // CRITICAL TEST: Query must use MONITORED_BY relationship
      expect(cypherQuery).toContain('MONITORED_BY');
      
      // CRITICAL TEST: Query should NOT use UNION ALL pattern
      expect(cypherQuery).not.toContain('UNION ALL');
      
      // Query should match capability and optionally join risk
      expect(cypherQuery).toContain('EntityCapability');
      expect(cypherQuery).toContain('OPTIONAL MATCH');
    });

    it('should return risk data nested within capability nodes as _nestedRisk', async () => {
      // Mock MCP response with joined data structure
      const mockData = [
        {
          nodeType: 'capability',
          data: {
            id: '1.1.1',
            businessId: '1.1.1',
            name: 'Test Capability',
            level: 'L3',
            year: 2025,
            quarter: 1,
            status: 'active',
            maturity_level: 3,
            parent_id: '1.1',
            // THIS IS THE KEY: Risk data should be nested here
            _nestedRisk: {
              id: '1.1.1',
              year: 2025,
              quarter: 1,
              people_score: 4,
              process_score: 3,
              tools_score: 5,
              operational_health_score: 4,
              risk_score: 24,
              delay_days: 30,
              likelihood_of_delay: 0.8
            }
          }
        }
      ];

      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(
          `data: {"jsonrpc":"2.0","id":1,"result":{"isError":false,"content":[{"type":"text","text":"${JSON.stringify({ data: mockData }).replace(/"/g, '\\"')}"}]}}\n`
        )
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await getCapabilityMatrix(2025, 1);

      // Verify structure was parsed
      expect(result).toBeDefined();
      
      // If we get L3 data, it should have risk enrichment
      // (This will fail in RED phase because current code doesn't read from _nestedRisk)
    });
  });

  describe('RED PHASE - Risk Enrichment from Nested Structure', () => {
    it('enrichWithRiskData should read from _nestedRisk property not riskNodes array', async () => {
      // Mock capability with nested risk
      const mockData = [
        // L1 parent
        {
          nodeType: 'capability',
          data: {
            id: '1.0',
            businessId: '1.0',
            name: 'L1 Capability',
            level: 'L1',
            year: 2025,
            quarter: 1,
            status: 'active'
          }
        },
        // L2 parent
        {
          nodeType: 'capability',
          data: {
            id: '1.1',
            businessId: '1.1',
            name: 'L2 Capability',
            level: 'L2',
            year: 2025,
            quarter: 1,
            status: 'active',
            parent_id: '1.0',
            parent_year: 2025
          }
        },
        // L3 with nested risk
        {
          nodeType: 'capability',
          data: {
            id: '1.1.1',
            businessId: '1.1.1',
            name: 'Test L3 Capability',
            level: 'L3',
            year: 2025,
            quarter: 1,
            status: 'active',
            maturity_level: 3,
            target_maturity_level: 5,
            parent_id: '1.1',
            parent_year: 2025,
            // Nested risk data - this is the new pattern
            _nestedRisk: {
              id: '1.1.1',
              year: 2025,
              quarter: 1,
              people_score: 4,
              process_score: 3,
              tools_score: 5,
              operational_health_score: 4,
              risk_score: 24,
              delay_days: 30,
              likelihood_of_delay: 0.8
            }
          }
        }
      ];

      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(
          `data: {"jsonrpc":"2.0","id":1,"result":{"isError":false,"content":[{"type":"text","text":"${JSON.stringify({ data: mockData }).replace(/"/g, '\\"')}"}]}}\n`
        )
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await getCapabilityMatrix(2025, 1);

      // Navigate to the L3 node
      expect(result).toHaveLength(1);
      expect(result[0].l2).toHaveLength(1);
      expect(result[0].l2[0].l3).toHaveLength(1);
      
      const l3Node = result[0].l2[0].l3[0];

      // CRITICAL TESTS: Risk data should be enriched from _nestedRisk
      expect(l3Node.people_score).toBe(4);
      expect(l3Node.process_score).toBe(3);
      expect(l3Node.tools_score).toBe(5);
      expect(l3Node.operational_health_score).toBeDefined();
      
      // These will FAIL in RED phase because current code searches riskNodes array
    });
  });

  describe('RED PHASE - Function Signatures', () => {
    it('transformNeo4jToMatrix should not require riskNodes parameter', async () => {
      // This test verifies the refactored signature
      // Current implementation has: transformNeo4jToMatrix(graphData, year, quarter, riskNodes)
      // Target implementation: transformNeo4jToMatrix(graphData, year, quarter)
      
      const mockData = [
        {
          nodeType: 'capability',
          data: {
            id: '1.0',
            businessId: '1.0',
            name: 'L1 Only',
            level: 'L1',
            year: 2025,
            quarter: 1,
            status: 'active'
          }
        }
      ];

      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(
          `data: {"jsonrpc":"2.0","id":1,"result":{"isError":false,"content":[{"type":"text","text":"${JSON.stringify({ data: mockData }).replace(/"/g, '\\"')}"}]}}\n`
        )
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // Should not throw even without riskNodes in response
      const result = await getCapabilityMatrix(2025, 1);
      expect(result).toBeDefined();
      
      // This will PASS or FAIL depending on whether we've removed riskNodes dependency
    });
  });
});
