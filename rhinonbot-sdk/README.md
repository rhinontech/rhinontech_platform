# @rhinon/botsdk

A lightweight, framework-agnostic JavaScript SDK for integrating Rhinon chatbot into your web applications. Built with TypeScript and React, this SDK provides seamless chatbot integration across various platforms and frameworks.

<br>

## Features

- 🚀 **Easy Integration** - Quick setup with just a few lines of code
- ⚛️ **Framework Support** - Works with React, Next.js, Angular, Vue, and vanilla JavaScript
- 🎨 **Customizable** - Configure appearance and behavior to match your brand
- 📱 **Responsive** - Mobile-friendly design that works on all devices
- 🔒 **Secure** - Built with security best practices
- 🌐 **SSR Compatible** - Full support for server-side rendering frameworks
- 💡 **TypeScript** - Full TypeScript support with type definitions
- ⚡ **Lightweight** - Minimal bundle size for optimal performance

<br>

## Installation

Install the package using your preferred package manager:

```bash
# using npm
npm install @rhinon/botsdk

# using yarn
yarn add @rhinon/botsdk

# using pnpm
pnpm add @rhinon/botsdk
```

<br>

## Quick Start

### Basic Usage (Vanilla JavaScript)

```javascript
import Rhinontech from '@rhinon/botsdk';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Rhinontech({
    app_id: 'YOUR_APP_ID',
    chatbot_config: {
      isBgFade: true
    }
  });
});
```

<br>

## Framework Integration

### React

```jsx
import { useEffect } from 'react';
import Rhinontech from '@rhinon/botsdk';

export default function Chatbot() {
  useEffect(() => {
    Rhinontech({
      app_id: 'YOUR_APP_ID',
      chatbot_config: {
        isBgFade: true
      }
    });
  }, []);

  return null;
}
```

<br>

### Next.js

For Next.js applications, you need to handle SSR properly:

**Step 1:** Create a client component wrapper

```tsx
// components/Chatbot/ChatbotWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

const Chatbot = dynamic(() => import('./Chatbot'), {
  ssr: false,
});

export default function ChatbotWrapper() {
  return <Chatbot />;
}
```

**Step 2:** Create the main Chatbot component

```tsx
// components/Chatbot/Chatbot.tsx
import { useEffect } from 'react';
import Rhinontech from '@rhinon/botsdk';

export default function Chatbot() {
  useEffect(() => {
    Rhinontech({
      app_id: 'YOUR_APP_ID',
      chatbot_config: {
        isBgFade: true
      }
    });
  }, []);

  return null;
}
```

**Step 3:** Add to your layout

```tsx
// app/layout.tsx
import ChatbotWrapper from '@/components/Chatbot/ChatbotWrapper';

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
}
```

<br>

### Angular

```typescript
// app.component.ts
import { Component, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('@rhinon/botsdk').then((RhinontechModule) => {
        const Rhinontech = RhinontechModule.default;
        Rhinontech({
          app_id: 'YOUR_APP_ID',
          chatbot_config: {
            isBgFade: true
          }
        });
      });
    }
  }
}
```

<br>

### Vue.js

```vue
<template>
  <div id="app">
    <!-- Your app content -->
  </div>
</template>

<script>
import { onMounted } from 'vue';
import Rhinontech from '@rhinon/botsdk';

export default {
  name: 'App',
  setup() {
    onMounted(() => {
      Rhinontech({
        app_id: 'YOUR_APP_ID',
        chatbot_config: {
          isBgFade: true
        }
      });
    });
  }
}
</script>
```

<br>

## Configuration Options

The SDK accepts the following configuration options:

```typescript
interface RhinontechConfig {
  app_id: string;              // Required: Your unique chatbot app ID
  admin?: boolean;             // Optional: Enable admin mode
  container?: HTMLElement;     // Optional: Custom container element
  chatbot_config?: {
    isBgFade?: boolean;        // Optional: Enable background fade effect
    // Add more config options as needed
  };
}
```

### Basic Configuration

```javascript
Rhinontech({
  app_id: 'YOUR_APP_ID',
  chatbot_config: {
    isBgFade: true
  }
});
```

### Advanced Configuration

```javascript
Rhinontech({
  app_id: 'YOUR_APP_ID',
  admin: false,
  container: document.getElementById('custom-container'),
  chatbot_config: {
    isBgFade: true
  }
});
```

<br>

## API Reference

### `Rhinontech(config: RhinontechConfig): ChatBotElement`

Initializes and returns a chatbot instance.

**Parameters:**
- `config` (RhinontechConfig): Configuration object for the chatbot

**Returns:**
- `ChatBotElement`: The chatbot custom element instance

<br>

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

<br>

## TypeScript Support

This package includes TypeScript type definitions. No additional `@types` package is required.

```typescript
import Rhinontech, { RhinontechConfig, ChatBotElement } from '@rhinon/botsdk';

const config: RhinontechConfig = {
  app_id: 'YOUR_APP_ID',
  chatbot_config: {
    isBgFade: true
  }
};

const chatbot: ChatBotElement = Rhinontech(config);
```

<br>

## Troubleshooting

### SSR/Next.js Issues

If you encounter `HTMLElement is not defined` or similar errors:

1. Ensure you're using dynamic imports with `ssr: false`
2. Wrap the initialization in `useEffect` or equivalent lifecycle method
3. Use the `'use client'` directive for Next.js App Router

### Chatbot Not Appearing

1. Verify your `app_id` is correct
2. Check browser console for errors
3. Ensure the SDK is initialized after DOM is loaded
4. Check if there are any CSP (Content Security Policy) restrictions

<br>

## Examples

Check out our [examples repository](https://github.com/rhinontech/botsdk-examples) for complete implementation examples in various frameworks.

<br>

## Support

For issues, questions, or contributions:

- 📧 Email: support@rhinontech.com
- 🐛 Issues: [GitHub Issues](https://github.com/rhinontech/botsdk/issues)
- 📚 Documentation: [docs.rhinontech.com](https://docs.rhinontech.com)

<br>

## License

MIT License - see [LICENSE](LICENSE) file for details

<br>

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

<br>

---

Made with ❤️ by [Rhinon Tech](https://rhinontech.com)

<!-- trigger release test -->