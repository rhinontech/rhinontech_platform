"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/context/SidebarContext";
import { Copy, Code, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { useUserStore } from "@/utils/store";
import icons from "@/components/Constants/icons";
import { getApiKey, updateApiKey } from "@/services/chatbot/chatbotService";
import { toast } from "sonner";

interface ContentItem {
  command: string;
  description: string;
  note?: string;
  additionalNote?: string;
  filename?: string;
  code: string;
  step2Code?: string;
  step2Filename?: string;
  step3Code?: string;
  step3Filename?: string;
}

interface StepContent {
  title: string;
  tabs: string[];
  content: {
    npm: ContentItem;
    "basic-js"?: ContentItem;
  };
  hasStep3?: boolean;
}

export default function Messenger() {
  const { toggleSettingSidebar } = useSidebar();
  const [selectedMethod, setSelectedMethod] = useState("code-snippet");
  const [selectedTab, setSelectedTab] = useState("npm");
  const chatbotId = useUserStore((state) => state.userData.chatbotId);
  const userPlan = useUserStore((state) => state.userData.orgPlan);

  const isFreeMode = userPlan == "Free" ? true : false;
  const stepOffset = isFreeMode ? 1 : 0;

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const prevValue = useRef("");
  const hasInitialized = useRef(false);

  // Fetch the saved API key on mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await getApiKey();
        if (res?.apiKey) {
          setGeminiApiKey(res.apiKey);
          prevValue.current = res.apiKey;
        }
        hasInitialized.current = true;
      } catch (err) {
        console.error("Failed to fetch Gemini API key", err);
        // toast.error("Failed to fetch API key");
      }
    };

    fetchApiKey();
  }, []);

  // Debounced update when API key changes
  useEffect(() => {
    // Don't run on first load
    if (!hasInitialized.current) return;

    // Skip if unchanged
    if (geminiApiKey === prevValue.current) return;

    // Clear any pending updates
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        setLoading(true);
        await updateApiKey(geminiApiKey || ""); // your update endpoint
        setLoading(false);

        prevValue.current = geminiApiKey; // update ref after success
        toast.success("API key updated successfully");
      } catch (err: any) {
        console.error("Failed to update Gemini API key", err);
        setLoading(false);
        toast.error(err?.response?.data?.message || "Failed to update API key");
      }
    }, 700); // wait 700ms after user stops typing

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [geminiApiKey]);

  const installationMethods = [
    {
      id: "code-snippet",
      label: "Code Snippet",
      icon: Code,
      iconType: "lucide",
    },
    { id: "react", label: "React", iconPath: icons.react, iconType: "image" },
    {
      id: "nextjs",
      label: "Next.js",
      iconPath: icons.next,
      iconType: "image",
    },
    {
      id: "nuxtjs",
      label: "Nuxt.js",
      iconPath: icons.nuxt,
      iconType: "image",
    },
    {
      id: "angular",
      label: "Angular",
      iconPath: icons.angular,
      iconType: "image",
    },
    { id: "vue", label: "Vue", iconPath: icons.vue, iconType: "image" },
    {
      id: "ember",
      label: "Ember",
      iconPath: icons.ember,
      iconType: "image",
    },
    {
      id: "nestjs",
      label: "NestJS",
      iconPath: icons.nest,
      iconType: "image",
    },
  ];

  const getStepTwoContent = (): StepContent => {
    switch (selectedMethod) {
      case "code-snippet":
        return {
          title: "Install Rhinon in your Code Snippet",
          tabs: ["npm", "basic-js"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "To initialize Rhinon, copy and paste this code snippet on every page or in a common component where you want the messenger to appear.",
              note: "This must be done in your client-side code.",
              code: `import { useEffect } from 'react';
import Rhinontech from '@rhinon/botsdk';

export default function Chatbot() {
  useEffect(() => {
    Rhinontech({
      app_id: '${chatbotId}'
    });
  }, []);

  return null;
}`,
            },
            "basic-js": {
              command: "npm install @rhinon/botsdk",
              description:
                "To initialize Rhinon, copy and paste this code snippet on every page where you want the messenger to appear.",
              note: "Add this script after the DOM is fully loaded.",
              code: `<script src="https://rhinon-botsdk.web.app/rhinonbot.js"></script>
<script>
  const Rhinontech =
    window.RhinonBot.default || window.RhinonBot.initRhinontech;

  Rhinontech({
    app_id: "${chatbotId}"
  });
</script>`,
            },
          },
        };
      case "react":
        return {
          title: "Install Rhinon in your React application",
          tabs: ["npm"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "Add Rhinon Tech to your project using the following snippet:",
              note: "To initialize Rhinon Tech, copy and paste this code snippet on every page or in a common component where you want the messenger to appear.",
              additionalNote: "This must be done in your client-side code.",
              code: `import { useEffect } from 'react';
import Rhinontech from '@rhinon/botsdk';

export default function Chatbot() {
  useEffect(() => {
    Rhinontech({
      app_id: '${chatbotId}'
    });
  }, []);

  return null;
}`,
            },
          },
        };
      case "nextjs":
        return {
          title: "Install Rhinon in your Next.js application",
          tabs: ["npm"],
          hasStep3: true,
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "Install the Rhinon SDK and create a client component wrapper for the chatbot.",
              note: "Step 1: Create a client component wrapper",
              filename: "components/Chatbot/ChatbotWrapper.tsx",
              code: `'use client';

import dynamic from 'next/dynamic';

const Chatbot = dynamic(() => import('./Chatbot'), {
  ssr: false,
});

export default function ChatbotWrapper() {
  return <Chatbot />;
}`,
              step2Filename: "components/Chatbot/Chatbot.tsx",
              step2Code: `import { useEffect } from 'react';
import Rhinontech from '@rhinon/botsdk';

export default function Chatbot() {
  useEffect(() => {
    Rhinontech({
      app_id: '${chatbotId}'
    });
  }, []);

  return null;
}`,
            },
          },
        };
      case "nuxtjs":
        return {
          title: "Install Rhinon in your Nuxt.js application",
          tabs: ["npm"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "Install the Rhinon SDK and create a plugin for client-side initialization.",
              note: "Step 1: Create a Nuxt plugin",
              filename: "plugins/rhinon.client.ts",
              code: `import Rhinontech from '@rhinon/botsdk';

export default defineNuxtPlugin(() => {
  if (process.client) {
    Rhinontech({
      app_id: '${chatbotId}'
    });
  }
});`,
              step2Filename: "nuxt.config.ts",
              step2Code: `export default defineNuxtConfig({
  plugins: [
    '~/plugins/rhinon.client.ts'
  ]
});`,
            },
          },
        };
      case "angular":
        return {
          title: "Install Rhinon in your Angular application",
          tabs: ["npm"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "Install the Rhinon SDK and initialize it in your Angular component.",
              note: "To initialize the chatbot, copy and paste this Angular code snippet into your root component or where you want the chatbot to appear.",
              filename: "app.component.ts",
              code: `import { Component, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'angular';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('@rhinon/botsdk').then((RhinontechModule) => {
        const Rhinontech = RhinontechModule.default;
        Rhinontech({
          app_id: '${chatbotId}'
        });
      });
    }
  }
}`,
            },
          },
        };
      case "vue":
        return {
          title: "Install Rhinon in your Vue application",
          tabs: ["npm"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "Install the Rhinon SDK and initialize it in your Vue component.",
              note: "To initialize the chatbot, copy and paste this Vue code snippet into your root component or where you want the chatbot to appear.",
              filename: "App.vue",
              code: `<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Rhinontech from '@rhinon/botsdk';

onMounted(() => {
  Rhinontech({
    app_id: '${chatbotId}'
  });
});
</script>`,
            },
          },
        };
      case "ember":
        return {
          title: "Install Rhinon in your Ember application",
          tabs: ["npm"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "Install the Rhinon SDK and initialize it in your Ember application.",
              note: "Step 1: Create an initializer for the chatbot",
              filename: "app/initializers/rhinon-chatbot.js",
              code: `import Rhinontech from '@rhinon/botsdk';

export function initialize() {
  if (typeof FastBoot === 'undefined') {
    Rhinontech({
      app_id: '${chatbotId}'
    });
  }
}

export default {
  name: 'rhinon-chatbot',
  initialize
};`,
              step2Filename: "app/app.js",
              step2Code: `import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);`,
            },
          },
        };
      case "nestjs":
        return {
          title: "Install Rhinon in your NestJS application",
          tabs: ["npm"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description:
                "Install the Rhinon SDK and add it to your HTML template for client-side rendering.",
              note: "Add this script to your HTML template (e.g., in your main.hbs or index.html file served by NestJS).",
              additionalNote:
                "Note: NestJS is a backend framework. The chatbot must be initialized on the client side.",
              filename: "public/index.html",
              code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your App</title>
</head>
<body>
  <div id="root"></div>
  
  <!-- Rhinon Chatbot -->
  <script src="https://rhinon-botsdk.web.app/rhinonbot.js"></script>
  <script>
    const Rhinontech = window.RhinonBot.default || window.RhinonBot.initRhinontech;
    
    Rhinontech({
      app_id: '${chatbotId}'
    });
  </script>
</body>
</html>`,
              step2Filename: "src/main.ts",
              step2Code: `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  await app.listen(3000);
}
bootstrap();`,
            },
          },
        };
      default:
        return {
          title: "Install Rhinon in your Code Snippet",
          tabs: ["npm"],
          content: {
            npm: {
              command: "npm install @rhinon/botsdk",
              description: "Default installation method",
              code: "// Default code",
            },
          },
        };
    }
  };

  const stepContent = getStepTwoContent();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCurrentContent = () => {
    return (
      stepContent.content[selectedTab as keyof typeof stepContent.content] ||
      stepContent.content.npm
    );
  };
  const onboarding = useUserStore((state) => state.userData.onboarding);
  const chatbotInstalled = onboarding?.chatbot_installed || false;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <div className="flex flex-1 flex-col w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b h-[60px] p-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <PanelLeft
              onClick={toggleSettingSidebar}
              className="h-4 w-4 cursor-pointer"
            />
            <h2 className="text-base font-bold text-foreground">Messenger</h2>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className={`flex items-center gap-2 border-[2px] px-4 py-1 text-xs font-mono ${
                chatbotInstalled
                  ? "text-green-600 border-green-400 hover:text-green-600"
                  : "text-red-600 border-red-400 hover:text-red-600"
              }`}>
              {/* status dot */}
              <span
                className={`h-2 w-2 rounded-full ${
                  chatbotInstalled ? "bg-green-500" : "bg-red-500"
                }`}></span>

              {chatbotInstalled ? "Activated" : "Chatbot Not Installed"}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 h-0 p-4">
          <div className="p-6 space-y-8 text-foreground">
            {/* Step 1 - Gemini API Key (only for FreeMode) */}
            {isFreeMode && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                    1
                  </div>
                  <h2 className="text-base font-medium">
                    Configure your Gemini API Key
                  </h2>
                </div>

                <div className="ml-9 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Since you're on the Free plan, you need to provide your own
                    Gemini API key to use the chatbot.
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Gemini API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(geminiApiKey)}
                        disabled={!geminiApiKey || loading}
                        className="text-xs">
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Don't have a Gemini API key?{" "}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline">
                        Get one here
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1/2 - Choose Installation Method */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                  {1 + stepOffset}
                </div>
                <h2 className="text-base font-medium">
                  Choose how to install the messenger
                </h2>
              </div>

              <div className="flex gap-3 ml-9 flex-wrap">
                {installationMethods.map((method: any) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedMethod(method.id);
                        setSelectedTab("npm");
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-muted"
                      }`}>
                      {method.iconType === "image" ? (
                        <img
                          src={
                            typeof method.iconPath === "string"
                              ? method.iconPath
                              : method.iconPath?.src
                          }
                          alt={`${method.label} icon`}
                          className="w-4 h-4 object-contain"
                        />
                      ) : (
                        <Code className="w-4 h-4" />
                      )}
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2/3 - Installation Instructions */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                  {2 + stepOffset}
                </div>
                <h2 className="text-base font-medium">{stepContent.title}</h2>
              </div>

              <div className="ml-9 space-y-4">
                {getCurrentContent().description && (
                  <p className="text-sm text-muted-foreground">
                    {getCurrentContent().description}
                  </p>
                )}

                {stepContent.tabs.length > 1 && (
                  <div className="flex gap-2">
                    {stepContent.tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedTab === tab
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}>
                        {tab === "npm" ? "NPM Package" : "Basic Javascript"}
                      </button>
                    ))}
                  </div>
                )}

                <Card className="p-0">
                  <CardContent className="px-5 py-3 flex items-center justify-between bg-muted/50">
                    <code className="text-xs font-mono text-muted-foreground">
                      {getCurrentContent().command}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(getCurrentContent().command)
                      }
                      className="ml-4 text-xs">
                      <Copy className="w-3 h-3 mr-1" />
                      Copy code
                    </Button>
                  </CardContent>
                </Card>

                {getCurrentContent().note && (
                  <p className="text-sm text-muted-foreground">
                    {getCurrentContent().note}
                  </p>
                )}
                {getCurrentContent().filename && (
                  <p className="text-xs font-medium text-muted-foreground">
                    {getCurrentContent().filename}
                  </p>
                )}
                {getCurrentContent().additionalNote && (
                  <p className="text-xs font-medium text-foreground">
                    {getCurrentContent().additionalNote}
                  </p>
                )}

                <div className="space-y-2">
                  <CodeBlock
                    language={
                      selectedMethod === "angular"
                        ? "typescript"
                        : selectedTab === "basic-js" ||
                          selectedMethod === "ember"
                        ? "javascript"
                        : selectedMethod === "nextjs" ||
                          selectedMethod === "nuxtjs" ||
                          selectedMethod === "nestjs"
                        ? "typescript"
                        : selectedMethod === "vue"
                        ? "html"
                        : "jsx"
                    }
                    filename={
                      getCurrentContent().filename ||
                      `${
                        selectedMethod === "angular"
                          ? "app.component.ts"
                          : selectedTab === "basic-js"
                          ? "index.html"
                          : selectedMethod === "vue"
                          ? "App.vue"
                          : selectedMethod === "ember"
                          ? "app/initializers/rhinon-chatbot.js"
                          : "Chatbot.tsx"
                      }`
                    }
                    code={getCurrentContent().code}
                  />
                </div>

                {/* Step 2 - Second Code Block */}
                {getCurrentContent().step2Code && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {selectedMethod === "nextjs"
                        ? "Step 2: Create the main Chatbot component"
                        : selectedMethod === "ember"
                        ? "Step 2: Ensure initializers are loaded in your app"
                        : selectedMethod === "nuxtjs"
                        ? "Step 2: Register the plugin in nuxt.config.ts"
                        : selectedMethod === "nestjs"
                        ? "Step 2: Configure static assets in main.ts"
                        : "Step 2: Additional configuration"}
                    </p>
                    <div className="space-y-2">
                      <CodeBlock
                        language={
                          selectedMethod === "nextjs" ||
                          selectedMethod === "nuxtjs" ||
                          selectedMethod === "nestjs"
                            ? "typescript"
                            : "javascript"
                        }
                        filename={
                          getCurrentContent().step2Filename || "config.js"
                        }
                        code={getCurrentContent().step2Code}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3/4 - Usage in Layout (only for Next.js) */}
            {stepContent.hasStep3 && selectedMethod === "nextjs" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">
                    {3 + stepOffset}
                  </div>
                  <h2 className="text-base font-medium">
                    Add to your layout or page
                  </h2>
                </div>

                <div className="ml-9 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Import the ChatbotWrapper in your layout.tsx to make the
                    chatbot available across all pages.
                  </p>
                  <div className="space-y-2">
                    <CodeBlock
                      language="typescript"
                      filename="app/layout.tsx"
                      code={`import ChatbotWrapper from '@/components/Chatbot/ChatbotWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatbotWrapper />
      </body>
    </html>
  );
}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
