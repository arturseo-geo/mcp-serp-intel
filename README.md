# mcp-serp-intel

> Built by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[The GEO Lab](https://thegeolab.net)**
> [𝕏 @TheGEO_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Licence](https://img.shields.io/badge/licence-MIT-green)
![Claude Code](https://img.shields.io/badge/Claude_Code-MCP_Server-blueviolet)

MCP server for SERP intelligence — weak spots scoring, PAA tree clusters, cross-platform intent comparison, and deep autocomplete expansion.

Replaces LowFruits + AlsoAsked + Keyword Surfer as Claude Code tools.

## Tools

| Tool | Description | API Key |
|------|-------------|--------|
| `weak_spots` | Score SERP weakness — forums, thin content, outdated results, missing features | SERPER_API_KEY |
| `paa_tree` | People Also Ask as H2/H3 content outline with intent tags | SERPER_API_KEY |
| `compare_intent` | Google vs YouTube vs Bing intent divergence detection | None (free) |
| `deep_suggest` | a-z + questions + prepositions autocomplete expansion | None (free) |

## Install

```bash
# Claude Code
claude mcp add serp-intel -e SERPER_API_KEY=your_key -- npx mcp-serp-intel

# Or in .mcp.json
{
  "mcpServers": {
    "serp-intel": {
      "command": "npx",
      "args": ["mcp-serp-intel"],
      "env": {
        "SERPER_API_KEY": "your_key_here"
      }
    }
  }
}
```

Get a free Serper API key at [serper.dev](https://serper.dev) (2,500 searches/month free).

## Usage

```
> find weak spots in the SERP for "generative engine optimization"
> generate a PAA content outline for "what is GEO"
> compare search intent for "seo tools" across Google, YouTube, and Bing
> expand autocomplete suggestions for "link building"
```

---

## Attributions & Licence

Built and maintained by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[The GEO Lab](https://thegeolab.net)**.

Email: artur@thegeolab.net

### Best Practice Attribution

This MCP server was built following the open source Best Practice Approach —
reading community work for inspiration, then writing original content,
and crediting every source.

**Based on:**
- [Model Context Protocol specification](https://modelcontextprotocol.io) by Anthropic
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) (MIT)

**SERP analysis concepts inspired by:**
- [LowFruits](https://lowfruits.io/) — weak SERP spot identification methodology
- [AlsoAsked](https://alsoasked.com/) — People Also Ask tree mapping
- [Keyword Surfer](https://surferseo.com/keyword-surfer-extension/) — in-SERP keyword data
- [Serper.dev](https://serper.dev/) — structured SERP data API

**Data sources:**
- Serper.dev API — SERP results with AI Overview detection (2,500 free/month)
- Google Autocomplete API — suggestqueries.google.com (free, unofficial)
- YouTube Autocomplete API — suggestqueries.google.com?client=youtube (free, unofficial)
- Bing Autosuggest API — api.bing.com/osjson.aspx (free, no auth)

All server code is original writing. No files were copied or adapted from any source. MIT licence.

---

Found this useful? ⭐ Star the repo and connect:
[🌐 thegeolab.net](https://thegeolab.net) · [𝕏 @TheGEO_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

## Licence

MIT — see LICENSE
