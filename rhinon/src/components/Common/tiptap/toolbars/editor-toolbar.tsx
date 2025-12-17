import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToolbarProvider } from "./toolbar-provider";
import type { Editor } from "@tiptap/core";
import { HeadingsToolbar } from "./headings";
import { BlockquoteToolbar } from "./blockquote";
import { CodeToolbar } from "./code";
import { BoldToolbar } from "./bold";
import { ItalicToolbar } from "./italic";
import { UnderlineToolbar } from "./underline";
import { StrikeThroughToolbar } from "./strikethrough";
import { LinkToolbar } from "./link";
import { BulletListToolbar } from "./bullet-list";
import { OrderedListToolbar } from "./ordered-list";
import { HorizontalRuleToolbar } from "./horizontal-rule";
import { AlignmentTooolbar } from "./alignment";
import { ImagePlaceholderToolbar } from "./image-placeholder-toolbar";
import { ColorHighlightToolbar } from "./color-and-highlight";
import { SearchAndReplaceToolbar } from "./search-and-replace-toolbar";
import { CodeBlockToolbar } from "./code-block";

export const EditorToolbar = ({ editor }: { editor: Editor }) => {
  return (
      <ToolbarProvider editor={editor}>
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-1">
            <HeadingsToolbar />
            <BlockquoteToolbar />
            <CodeToolbar />
            <CodeBlockToolbar />
            <BoldToolbar />
            <ItalicToolbar />
            <UnderlineToolbar />
            <StrikeThroughToolbar />
            <LinkToolbar />
            <BulletListToolbar />
            <OrderedListToolbar />
            <HorizontalRuleToolbar />
            <AlignmentTooolbar />
            <ImagePlaceholderToolbar />
            <ColorHighlightToolbar />
            <SearchAndReplaceToolbar />
          </div>
        </TooltipProvider>
      </ToolbarProvider>
  );
};
