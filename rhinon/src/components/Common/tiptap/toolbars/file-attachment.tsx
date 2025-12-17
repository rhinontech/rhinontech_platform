// FileAttachment.ts
import { Node, mergeAttributes } from "@tiptap/core";

export const FileAttachment = Node.create({
  name: "fileAttachment",

  group: "block",
  atom: true,

  addAttributes() {
    return {
      url: { default: null },
      filename: { default: null },
      size: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-file-attachment]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-file-attachment": "true" }),
      [
        "a",
        {
          href: node.attrs.url,
          target: "_blank",
          rel: "noopener noreferrer",
          class:
            "flex items-center gap-2 p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-50",
        },
        [
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            class: "h-5 w-5 text-gray-500",
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
          },
          [
            "path",
            {
              d: "M7 7v10M17 7v10M4 17h16M4 7h16",
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": 2,
            },
          ],
        ],
        [
          "div",
          { class: "flex-1 truncate" },
          [
            "p",
            { class: "text-sm font-medium text-gray-900 truncate" },
            node.attrs.filename,
          ],
          [
            "p",
            { class: "text-xs text-gray-500" },
            `${(node.attrs.size / 1024).toFixed(1)} KB`,
          ],
        ],
      ],
    ];
  },
});
