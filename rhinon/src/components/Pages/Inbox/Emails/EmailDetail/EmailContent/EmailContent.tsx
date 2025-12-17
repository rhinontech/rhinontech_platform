"use client"

import { cn } from "@/lib/utils"

interface EmailContentProps {
  html: string
  className?: string
}

export function EmailContent({ html, className }: EmailContentProps) {
  return (
    <div
      className={cn("email-content-container w-full bg-white rounded border p-4", className)}
      style={{
        all: "initial",
        display: "block",
        width: "100%",
        backgroundColor: "white",
        borderRadius: "0.5rem",
        border: "1px solid hsl(var(--border))",
        padding: "1rem",
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: "1.5",
        color: "inherit",
      }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          all: "revert",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
        }}
        className="prose prose-sm max-w-none dark:prose-invert"
      />
      <style>{`
        .email-content-container * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .email-content-container p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .email-content-container h1,
        .email-content-container h2,
        .email-content-container h3,
        .email-content-container h4,
        .email-content-container h5,
        .email-content-container h6 {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .email-content-container a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        
        .email-content-container a:hover {
          opacity: 0.8;
        }
        
        .email-content-container img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        
        .email-content-container table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .email-content-container th,
        .email-content-container td {
          border: 1px solid hsl(var(--border));
          padding: 0.75rem;
          text-align: left;
        }
        
        .email-content-container th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }
        
        .email-content-container blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin: 1rem 0;
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        
        .email-content-container code {
          background-color: hsl(var(--muted));
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875em;
        }
        
        .email-content-container pre {
          background-color: hsl(var(--muted));
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .email-content-container pre code {
          background-color: transparent;
          padding: 0;
        }
        
        .email-content-container ul,
        .email-content-container ol {
          margin-left: 2rem;
          margin-bottom: 1rem;
        }
        
        .email-content-container li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  )
}
