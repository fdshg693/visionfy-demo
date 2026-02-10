'use client';
import { ChatMarkdown } from './ChatMarkdown';
import { ToolCallIndicator } from './ToolCallIndicator';

interface MessageContentProps {
    content: string;
}

/**
 * AIメッセージのコンテンツをレンダリング
 * ツール呼び出しマーカーを検出してインジケーターとして表示する
 */
export function MessageContent({ content }: MessageContentProps) {
    const parts: Array<{ type: 'text'; content: string } | { type: 'tool'; toolName: string }> = [];
    let lastIndex = 0;

    // 毎回新しいRegExpインスタンスを作成してlastIndex問題を回避
    const pattern = /<<TOOL_START:(.+?)>>|<<TOOL_END:(.+?)>>|<<WORKFLOW_DATA:(.+?)>>/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
        // Add text before the marker
        if (match.index > lastIndex) {
            const text = content.slice(lastIndex, match.index);
            if (text.trim()) {
                parts.push({ type: 'text', content: text });
            }
        }

        // Only show indicator for TOOL_START (not TOOL_END to avoid duplicates)
        const startName = match[1];
        if (startName) {
            parts.push({ type: 'tool', toolName: startName });
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        const text = content.slice(lastIndex);
        if (text.trim()) {
            parts.push({ type: 'text', content: text });
        }
    }

    // If no markers found, just render as markdown
    if (parts.length === 0 && content.trim()) {
        return <ChatMarkdown content={content} />;
    }

    return (
        <>
            {parts.map((part, i) =>
                part.type === 'tool' ? (
                    <ToolCallIndicator key={i} toolName={part.toolName} />
                ) : (
                    <ChatMarkdown key={i} content={part.content} />
                )
            )}
        </>
    );
}
