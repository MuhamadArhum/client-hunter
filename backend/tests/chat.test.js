jest.mock('../src/services/aiService', () => ({
  chatWithAI: jest.fn(),
}));

const { app, request, registerAndLogin } = require('./helpers');
const { chatWithAI } = require('../src/services/aiService');

describe('Chat API', () => {
  let token;

  beforeEach(async () => {
    const auth = await registerAndLogin({ email: 'chatuser@test.com' });
    token = auth.token;
    chatWithAI.mockReset();
  });

  it('returns the AI reply for a valid message', async () => {
    chatWithAI.mockResolvedValueOnce('Here are 3 tips for your outreach...');
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'How do I write a cold email?' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Here are 3 tips for your outreach...');
  });

  it('rejects an empty message', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '' });
    expect(res.status).toBe(400);
  });

  it('rejects a whitespace-only message', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '   ' });
    expect(res.status).toBe(400);
  });

  it('caps conversation history sent upstream to the last 10 messages', async () => {
    chatWithAI.mockResolvedValueOnce('ok');
    const history = Array.from({ length: 25 }, (_, i) => ({ role: 'user', content: `msg ${i}` }));
    await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'latest question', history });

    const sentMessages = chatWithAI.mock.calls[0][0];
    // system prompt + last 10 history + current message = 12
    expect(sentMessages.length).toBe(12);
    expect(sentMessages[1].content).toBe('msg 15'); // first of the last 10
  });

  it('returns a graceful 500 (not a crash) when the AI provider throws', async () => {
    chatWithAI.mockRejectedValueOnce(new Error('groq down'));
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'hello' });
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'hi' });
    expect(res.status).toBe(401);
  });
});
