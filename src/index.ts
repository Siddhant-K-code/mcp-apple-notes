import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AppleNotesManager } from "@/services/appleNotesManager.js";
import type { CreateNoteParams, SearchParams, GetNoteParams } from "@/types.js";

// Initialize the MCP server
const server = new McpServer({
  name: "apple-notes",
  version: "1.0.0",
  description: "MCP server for interacting with Apple Notes"
});

// Initialize the notes manager
const notesManager = new AppleNotesManager();

// Define tool schemas
const createNoteSchema = {
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.array(z.string()).optional(),
  folder: z.string().optional().describe("Folder name to save the note to (optional)")
};

const searchSchema = {
  query: z.string().min(1, "Search query is required")
};

const getNoteSchema = {
  title: z.string().min(1, "Note title is required")
};

// Register tools
server.tool(
  "create-note",
  createNoteSchema,
  async ({ title, content, tags = [], folder }: CreateNoteParams) => {
    try {
      const note = notesManager.createNote(title, content, tags, folder);
      if (!note) {
        return {
          content: [{
            type: "text",
            text: "Failed to create note. Please check your Apple Notes configuration."
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: "text",
          text: `✅ Note created successfully: "${note.title}"`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating note: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "search-notes",
  searchSchema,
  async ({ query }: SearchParams) => {
    try {
      const notes = notesManager.searchNotes(query);
      const message = notes.length
        ? `Found ${notes.length} notes:\n${notes.map(note => `• ${note.title}`).join('\n')}`
        : "No notes found matching your query";

      return {
        content: [{
          type: "text",
          text: message
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching notes: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "get-note-content",
  getNoteSchema,
  async ({ title }: GetNoteParams) => {
    try {
      const content = notesManager.getNoteContent(title);
      return {
        content: [{
          type: "text",
          text: content || "Note not found"
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error retrieving note content: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);
