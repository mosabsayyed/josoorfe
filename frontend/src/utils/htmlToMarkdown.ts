/**
 * Simple HTML to Markdown converter
 * Handles common tags used in LLM responses: h1-h6, p, ul, li, b, strong, i, em, a, code, pre
 * Preserves tables as HTML (valid in Markdown)
 */
export function htmlToMarkdown(html: string): string {
    if (!html) return '';

    let md = html;

    // Headings
    md = md.replace(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/gi, (match, level, content) => {
        return '\n' + '#'.repeat(parseInt(level)) + ' ' + content + '\n';
    });

    // Bold
    md = md.replace(/<(b|strong)\b[^>]*>(.*?)<\/\1>/gi, '**$2**');

    // Italic
    md = md.replace(/<(i|em)\b[^>]*>(.*?)<\/\1>/gi, '*$2*');

    // Links
    md = md.replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Unordered Lists
    md = md.replace(/<ul\b[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        return '\n' + content.replace(/<li\b[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    });

    // Ordered Lists (Simplified to use 1. for all - generic markdown parser handles numbering)
    md = md.replace(/<ol\b[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        let index = 1;
        return '\n' + content.replace(/<li\b[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + '\n';
    });

    // Code Blocks
    md = md.replace(/<pre\b[^>]*><code\b[^>]*>(.*?)<\/code><\/pre>/gis, '\n```\n$1\n```\n');
    md = md.replace(/<code\b[^>]*>(.*?)<\/code>/gi, '`$1`');

    // Paragraphs
    md = md.replace(/<p\b[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Line breaks
    md = md.replace(/<br\s*\/?>/gi, '\n');

    // Headers cells (bolding them) - Keep table structure but maybe clean up basics? 
    // Actually, HTML tables are valid in Markdown. Let's leave strict table tags alone.
    // The previous replacements (b/strong) might have affected cell content, which is fine.

    // Strip <ui-*> wrappers (like <ui-table>) but keep content
    md = md.replace(/<ui-[a-zA-Z0-9-]+\b[^>]*>(.*?)<\/ui-[a-zA-Z0-9-]+>/gis, '$1');

    // Decode generic HTML entities (basic ones)
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/&quot;/g, '"');

    // Clean up multiple newlines
    md = md.replace(/\n\s*\n/g, '\n\n');

    return md.trim();
}
