import { fetchEnterpriseMatrix } from './enterpriseService';

// Mock the backend API
global.fetch = jest.fn();

describe('enterpriseService MONITORED_BY JOIN', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses MONITORED_BY relationship to join EntityCapability with EntityRisk', async () => {
    // Mock response with nested risk data
    const mockResponse = {
      data: {
        capabilities: [
          {
            id: 'cap-1',
            name: 'Test Capability',
            _nestedRisk: {
              build_exposure_pct: 75.5,
              build_band: 'HIGH',
              build_people_score: 8,
              build_process_score: 6,
              build_tools_score: 7
            }
          },
          {
            id: 'cap-2',
            name: 'No Risk Capability',
            _nestedRisk: null
          }
        ]
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await fetchEnterpriseMatrix();

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/enterprise/matrix'),
      expect.any(Object)
    );

    // Verify risk data is present in result
    const capWithRisk = result.l3Nodes.find((n: any) => n.id === 'cap-1');
    expect(capWithRisk).toBeDefined();
    expect(capWithRisk.buildExposure).toBe(75.5);
    expect(capWithRisk.buildBand).toBe('HIGH');
    expect(capWithRisk.buildPeopleScore).toBe(8);
    expect(capWithRisk.buildProcessScore).toBe(6);
    expect(capWithRisk.buildToolsScore).toBe(7);

    // Verify capability without risk has null/default values
    const capWithoutRisk = result.l3Nodes.find((n: any) => n.id === 'cap-2');
    expect(capWithoutRisk).toBeDefined();
    expect(capWithoutRisk.buildExposure).toBeNull();
  });

  it('correctly extracts risk data from _nestedRisk object', async () => {
    const mockResponse = {
      data: {
        capabilities: [
          {
            id: 'cap-test',
            name: 'Test',
            _nestedRisk: {
              operate_exposure_pct: 45.2,
              operate_band: 'MEDIUM',
              operate_people_score: 5,
              operate_process_score: 4,
              operate_tools_score: 6
            }
          }
        ]
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await fetchEnterpriseMatrix();
    const cap = result.l3Nodes[0];

    expect(cap.operateExposure).toBe(45.2);
    expect(cap.operateBand).toBe('MEDIUM');
    expect(cap.operatePeopleScore).toBe(5);
    expect(cap.operateProcessScore).toBe(4);
    expect(cap.operateToolsScore).toBe(6);
  });
});
