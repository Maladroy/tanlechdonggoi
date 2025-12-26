import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-slate max-w-none bg-zinc-50 px-2.5 py-1 rounded-sm prose-headings:font-bold prose-headings:text-gray-800 prose-headings:mt-6 prose-headings:mb-3 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-strong:text-gray-900 prose-strong:font-bold">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Downgrade headings to preserve modal hierarchy (Modal Title is H2/H1)
                    h1: ({ node, ...props }) => <h3 className="text-lg mt-4 mb-2" {...props} />,
                    h2: ({ node, ...props }) => (
                        <h4 className="text-base font-bold mt-4 mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h5 className="text-sm font-bold uppercase tracking-wide text-gray-500 mt-3 mb-1" {...props} />
                    ),
                    // Style links
                    a: ({ node, ...props }) => (
                        <a
                            className="text-orange-600 hover:underline font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    ),
                    // Style lists
                    ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 space-y-1 my-3" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 space-y-1 my-3" {...props} />
                    ),
                    // Images
                    img: ({ node, ...props }) => (
                        <img className="rounded-xl shadow-sm my-4 border border-gray-100 max-h-96 object-contain bg-gray-50" {...props} alt={props.alt || ''} />
                    ),
                    // Blockquotes
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-orange-200 pl-4 italic text-gray-500 my-4 bg-gray-50 py-2 pr-2 rounded-r-lg" {...props} />
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
