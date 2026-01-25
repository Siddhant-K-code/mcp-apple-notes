import type { Note } from '@/types.js';
import { runAppleScript } from '@/utils/applescript.js';
import { markdownToHtml } from '@/utils/markdown.js';

/**
 * Formats note content for AppleScript compatibility
 * Converts markdown to HTML and escapes quotes for AppleScript
 * @param content - The raw note content (markdown)
 * @returns Formatted HTML content safe for AppleScript
 */
const formatContent = (content: string): string => {
  if (!content) return '';

  // Convert markdown to HTML first
  let html = markdownToHtml(content);

  // Escape quotes for AppleScript string embedding
  html = html.replace(/"/g, '\\"');

  return html;
};

export class AppleNotesManager {
  private readonly ICLOUD_ACCOUNT = "iCloud";

  /**
   * Creates a new note in Apple Notes
   * @param title - The note title
   * @param content - The note content
   * @param tags - Optional array of tags
   * @returns The created note object or null if creation fails
   */
  createNote(title: string, content: string, tags: string[] = []): Note | null {
    const formattedContent = formatContent(content);
    const script = `
      tell application "Notes"
        tell account "${this.ICLOUD_ACCOUNT}"
          make new note with properties {name:"${title}", body:"${formattedContent}"}
        end tell
      end tell
    `;

    const result = runAppleScript(script);
    if (!result.success) {
      console.error('Failed to create note:', result.error);
      return null;
    }

    return {
      id: Date.now().toString(),
      title,
      content,
      tags,
      created: new Date(),
      modified: new Date()
    };
  }

  /**
   * Searches for notes by title
   * @param query - The search query
   * @returns Array of matching notes
   */
  searchNotes(query: string): Note[] {
    const sanitizedQuery = query.replace(/"/g, '\\"');
    const script = `
      tell application "Notes"
        tell account "${this.ICLOUD_ACCOUNT}"
          get name of notes where name contains "${sanitizedQuery}"
        end tell
      end tell
    `;

    const result = runAppleScript(script);
    if (!result.success) {
      console.error('Failed to search notes:', result.error);
      return [];
    }

    return result.output
      .split(',')
      .filter(Boolean)
      .map(title => ({
        id: Date.now().toString(),
        title: title.trim(),
        content: '',
        tags: [],
        created: new Date(),
        modified: new Date()
      }));
  }

  /**
   * Retrieves the content of a specific note
   * @param title - The exact title of the note
   * @returns The note content or empty string if not found
   */
  getNoteContent(title: string): string {
    const sanitizedTitle = title.replace(/"/g, '\\"');
    const script = `
      tell application "Notes"
        tell account "${this.ICLOUD_ACCOUNT}"
          get body of note "${sanitizedTitle}"
        end tell
      end tell
    `;

    const result = runAppleScript(script);
    if (!result.success) {
      console.error('Failed to get note content:', result.error);
      return '';
    }

    return result.output;
  }
}
