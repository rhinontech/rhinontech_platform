// seoCompliance.js
const puppeteer = require("puppeteer");
const { seo_compliances, subscriptions, chatbots } = require("../models");
const { logActivity } = require("../utils/activityLogger");

// NOTE: adjust these if you want different thresholds or UA strings
const HEADLESS_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function buildSeoSummary(audits) {
  const checks = {
    "Meta Tags": [
      {
        title: "Meta Title Present",
        passed: audits.every((a) => a.title?.length > 0),
        description: (r) =>
          r ? "Title tag is present." : "Missing <title> tag.",
        fix: "Add a <title> tag to each page.",
      },
      {
        title: "Meta Title Length",
        passed: audits.every(
          (a) => a.title?.length >= 10 && a.title.length <= 70
        ),
        description: (r) =>
          r ? "Title length is valid." : "Title should be 10–70 characters.",
        fix: "Adjust the <title> to be 10–70 characters long.",
      },
      {
        title: "Meta Description Present",
        passed: audits.every((a) => a.description?.length > 0),
        description: (r) =>
          r ? "Meta description is present." : "Missing meta description.",
        fix: "Add a meta description to each page.",
      },
      {
        title: "Meta Description Length",
        passed: audits.every(
          (a) => a.description?.length >= 50 && a.description.length <= 160
        ),
        description: (r) =>
          r
            ? "Description length is valid."
            : "Meta description should be 50–160 characters.",
        fix: "Adjust meta descriptions to be between 50–160 characters long.",
      },
    ],
    "Content Structure": [
      {
        title: "H1 Tags",
        passed: audits.every((a) => a.h1Count === 1),
        description: (r) =>
          r
            ? "Exactly one <h1> tag found."
            : "Page must have exactly one <h1> tag.",
        fix: "Ensure each page has one <h1> tag.",
      },
      {
        title: "Content Length",
        passed: audits.every((a) => a.wordCount >= 300),
        description: (r) =>
          r
            ? "Content is sufficient."
            : "Content is too short (less than 300 words).",
        fix: "Ensure each page has at least 300 words.",
      },
      {
        title: "Internal Linking",
        passed: audits.every((a) => a.internalLinksCount >= 3),
        description: (r) =>
          r ? "Sufficient internal links found." : "Too few internal links.",
        fix: "Add at least 3 internal links per page to related content.",
      },
    ],
    "Technical SEO": [
      {
        title: "Canonical Tags",
        passed: audits.every((a) => !!a.canonical),
        description: (r) =>
          r ? "Canonical tag present." : "Missing canonical tag.",
        fix: "Add <link rel='canonical'> to each page.",
      },
      {
        title: "Viewport Meta Tag",
        passed: audits.every((a) => a.hasViewport),
        description: (r) =>
          r ? "Viewport tag present." : "Missing viewport meta tag.",
        fix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>.",
      },
      {
        title: "Robots.txt Found",
        passed: audits.every((a) => a.robotsTxtFound),
        description: (r) =>
          r ? "robots.txt file exists." : "robots.txt missing.",
        fix: "Ensure robots.txt is accessible at /robots.txt.",
      },
      {
        title: "Sitemap Found",
        passed: audits.every((a) => a.sitemapFound),
        description: (r) => (r ? "Sitemap found." : "Sitemap not found."),
        fix: "Add sitemap.xml and reference it in robots.txt.",
      },
      {
        title: "Schema Markup Present",
        passed: audits.every((a) => a.hasSchema),
        description: (r) =>
          r ? "Structured data (JSON-LD) detected." : "No schema markup found.",
        fix: "Add JSON-LD or Microdata to describe the content structure.",
      },
    ],
    "Images & Media": [
      {
        title: "Alt Text",
        passed: audits.every((a) => a.imagesMissingAlt === 0),
        description: (r) =>
          r ? "All images have alt text." : "Some images are missing alt text.",
        fix: "Add descriptive alt text to all <img> tags.",
      },
      {
        title: "Image Optimization",
        passed: audits.every((a) => a.largeImages.length === 0),
        description: (r) =>
          r
            ? "No unoptimized images found."
            : "Some images are larger than 200KB.",
        fix: "Compress and resize large images.",
      },
      {
        title: "Image Formats",
        passed: audits.every((a) => a.usesModernFormat),
        description: (r) =>
          r
            ? "Modern image formats used."
            : "Some images are not in WebP or AVIF.",
        fix: "Use modern formats like WebP or AVIF.",
      },
    ],
  };

  let passed = 0;
  let total = 0;
  const categories = [];
  const actionItems = [];

  for (const [cat, list] of Object.entries(checks)) {
    const categoryChecks = list.map((check) => {
      total++;
      const isPassed = check.passed;
      if (isPassed) passed++;
      if (!isPassed) {
        actionItems.push({
          label: check.title,
          fix: check.fix,
          priority: cat === "Technical SEO" ? "High" : "Medium",
        });
      }
      return {
        title: check.title,
        status: isPassed ? "Good" : "Needs Fix",
        description: check.description(isPassed),
        fix: !isPassed ? check.fix : undefined,
      };
    });

    categories.push({ category: cat, checks: categoryChecks });
  }

  return {
    seoScore: `${Math.round((passed / total) * 100)}%`,
    passedChecks: passed,
    totalChecks: total,
    categories,
    actionItems,
  };
}

