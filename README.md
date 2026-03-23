# mcp-serp-intel

[![MCP Server Badge](https://img.shields.io/badge/MCP-Server-blue?style=flat-square)](https://modelcontextprotocol.io)

**Author:** [Artur Seo](https://github.com/arturseo-geo) | [Twitter](https://twitter.com/stickerdaniel) | [LinkedIn](https://www.linkedin.com/in/artur-seo/) | [Reddit](https://www.reddit.com/r/u_stickerdaniel/)

---

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

**Made by [Artur Seo](https://github.com/arturseo-geo)** • [GitHub](https://github.com/arturseo-geo) • [Twitter](https://twitter.com/stickerdaniel) • [LinkedIn](https://www.linkedin.com/in/artur-seo/) • [Reddit](https://www.reddit.com/r/u_stickerdaniel/)
