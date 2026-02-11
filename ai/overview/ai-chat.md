# AI Chat

## Overview

AI chat assistant powered by Google Gemini 2.5 Pro via LangChain. Users can ask questions about their workflow, get suggestions for image processing, and analyze execution results. Supports image attachments and multi-threaded conversations.

## Architecture

```
ChatPanel (UI)
  ↓ POST /api/chat (streaming)
app/api/chat/route.ts
  ↓
lib/chatService.ts (LangChain agent + Gemini 2.5 Pro)
  ↓
lib/tools/ (3 tools for workflow context)
```

**Key Files**:
- `app/api/chat/route.ts` - API route, streams `text/plain` response
- `lib/chatService.ts` - LangChain agent creation and streaming
- `lib/chatPrompts.ts` - System prompt and tool descriptions
- `lib/chatStorageService.ts` - Thread persistence (localStorage, strips base64)
- `hooks/useChatThreads.ts` - Multi-thread state management

## Tools

The AI agent has access to 3 LangChain tools for understanding the current workflow:

| Tool | Description | File |
|------|-------------|------|
| `get_available_nodes` | Lists all 7 processing functions with params | `lib/tools/availableNodesTool.ts` |
| `get_workflow_context` | Current node/edge structure and execution order | `lib/tools/workflowContextTool.ts` |
| `get_execution_images` | Before/after images from executed nodes | `lib/tools/executionImagesTool.ts` |

Tool registry and types: `lib/tools/registry.ts`, `lib/tools/types.ts`

Details: `frontend/lib/tools/README.md`

## Thread Management

- Multi-conversation support with localStorage persistence
- Auto-generated thread titles from first message
- Base64 images stripped before storage to save space
- Max 50 threads per browser

## UI Components

- `ChatPanel.tsx` - Main chat interface with resizable width
- `ThreadMenu.tsx` - Thread list, create/switch/delete
- `MessageContent.tsx` - Message rendering with markdown
- `ChatMarkdown.tsx` - GFM markdown renderer (react-markdown + remark-gfm)
- `ToolCallIndicator.tsx` - Tool execution feedback (`<<TOOL_START>>`/`<<TOOL_END>>`)
- `ToolList.tsx` - Available tools display
- `InputBar.tsx` - Text input with image attachment

Details: `docs/features/AI.md`
