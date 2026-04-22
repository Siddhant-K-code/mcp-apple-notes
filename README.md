> [!Caution]
> Not actively maintained. Use at your own risk!


# 📝 Apple Notes MCP Server

**Apple Notes MCP Server** is a Model Context Protocol server that enables seamless interaction with Apple Notes through natural language. Create, search, and retrieve notes effortlessly using Claude or other AI assistants! 🎉

<a href="https://glama.ai/mcp/servers/ayr26szokg">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/ayr26szokg/badge" alt="Apple Notes Server MCP server" />
</a>

## 🎯 Features

- **Create Notes:** Quickly create new notes with titles, content, and tags 📝
- **Search Notes:** Find notes using powerful search capabilities 🔍
- **Retrieve Content:** Get the full content of any note by its title 📖
- **iCloud Integration:** Works directly with your iCloud Notes account ☁️

## 🚀 Getting Started

### Prerequisites

1. macOS with Apple Notes app configured
2. Node.js (version 20.0.0 or higher)
3. Yarn package manager

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Siddhant-K-code/mcp-apple-notes.git
   cd mcp-apple-notes
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Build the project:

   ```bash
   yarn build
   ```

4. Start the server:
   ```bash
   yarn start
   ```

5. Configure Claude Desktop. Update your `claude_desktop_config.json` with:
   ```json
   {
     "mcpServers": {
       "apple-notes": {
         "command": "yarn",
         "args": ["start"],
         "cwd": "/path/to/mcp-apple-notes"
       }
     }
   }
   ```

   > **Note:** Replace `/path/to/mcp-apple-notes` with the actual path to your cloned repository.
   > You may need to authorize the script to access Apple Notes when first running commands.

### MCP Server Initialization

When the server starts successfully, you'll see:
```
Starting Apple Notes MCP server.
```

The server is now ready to handle your note operations! 🎉

## 🛠️ Usage

### Available Tools

1. **Create Note**

   - Description: Creates a new note in Apple Notes
   - Parameters:
     ```typescript
     {
       title: string;      // The title of the note
       content: string;    // The content of the note
       tags?: string[];    // Optional tags for the note
     }
     ```
   - Example Response:
     ```
     Note created: My New Note
     ```

2. **Search Notes**

   - Description: Search for notes by title
   - Parameters:
     ```typescript
     {
       query: string; // The search query
     }
     ```
   - Example Response:
     ```
     Meeting Notes
     Shopping List
     Ideas for Project
     ```

3. **Get Note Content**
   - Description: Retrieve the full content of a specific note
   - Parameters:
     ```typescript
     {
       title: string; // The exact title of the note
     }
     ```
   - Example Response:
     ```
     [Full content of the note]
     ```

## 📚 Example Use Cases

### 1. Quick Note Taking

Create notes during meetings or brainstorming sessions:

```ts
{
"title": "Team Meeting Notes",
"content": "Discussion points:\n1. Project timeline\n2. Resource allocation",
"tags": ["meetings", "work"]
}
```

### 2. Information Retrieval

Search for specific notes when you need them:

```ts
{
"query": "meeting"
}
```

### 3. Content Review

Get the full content of a specific note:

```ts
{
"title": "Team Meeting Notes"
}
```

## ⚡ Tips for Best Results

- Ensure your Apple Notes app is properly configured with iCloud
- Use descriptive titles for better searchability
- Include relevant tags when creating notes for better organization

## 🔧 Development

The project uses TypeScript and follows modern ES modules patterns. Key files:

- `src/index.ts`: Main server implementation
- `src/services/appleNotesManager.ts`: Core note management functionality
- `src/utils/applescript.ts`: AppleScript integration utilities

### Development Container

A development container configuration is provided for VS Code users, offering:

- TypeScript Node.js environment
- Prettier for code formatting
- Automatic dependency installation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ for Apple Notes users
