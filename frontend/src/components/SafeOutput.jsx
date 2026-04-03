
import React from 'react'
import DOMPurify from 'dompurify'

// Wrapper for displaying user-provided content safely
export default function SafeOutput({ children, html = false }) {
    if (html) {
        // If HTML is passed, sanitize it
        const clean = DOMPurify.sanitize(children)
        return <span dangerouslySetInnerHTML={{ __html: clean }} />
    }
    // Standard React rendering automatically encodes most content
    // But we can add extra layer if needed or just return standard
    return <span>{children}</span>
}
