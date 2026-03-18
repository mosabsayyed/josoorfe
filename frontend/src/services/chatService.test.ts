import { chatService } from './chatService';

describe('chatService.getConversations', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ conversations: [] }) })) as unknown as typeof fetch;
    // Ensure no token stored by default for clarity
    try { localStorage.removeItem('josoor_token'); } catch (e) {}
  });

  afterEach(() => {
    global.fetch = originalFetch;
    try { localStorage.removeItem('josoor_token'); } catch (e) {}
  });

  it('does not include user_id when called without args', async () => {
    await chatService.getConversations();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(typeof calledUrl).toBe('string');
    expect(calledUrl.includes('user_id=')).toBe(false);
  });

  it('includes user_id when provided explicitly', async () => {
    await chatService.getConversations(1, 50);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(typeof calledUrl).toBe('string');
    expect(calledUrl.includes('user_id=1')).toBe(true);
  });

  it('does not add Authorization header when token is not set', async () => {
    // Remove token to simulate guest/no-auth state
    try { localStorage.removeItem('josoor_token'); } catch (e) {}
    await chatService.sendMessage({ query: 'Hello', conversation_id: undefined });
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toBeDefined();
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers).toBeDefined();
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('includes Authorization header when token exists', async () => {
    try { localStorage.setItem('josoor_token', 'test-token'); } catch (e) {}
    await chatService.sendMessage({ query: 'Hello again', conversation_id: undefined });
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(options.headers['Authorization']).toBe('Bearer test-token');
  });

  it('preserves media-mcp chart URL artifacts in adaptArtifacts', async () => {
    const response: any = {
      artifacts: [
        {
          artifact_type: 'CHART',
          title: 'Revenue Trend',
          content: {
            url: 'https://example.supabase.co/storage/v1/object/public/media/user_1/2026-03-16/chart.png',
            file_id: 'abc123',
          },
        },
      ],
    };

    const adapted = chatService.adaptArtifacts(response);
    expect(adapted.artifacts).toHaveLength(1);
    expect(adapted.artifacts[0].artifact_type).toBe('CHART');
    expect(adapted.artifacts[0].content.url).toContain('/media/');
    expect(adapted.artifacts[0].content.file_id).toBe('abc123');
  });

  it('does not transform FILE artifacts in adaptArtifacts', async () => {
    const response: any = {
      artifacts: [
        {
          artifact_type: 'FILE',
          title: 'Brief.pptx',
          content: {
            url: 'https://example.supabase.co/storage/v1/object/public/media/user_1/2026-03-16/brief.pptx',
            filename: 'Brief.pptx',
            type: 'pptx',
          },
        },
      ],
    };

    const adapted = chatService.adaptArtifacts(response);
    expect(adapted.artifacts[0].artifact_type).toBe('FILE');
    expect(adapted.artifacts[0].content.filename).toBe('Brief.pptx');
    expect(adapted.artifacts[0].content.url).toMatch(/\.pptx$/);
  });
});