// Helper: open page and apply anti-detection patches
async function preparePageForRealBrowser(page) {
  // set a realistic UA
  await page.setUserAgent(HEADLESS_USER_AGENT);

  // some extra headers to mimic a real browser
  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": '"Chromium";v="120", "Not=A?Brand";v="24"',
    "sec-ch-ua-platform": '"Windows"',
    "sec-ch-ua-mobile": "?0",
  });

  // patch navigator + webdriver + plugins + languages to avoid common bot checks
  await page.evaluateOnNewDocument(() => {
    // navigator.webdriver
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
      configurable: true,
    });

    // languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
      configurable: true,
    });

    // plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
      configurable: true,
    });

    // permissions query shim
    const originalQuery = window.navigator.permissions.query;
    try {
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(parameters);
    } catch (e) {
      // ignore
    }

    // chrome runtime mimic
    window.chrome = window.chrome || { runtime: {} };

    // fake webdriver property for iframes
    Object.defineProperty(window, "callPhantom", {
      get: () => undefined,
      configurable: true,
    });
  });
}

async function getRenderedHtmlAndLinks(baseUrl, browser) {
  const page = await browser.newPage();
  try {
    await preparePageForRealBrowser(page);

    // block heavy resources to speed up
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const blocked = ["image", "stylesheet", "font"];
      if (blocked.includes(req.resourceType())) req.abort();
      else req.continue();
    });

    await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 120000 });

    // Wait for at least one navigational link to appear (hydration)
    await page
      .waitForFunction(() => document.querySelectorAll("a[href]").length > 0, {
        timeout: 7000,
      })
      .catch(() => { });

    const links = await page.evaluate((base) => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((a) => a.href.trim())
        .filter((href) => href.startsWith(base) && !href.includes("#"))
        .filter((href, index, self) => self.indexOf(href) === index);
    }, baseUrl);

    return links;
  } finally {
    await page.close();
  }
}

async function analyzePageSEO(url, browser) {
  const page = await browser.newPage();

  // apply anti-detection patches to each page
  try {
    await preparePageForRealBrowser(page);

    await page.setRequestInterception(false);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Wait until at least one of these metadata indications is present (hydation)
    await page
      .waitForFunction(
        () => {
          const hasTitle = !!document.title && document.title.trim().length > 0;
          const hasDescription = !!document.querySelector(
            'meta[name="description"]'
          );
          const hasCanonical = !!document.querySelector(
            'link[rel="canonical"]'
          );
          return hasTitle || hasDescription || hasCanonical;
        },
        { timeout: 7000 }
      )
      .catch(() => { });

    // additional safety: wait for links to appear or short timeout
    await page
      .waitForFunction(() => document.querySelectorAll("a[href]").length > 0, {
        timeout: 4000,
      })
      .catch(() => { });

    // Evaluate the DOM for SEO checks
    const result = await page.evaluate(() => {
      const getMeta = (name) =>
        document.querySelector(`meta[name="${name}"]`)?.content || "";
      const getCanonical = () =>
        document.querySelector("link[rel='canonical']")?.href || "";

      const images = Array.from(document.querySelectorAll("img"));
      const imagesMissingAlt = images.filter(
        (img) => !img.alt || img.alt.trim() === ""
      ).length;

      // largeImages detection by filename (conservative)
      const largeImages = images
        .map((img) => img.src)
        .filter((src) => src && src.match(/\.(jpg|jpeg|png)$/i));

      // Modern format detection (webp, avif, or data URI). Evaluate percentage threshold.
      const totalImages = images.length;
      const modernCount = images.filter((img) => {
        if (!img.src) return false;
        const src = img.src.split("?")[0];
        if (src.startsWith("data:image/")) return true;
        return /\.(webp|avif)$/i.test(src);
      }).length;
      const usesModernFormat =
        totalImages === 0 ? true : modernCount / totalImages >= 0.8;

      return {
        title: document.title || "",
        description: getMeta("description"),
        canonical: getCanonical(),
        h1Count: document.querySelectorAll("h1").length,
        wordCount:
          document.body?.innerText?.split(/\s+/).filter(Boolean).length || 0,
        internalLinksCount: Array.from(
          document.querySelectorAll("a[href]")
        ).filter((a) => a.href.startsWith(location.origin)).length,
        hasViewport: !!document.querySelector("meta[name='viewport']"),
        hasSchema: !!document.querySelector(
          'script[type="application/ld+json"]'
        ),
        imagesMissingAlt,
        largeImages,
        usesModernFormat,
      };
    });

    // robots.txt and sitemap checks via same-origin fetch (works with relative paths)
    const robotsResponse = await page.evaluate(async () => {
      try {
        const res = await fetch("/robots.txt", { method: "GET" });
        return res.status;
      } catch (e) {
        return null;
      }
    });
    result.robotsTxtFound = robotsResponse === 200;

    const sitemapResponse = await page.evaluate(async () => {
      try {
        const res = await fetch("/sitemap.xml", { method: "GET" });
        return res.status;
      } catch (e) {
        return null;
      }
    });
    result.sitemapFound = sitemapResponse === 200;

    console.log(`API compliance audit completed for ${url}`);
    return { ...result, url };
  } finally {
    await page.close();
  }
}

