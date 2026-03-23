#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

const SERPER_KEY = process.env.SERPER_API_KEY || '';

const server = new Server(
  { name: 'mcp-serp-intel', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

function detectIntent(text) {
  const t = text.toLowerCase();
  if (/how|what is|why|explain|tutorial|guide|learn/.test(t)) return 'Informational';
  if (/best|top|vs|compare|review|alternative/.test(t)) return 'Commercial';
  if (/buy|price|cost|cheap|deal|order|download|free/.test(t)) return 'Transactional';
  if (/login|sign up|official|site/.test(t)) return 'Navigational';
  return 'Mixed';
}

function classifySugs(sugs) {
  if (!sugs.length) return { suggestions: [], intent: 'Unknown', breakdown: { informational: 0, commercial: 0, transactional: 0 } };
  let inf = 0, com = 0, tra = 0;
  sugs.forEach(s => {
    const l = s.toLowerCase();
    if (/how|what|why|where|when|guide|tutorial|learn/.test(l)) inf++;
    if (/best|top|review|vs|compare|alternative/.test(l)) com++;
    if (/buy|price|cost|cheap|free|deal|order|download/.test(l)) tra++;
  });
  const intent = tra > inf && tra > com ? 'Transactional' : com > inf ? 'Commercial' : 'Informational';
  return { suggestions: sugs.slice(0, 10), intent, breakdown: { informational: inf, commercial: com, transactional: tra } };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'weak_spots',
      description: 'Analyze SERP weakness for a keyword — scores each result for forum/UGC presence, thin content, outdated results, missing features. Returns opportunity score 0-100. Requires SERPER_API_KEY env var.',
      inputSchema: { type: 'object', properties: { keyword: { type: 'string', description: 'Keyword to analyze' } }, required: ['keyword'] }
    },
    {
      name: 'paa_tree',
      description: 'Get People Also Ask questions as a tree structure with H2/H3 content outline suggestions and intent tags. Uses Serper API. Requires SERPER_API_KEY env var.',
      inputSchema: { type: 'object', properties: { keyword: { type: 'string', description: 'Seed keyword' } }, required: ['keyword'] }
    },
    {
      name: 'compare_intent',
      description: 'Compare search intent across Google, YouTube, and Bing autocomplete. Detects when intent diverges across platforms (e.g., informational on Google but commercial on YouTube).',
      inputSchema: { type: 'object', properties: { keyword: { type: 'string', description: 'Keyword to compare' } }, required: ['keyword'] }
    },
    {
      name: 'deep_suggest',
      description: 'Deep autocomplete expansion — a-z, 0-9, question words (who/what/when/where/why/how), prepositions (for/with/without/vs/near/alternatives). Returns grouped suggestions.',
      inputSchema: { type: 'object', properties: { keyword: { type: 'string', description: 'Seed keyword' } }, required: ['keyword'] }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'weak_spots') {
      if (!SERPER_KEY) return { content: [{ type: 'text', text: 'Error: SERPER_API_KEY env var required' }], isError: true };

      const r = await axios.post('https://google.serper.dev/search', { q: args.keyword, num: 20 },
        { headers: { 'X-API-KEY': SERPER_KEY }, timeout: 10000 });

      const organic = r.data.organic || [];
      const hasAiOverview = !!r.data.answerBox;
      const hasFeatured = !!r.data.knowledgeGraph;

      const scored = organic.map((item, idx) => {
        let score = 0; const badges = [];
        if (/reddit|quora|forum|stackexchange|medium\.com/i.test(item.link)) { score += 20; badges.push('UGC/Forum'); }
        if (item.snippet && item.snippet.length < 100) { score += 10; badges.push('Thin'); }
        if (item.date) {
          const d = new Date(item.date);
          if (d < new Date(Date.now() - 730 * 86400000)) { score += 10; badges.push('Outdated 2yr+'); }
          else if (d < new Date(Date.now() - 365 * 86400000)) { score += 5; badges.push('Aging 1yr+'); }
        }
        if (!item.sitelinks && !item.richSnippet) { score += 5; badges.push('No Rich'); }
        if (idx === 0 && !hasFeatured && !hasAiOverview) { score += 15; badges.push('No AI/Featured'); }
        return { position: idx + 1, title: item.title, link: item.link, snippet: (item.snippet || '').slice(0, 150), score, badges };
      });

      const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
      const level = avgScore >= 15 ? 'HIGH_OPPORTUNITY' : avgScore >= 8 ? 'MEDIUM' : 'LOW_OPPORTUNITY';

      return { content: [{ type: 'text', text: JSON.stringify({ keyword: args.keyword, overallScore: avgScore, level, hasAiOverview, hasFeatured, results: scored }, null, 2) }] };
    }

    if (name === 'paa_tree') {
      if (!SERPER_KEY) return { content: [{ type: 'text', text: 'Error: SERPER_API_KEY env var required' }], isError: true };

      const r = await axios.post('https://google.serper.dev/search', { q: args.keyword },
        { headers: { 'X-API-KEY': SERPER_KEY }, timeout: 10000 });

      const paa = r.data.peopleAlsoAsk || [];
      const tree = paa.map((q, i) => ({
        id: `h2_${i}`, level: 2, question: q.question, intent: detectIntent(q.question),
        suggestedHeading: i < 4 ? 'H2' : 'H3'
      }));

      let outline = `# ${args.keyword}\n\n`;
      tree.forEach(n => { outline += `${n.suggestedHeading === 'H2' ? '## ' : '### '}${n.question}\n\n`; });

      return { content: [{ type: 'text', text: JSON.stringify({ keyword: args.keyword, tree, markdownOutline: outline }, null, 2) }] };
    }

    if (name === 'compare_intent') {
      async function getSugs(client, q) {
        try {
          const r = await axios.get('http://suggestqueries.google.com/complete/search',
            { params: { client, q }, timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          return r.data[1] || [];
        } catch { return []; }
      }
      async function getBing(q) {
        try {
          const r = await axios.get('https://api.bing.com/osjson.aspx', { params: { query: q }, timeout: 5000 });
          return r.data[1] || [];
        } catch { return []; }
      }

      const [google, youtube, bing] = await Promise.all([
        getSugs('firefox', args.keyword), getSugs('youtube', args.keyword), getBing(args.keyword)
      ]);

      const platforms = { google: classifySugs(google), youtube: classifySugs(youtube), bing: classifySugs(bing) };
      const intents = Object.values(platforms).map(p => p.intent).filter(i => i !== 'Unknown');
      const hasDivergence = new Set(intents).size > 1;

      return { content: [{ type: 'text', text: JSON.stringify({
        keyword: args.keyword, platforms, hasDivergence,
        recommendation: hasDivergence ? 'Intent varies by platform — create platform-specific content' : 'Consistent intent across platforms'
      }, null, 2) }] };
    }

    if (name === 'deep_suggest') {
      const modifiers = [
        ...'abcdefghijklmnopqrstuvwxyz'.split('').map(c => `${args.keyword} ${c}`),
        ...['0','1','2','3','4','5'].map(n => `${args.keyword} ${n}`),
        ...['who','what','when','where','why','how'].map(w => `${w} ${args.keyword}`),
        ...['for','with','without','vs','near','alternatives','like','best','top'].map(p => `${args.keyword} ${p}`)
      ];

      const all = {};
      for (let i = 0; i < modifiers.length; i += 5) {
        const batch = modifiers.slice(i, i + 5);
        const results = await Promise.all(batch.map(async mod => {
          try {
            const r = await axios.get('http://suggestqueries.google.com/complete/search',
              { params: { client: 'firefox', q: mod }, timeout: 3000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            return { mod, sugs: (r.data[1] || []).slice(0, 5) };
          } catch { return { mod, sugs: [] }; }
        }));
        results.forEach(r => { if (r.sugs.length) all[r.mod] = r.sugs; });
        if (i + 5 < modifiers.length) await new Promise(r => setTimeout(r, 200));
      }

      return { content: [{ type: 'text', text: JSON.stringify({ keyword: args.keyword, totalModifiers: modifiers.length, expandedCount: Object.keys(all).length, suggestions: all }, null, 2) }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('mcp-serp-intel running on stdio');
}

main().catch(console.error);
