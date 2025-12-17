"use client";

import {
  ArrowRight,
  Paperclip,
  Bot,
  Check,
  ChevronDown,
  AlertCircle,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  ListOrdered,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  X,
  Maximize2,
  Minimize2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import {
  GoogleIcon,
  MicrosoftIcon,
  SupportIcon,
} from "@/components/Constants/SvgIcons";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Typography from "@tiptap/extension-typography";
import { ImageExtension } from "@/components/Common/tiptap/extensions/image";
import { ImagePlaceholder } from "@/components/Common/tiptap/extensions/image-placeholder";
import SearchAndReplace from "./tiptap/extensions/search-and-replace";
import { uploadFileAndGetFullUrl } from "@/services/fileUploadService";
import { FileAttachment } from "./tiptap/toolbars/file-attachment";

import "./ticket-input";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useTokenManager } from "@/hooks/userTokenManager";

type InputProps = {
  onSubmit: (value: string, model: string) => void;
  setAttachment: any;
};

export default function TICKET_INPUT({ onSubmit, setAttachment }: InputProps) {
  const router = useRouter();
  const role = Cookies.get("currentRole");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>(["SUPPORT"]);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Attachment state
  const [attachmentData, setAttachmentData] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(false);

  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [isColorOpen, setIsColorOpen] = useState(false);
  const [colorValue, setColorValue] = useState("#000000");
  const [isImageOpen, setIsImageOpen] = useState(false);

  //  Call hooks directly here, not inside useEffect
  useTokenManager("GOOGLE", (token) => {
    console.log("Google token refreshed:", token);
    setAvailableModels((prev) =>
      prev.includes("GOOGLE") ? prev : [...prev, "GOOGLE"]
    );
  });

  useTokenManager("MICROSOFT", (token) => {
    console.log("Microsoft token refreshed:", token);
    setAvailableModels((prev) =>
      prev.includes("MICROSOFT") ? prev : [...prev, "MICROSOFT"]
    );
  });

  // Handle model selection and modal visibility
  useEffect(() => {
    if (availableModels.length > 0) {
      setSelectedModel((prev) => prev || availableModels[0]);
      setShowNoAccountModal(false);
    } else {
      setShowNoAccountModal(true);
    }
  }, [availableModels]);

  const MODEL_ICONS: Record<string, React.ReactNode> = {
    MICROSOFT: <MicrosoftIcon />,
    GOOGLE: <GoogleIcon />,
    SUPPORT: <SupportIcon />,
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal",
          },
          keepMarks: true,
          keepAttributes: false,
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc",
          },
          keepMarks: true,
          keepAttributes: false,
        },
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        emptyNodeClass: "is-editor-empty",
        placeholder: "Type Here ...",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Subscript,
      Superscript,
      Underline,
      Link.configure({ openOnClick: false }),
      Color,
      Highlight.configure({ multicolor: true }),
      ImageExtension,
      ImagePlaceholder,
      SearchAndReplace,
      Typography,
      FileAttachment,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "w-full bg-white dark:bg-neutral-900 rounded-t-2xl",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (isLinkOpen) {
      setLinkInput(editor.getAttributes("link").href ?? "");
    }
  }, [isLinkOpen, editor]);

  useEffect(() => {
    if (!editor) return;
    if (isColorOpen) {
      const current =
        editor.getAttributes("textStyle")?.color ??
        editor.getAttributes("textStyle")?.style ??
        "";
      if (typeof current === "string" && current.startsWith("color:")) {
        const match = current.match(
          /color:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/
        );
        setColorValue(match?.[1] ?? "#000000");
      } else {
        setColorValue(current || "#000000");
      }
    }
  }, [isColorOpen, editor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAttachmentLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      let base64 = event.target?.result as string;
      if (base64) {
        base64 = base64.split(",")[1];
        const attachment = {
          name: file.name,
          type: file.type,
          data: base64,
        };
        setAttachmentData(attachment);
        setAttachment(attachment);
        setIsAttachmentLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentData(null);
    setAttachment(null);
  };

  const handleSubmit = () => {
    if (!selectedModel) {
      setShowNoAccountModal(true);
      return;
    }
    const htmlContent = editor?.getHTML().trim();
    if (!htmlContent || htmlContent === "<p></p>") return;

    onSubmit(htmlContent, selectedModel);
    editor?.commands.clearContent();
    removeAttachment();
    setIsMaximized(false);
  };

  const applyLink = () => {
    if (!editor) return;
    const url = linkInput.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setIsLinkOpen(false);
  };

  const applyColor = (value: string) => {
    if (!editor) return;
    setColorValue(value);
    editor.chain().focus().setColor(value).run();
  };

  const formatLabel = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  const activeColorFromEditor = () => {
    if (!editor) return "";
    const txt = editor.getAttributes("textStyle") ?? {};
    if (txt.color) return txt.color;
    if (txt.style) {
      const m = (txt.style as string).match(
        /color:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/
      );
      return m?.[1] ?? "";
    }
    return "";
  };

  const currentEditorColor = activeColorFromEditor();

  const currentAlignIcon = () => {
    if (!editor) return <AlignLeft className="w-4 h-4" />;
    if (editor.isActive({ textAlign: "left" }))
      return <AlignLeft className="w-4 h-4" />;
    if (editor.isActive({ textAlign: "center" }))
      return <AlignCenter className="w-4 h-4" />;
    if (editor.isActive({ textAlign: "right" }))
      return <AlignRight className="w-4 h-4" />;
    if (editor.isActive({ textAlign: "justify" }))
      return <AlignJustify className="w-4 h-4 " />;
    return <AlignLeft className="w-4 h-4" />;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return "🖼️";
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("document")) return "📝";
    if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
    return "📎";
  };

  const EditorComponent = (
    <div
      className={cn(
        "border rounded-2xl shadow-sm bg-white dark:bg-neutral-900",
        isMaximized && "h-full flex flex-col"
      )}>
      {/* Maximize/Minimize button at top right */}

      <EditorContent
        editor={editor}
        placeholder="Type Here..."
        className={cn(
          "tiptap-editor text-black dark:text-white p-2 rounded-t-2xl overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent [scrollbar-gutter:stable_both-edges] transition-all duration-300 ease-in-out",
          isMaximized ? "flex-1" : isImageOpen ? "max-h-[40vh]" : "max-h-[20vh]"
        )}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />

      {/* Attachment Preview */}
      <AnimatePresence>
        {(attachmentData || isAttachmentLoading) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isAttachmentLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Loading attachment...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl flex-shrink-0">
                      {getFileIcon(attachmentData?.type || "")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {attachmentData?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {attachmentData?.type}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {!isAttachmentLoading && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={removeAttachment}
                  className="h-8 w-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0">
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {editor && (
        <TooltipProvider delayDuration={200}>
          <div className="border-t bg-black/5 dark:bg-white/5 rounded-b-2xl px-3 py-2 flex flex-col gap-2">
            <div className="w-full flex items-center justify-between flex-wrap rounded-full dark:bg-neutral-700 px-2 py-1 shadow-sm">
              {/* Left Section: Formatting Tools */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  {
                    label: "Bold",
                    icon: Bold,
                    fn: () => editor.chain().focus().toggleBold().run(),
                    active: "bold",
                  },
                  {
                    label: "Italic",
                    icon: Italic,
                    fn: () => editor.chain().focus().toggleItalic().run(),
                    active: "italic",
                  },
                  {
                    label: "Underline",
                    icon: UnderlineIcon,
                    fn: () => editor.chain().focus().toggleUnderline().run(),
                    active: "underline",
                  },
                  {
                    label: "Subscript",
                    icon: SubscriptIcon,
                    fn: () => editor.chain().focus().toggleSubscript().run(),
                    active: "subscript",
                  },
                  {
                    label: "Superscript",
                    icon: SuperscriptIcon,
                    fn: () => editor.chain().focus().toggleSuperscript().run(),
                    active: "superscript",
                  },
                  {
                    label: "Highlight",
                    icon: Highlighter,
                    fn: () => editor.chain().focus().toggleHighlight().run(),
                    active: "highlight",
                  },
                  {
                    label: "Bullet List",
                    icon: List,
                    fn: () => editor.chain().focus().toggleBulletList().run(),
                    active: "bulletList",
                  },
                  {
                    label: "Numbered List",
                    icon: ListOrdered,
                    fn: () => editor.chain().focus().toggleOrderedList().run(),
                    active: "orderedList",
                  },
                  {
                    label: "Image",
                    icon: ImageIcon,
                    fn: () => {
                      setIsImageOpen(true);
                      editor.chain().focus().insertImagePlaceholder().run();
                    },
                  },
                ].map(({ label, icon: Icon, fn, active }, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={fn}
                        className={cn(
                          "rounded-full",
                          active &&
                            editor.isActive(active) &&
                            "bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-white"
                        )}>
                        <Icon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{label}</TooltipContent>
                  </Tooltip>
                ))}

                {/* Link */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu
                      open={isLinkOpen}
                      onOpenChange={setIsLinkOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "rounded-full",
                            editor.isActive("link") &&
                              "bg-blue-100 dark:bg-blue-600 text-blue-600 dark:text-white"
                          )}>
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="center"
                        className="p-3 w-64">
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Enter URL"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), applyLink())
                            }
                            className="w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setLinkInput("");
                                editor?.chain().focus().unsetLink().run();
                                setIsLinkOpen(false);
                              }}>
                              Remove
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={applyLink}>
                              Apply
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent side="top">Link</TooltipContent>
                </Tooltip>

                {/* File Attach */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="rounded-lg p-2 dark:bg-neutral-700 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Paperclip className="w-4 h-4" />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent side="top">Attach File</TooltipContent>
                </Tooltip>

                {/* Text Color */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu
                      open={isColorOpen}
                      onOpenChange={setIsColorOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full">
                          <div
                            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                            style={{
                              backgroundColor: currentEditorColor || colorValue,
                            }}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="center"
                        className="p-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={colorValue}
                            onChange={(e) => applyColor(e.target.value)}
                            className="w-16 h-8 cursor-pointer border-none bg-transparent p-0"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setColorValue("#000000");
                              editor.chain().focus().setColor("").run();
                              setIsColorOpen(false);
                            }}>
                            Clear
                          </Button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent side="top">Text Color</TooltipContent>
                </Tooltip>

                {/* Text Alignment */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="rounded-full">
                          {currentAlignIcon()}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="center"
                        className="p-2 w-36">
                        {["left", "center", "right", "justify"].map((value) => (
                          <DropdownMenuItem
                            key={value}
                            onSelect={() =>
                              editor?.chain().focus().setTextAlign(value).run()
                            }>
                            <div className="flex items-center gap-2 capitalize">
                              {value}
                              {editor?.isActive({ textAlign: value }) && (
                                <Check className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent side="top">Text Alignment</TooltipContent>
                </Tooltip>
              </div>

              {/* Right Section: Maximize Button */}
              <div className="flex items-center">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="h-7 w-7 rounded-md">
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 h-8 pl-1 pr-2 text-xs rounded-md dark:text-white">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedModel ?? "placeholder"}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center pl-1 gap-1">
                        {selectedModel ? MODEL_ICONS[selectedModel] : null}
                        {selectedModel ? formatLabel(selectedModel) : "Select"}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </motion.div>
                    </AnimatePresence>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {availableModels.length ? (
                    availableModels.map((model) => (
                      <DropdownMenuItem
                        key={model}
                        onSelect={() => setSelectedModel(model)}>
                        <div className="flex items-center gap-2">
                          {MODEL_ICONS[model] || (
                            <Bot className="w-4 h-4 opacity-50" />
                          )}
                          <span>{formatLabel(model)}</span>
                        </div>
                        {selectedModel === model && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      No connected accounts
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleSubmit}
                className="rounded-lg bg-[#063268] hover:bg-[#063268] text-white px-4 flex items-center gap-1">
                <ArrowRight className="w-4 h-4" /> Send
              </Button>
            </div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );

  return (
    <>
      {isMaximized ? (
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMaximized(false);
            }}>
            <motion.div
              className="w-full max-w-4xl h-[80vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              {EditorComponent}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : (
        EditorComponent
      )}

      <AnimatePresence>
        {showNoAccountModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div
              className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}>
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2 dark:text-white">
                No Connected Account
              </h2>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                You need to add a Google or Microsoft account to send messages.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => router.push(`/${role}/settings/accounts`)}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                  Go to Account Section
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNoAccountModal(false)}
                  className="text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
