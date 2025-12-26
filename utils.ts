export function stripMarkdown(markdown: string): string {
    if (!markdown) return "";

    // Remove headers
    let text = markdown.replace(/^#+\s+/gm, "");

    // Remove bold/italic (handle **text**, __text__, *text*, _text_)
    text = text.replace(/(\*\*|__)(.*?)\1/g, "$2");
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");

    // Remove images ![alt](url) -> ""
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

    // Remove links [text](url) -> text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove code blocks
    text = text.replace(/`{1,3}(.*?)`{1,3}/g, "$1");

    // Remove blockquotes
    text = text.replace(/^>\s+/gm, "");

    // Remove list markers
    text = text.replace(/^[-*+]\s+/gm, "");

    // Remove horizontal rules
    text = text.replace(/^-{3,}/gm, "");

    return text.trim();
}
