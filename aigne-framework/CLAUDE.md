# AIGNE Framework

> Functional, TypeScript-first AI agent development framework

## Product Overview

**Category:** Core SDK
**Status:** Released
**Repo:** https://github.com/AIGNE-io/aigne-framework
**Package:** `@aigne/core`
**License:** Elastic-2.0

### What It Is
AIGNE Framework is the foundation for building AI agents with TypeScript. Functional, composable, and designed for production.

### What It's NOT
- Not a chatbot framework
- Not prompt engineering tools
- Not an LLM wrapper

---

## Target Audience

**Primary:** Backend developers, AI engineers
**Secondary:** Full-stack developers building AI features

### User Personas

1. **The AI Engineer** - Building production agent systems
2. **The Backend Developer** - Adding AI capabilities to existing services
3. **The Startup CTO** - Shipping AI features fast

---

## Brand Voice & Tone

- **Technical and precise** - Developers will read the source
- **Functional programming aware** - Composition over inheritance
- **Production-focused** - Not a toy, not research
- **TypeScript-first** - Type safety is a feature

### Do Say
- "Production-ready AI agents"
- "Functional, composable architecture"
- "Multi-LLM by design"
- "TypeScript-first"

### Don't Say
- "Easy" or "simple" (it's powerful, not simple)
- "Magic" (it's engineering)
- "No-code" (it's developer tools)

---

## Tech Stack

```
Language: TypeScript 98.8%
Runtime:  Node.js 20+
Package:  pnpm workspaces (monorepo)
Linting:  Biome
Docs:     TypeDoc
```

---

## Installation

```bash
npm install @aigne/core
# or
pnpm add @aigne/core
# or
yarn add @aigne/core
```

---

## Package Structure

| Package | Purpose |
|---------|---------|
| `@aigne/core` | Core agent framework |
| `@aigne/cli` | Command-line tools |
| `@aigne/agent-library` | Pre-built agents |
| `@aigne/afs` | Agentic File System |
| `@aigne/observability` | Monitoring & tracing |
| `@aigne/memory` | Memory management |
| `@aigne/transport` | Communication layer |

---

## Key Features

### Multi-LLM Support
OpenAI, Anthropic Claude, Google Gemini, AWS Nova, Ollama, DeepSeek, xAI, Amazon Bedrock

### Workflow Patterns
- Sequential - Step-by-step execution
- Concurrent - Parallel processing
- Routing - Conditional paths
- Handoff - Agent delegation
- Reflection - Self-improvement
- Orchestration - Complex coordination

### AFS (Agentic File System)
Virtual file system abstraction for unified storage access across providers.

### MCP Integration
Model Context Protocol support for external service integration.

### Code Execution
Secure sandbox for running dynamically generated code.

---

## Development

### Monorepo Commands
```bash
# Setup
pnpm install              # Install all dependencies

# Development
pnpm dev                  # Start development mode
pnpm build                # Build all packages

# Quality
pnpm lint                 # Run Biome linting
pnpm test                 # Run test suite
pnpm typecheck            # TypeScript validation

# Docs
pnpm docs                 # Generate TypeDoc documentation
```

### Directory Structure
```
packages/
  core/                   # @aigne/core
  cli/                    # @aigne/cli
  agent-library/          # Pre-built agents
afs/                      # Agentic File System
models/                   # LLM implementations
memory/                   # Memory systems
observability/            # Monitoring
examples/                 # Usage examples
docs/                     # Documentation
```

---

## Key Concepts

### Agents
Autonomous units that can perceive, decide, and act. Composable and stateful.

### Skills
Discrete capabilities that agents can use. Think of them as tools with context.

### Chambers
Isolated execution environments for agents. Prevents context pollution.

### AFS
Everything is a file - unified abstraction for context, storage, and state.

---

## Related Products

- **AIGNE Hub** - Multi-provider gateway, billing
- **AIGNE Studio** - Visual agent builder
- **AIGNE DocSmith** - Built on AIGNE Framework
- **ArcSphere** - Consumer product powered by AIGNE

---

## Versioning

Uses release-please for automated versioning with conventional commits.

---

*Parent guide: See /Users/robroyhobbs/work/CLAUDE.md for company context*
