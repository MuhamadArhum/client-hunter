const groqService = require('./groqService');
const ollamaService = require('./ollamaService');

// AI_PROVIDER env: 'groq' | 'ollama' | 'auto' (default: auto)
// auto = try Groq first, fall back to Ollama if Groq fails
const PROVIDER = process.env.AI_PROVIDER || 'auto';

const getProvider = () => {
  if (PROVIDER === 'groq')   return 'groq';
  if (PROVIDER === 'ollama') return 'ollama';
  return process.env.GROQ_API_KEY ? 'groq' : 'ollama';
};

const generateProposal = async (lead, customInstructions = '') => {
  const provider = getProvider();

  if (provider === 'groq') {
    try {
      console.log('[AI] Using Groq for proposal generation');
      return await groqService.generateProposal(lead, customInstructions);
    } catch (err) {
      if (PROVIDER === 'auto') {
        console.warn('[AI] Groq failed, falling back to Ollama:', err.message);
        const ollamaUp = await ollamaService.isAvailable();
        if (!ollamaUp) throw new Error('Groq failed and Ollama is not running');
        console.log('[AI] Using Ollama as fallback');
        return await ollamaService.generateProposal(lead, customInstructions);
      }
      throw err;
    }
  }

  console.log('[AI] Using Ollama for proposal generation');
  return await ollamaService.generateProposal(lead, customInstructions);
};

const generateFollowUpMessage = async (lead, previousMessages = []) => {
  const provider = getProvider();

  if (provider === 'groq') {
    try {
      console.log('[AI] Using Groq for follow-up generation');
      return await groqService.generateFollowUpMessage(lead, previousMessages);
    } catch (err) {
      if (PROVIDER === 'auto') {
        console.warn('[AI] Groq failed, falling back to Ollama:', err.message);
        const ollamaUp = await ollamaService.isAvailable();
        if (!ollamaUp) throw new Error('Groq failed and Ollama is not running');
        console.log('[AI] Using Ollama as fallback');
        return await ollamaService.generateFollowUpMessage(lead, previousMessages);
      }
      throw err;
    }
  }

  console.log('[AI] Using Ollama for follow-up generation');
  return await ollamaService.generateFollowUpMessage(lead, previousMessages);
};

const chatWithAI = async (messages, options = {}) => {
  const provider = getProvider();

  if (provider === 'groq') {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 800,
      });
      return response.choices[0].message.content;
    } catch (err) {
      if (PROVIDER === 'auto') {
        console.warn('[AI] Groq chat failed, falling back to Ollama:', err.message);
        const ollamaUp = await ollamaService.isAvailable();
        if (!ollamaUp) throw new Error('Groq failed and Ollama is not running');
        return ollamaService.chat(messages, options);
      }
      throw err;
    }
  }

  return ollamaService.chat(messages, options);
};

const getStatus = async () => {
  const groqReady  = !!process.env.GROQ_API_KEY;
  const ollamaReady = await ollamaService.isAvailable();
  const active = getProvider();

  return { groqReady, ollamaReady, active, provider: PROVIDER };
};

module.exports = { generateProposal, generateFollowUpMessage, chatWithAI, getStatus };