const PLAN_SEO_LIMITS = {
  Trial: 1,
  Free: 1,
  Starter: 1,
  Growth: 2,
  Scale: 4,
};

const triggerSeoCompliance = async (req, res) => {
  const { chatbot_id } = req.body;
  const io = req.app.get("io");

  try {
    const existing = await seo_compliances.findOne({ where: { chatbot_id } });
    const chatbot = await chatbots.findOne({ where: { chatbot_id } });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    const organization_id = chatbot.organization_id;
    const subscription = await subscriptions.findOne({
      where: { organization_id },
    });

    if (!existing || !existing.baseUrl) {
      return res.status(400).json({
        message: "Base URL not configured. Please install via chatbot-sdk.",
      });
    }

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const tier = subscription.subscription_tier || "Trial";
    const weeklyLimit = PLAN_SEO_LIMITS[tier] || 1;

    const now = new Date();
    const lastAudit = existing?.updated_at
      ? new Date(existing.updated_at)
      : null;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    if (lastAudit && lastAudit < oneWeekAgo) {
      await subscription.update({ seo_compliance_trigger_count: 0 });
    }

    await subscription.reload();

    if (subscription.seo_compliance_trigger_count >= weeklyLimit) {
      const message = `Weekly SEO compliance limit reached (${weeklyLimit}/week for ${tier} plan).`;
      io.emit(`seo:compliance:error:${organization_id}`, {
        organization_id,
        message,
      });
      return res.status(429).json({ message });
    }

    res.json({ message: "SEO compliance audit started." });
    console.log(`SEO compliance audit started for org ${organization_id}...`);

    (async () => {
      const { default: pLimit } = await import("p-limit");
      const baseUrl = existing.baseUrl;
      const limit = pLimit(1); // keep serial scanning; increase to 3 if you want faster parallel scans
      let browser;

      try {
        browser = await puppeteer.launch({
          headless: "new",
          executablePath: "/usr/bin/chromium-browser",
          dumpio: true,
          protocolTimeout: 120000,
          pipe: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--disable-accelerated-2d-canvas",
            "--no-zygote",
            "--mute-audio",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-blink-features=AutomationControlled",
          ],
        });

        const links = await getRenderedHtmlAndLinks(baseUrl, browser);
        console.log(links);
        io.emit(`seo:compliance:started:${organization_id}`, {
          message: "Compliance audit started",
          organization_id,
          started_at: Date.now(),
          estimated_time: links.length * 25,
        });

        const audits = (
          await Promise.all(
            links.map((link) =>
              limit(() =>
                analyzePageSEO(link, browser).catch((err) => {
                  console.error(`Audit failed for ${link}:`, err.message);
                  return null;
                })
              )
            )
          )
        ).filter(Boolean);

        if (!audits.length) {
          io.emit(`seo:compliance:error:${organization_id}`, {
            message: "Compliance audit failed. No successful results.",
            organization_id,
          });
          return;
        }

        const summary = buildSeoSummary(audits);
        await existing.update({ ...summary, updated_at: new Date() });

        await subscription.update({
          seo_compliance_trigger_count:
            (subscription.seo_compliance_trigger_count || 0) + 1,
        });

        console.log("SEO compliance audit completed.");
        io.emit(`seo:compliance:completed:${organization_id}`, {
          message: "SEO compliance audit completed.",
          organization_id,
          data: existing,
        });
      } catch (err) {
        console.error("SEO compliance error:", err.message);
        io.emit(`seo:compliance:error:${organization_id}`, {
          message: "SEO compliance audit failed.",
          organization_id,
          error: err.message,
        });
      } finally {
        if (browser) await browser.close();
      }
    })();
  } catch (err) {
    console.error("Trigger Compliance Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSeoCompliance = async (req, res) => {
  const { chatbot_id } = req.query;
  if (!chatbot_id) {
    return res.status(400).json({ message: "chatbot_id is required" });
  }

  try {
    const audit = await seo_compliances.findOne({ where: { chatbot_id } });
    if (!audit) return res.status(404).json({ message: "No audit found." });
    res.json({ message: "Audit retrieved", data: audit });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching audit", error: err.message });
  }
};

module.exports = { triggerSeoCompliance, getSeoCompliance };
