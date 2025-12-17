const { seo_performances, subscriptions, chatbots } = require("../models");
const puppeteer = require("puppeteer");
require("dotenv").config();
const { logActivity } = require("../utils/activityLogger");

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

async function getRenderedHtmlAndLinks(baseUrl, browser) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
    );

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const blocked = ["image", "stylesheet", "font"];
      blocked.includes(req.resourceType()) ? req.abort() : req.continue();
    });

    await page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

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

async function callExternalAuditAPI(url) {
  try {
    // const API_KEY = process.env.PAGESPEED_API_KEY;
    const API_KEY = "AIzaSyCn9zdWpfkeTkfLl0z9_ip9xeSRl5Tho8Y";
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&category=performance&category=accessibility&category=seo&category=best-practices&key=${API_KEY}`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`Failed: ${res.status} - ${res.statusText}`);
    }

    const json = await res.json();
    const { lighthouseResult } = json;
    const audits = lighthouseResult.audits;
    const categories = lighthouseResult.categories;

    const opportunities = Object.values(audits)
      .filter((audit) => audit.details?.type === "opportunity")
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        estimatedSavings: `${(audit.details.overallSavingsMs / 1000).toFixed(
          1
        )}s`,
        impact: "High",
        effort: "Medium",
        priority: "High",
      }));

    const diagnostics = Object.values(audits)
      .filter((audit) => audit.scoreDisplayMode === "informative")
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        impact: "Informational",
        effort: "Low",
        priority: "Medium",
      }));

    const recommendations = Object.values(audits)
      .filter(
        (audit) =>
          audit.score !== null &&
          audit.score < 1 &&
          audit.scoreDisplayMode === "numeric"
      )
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        impact: audit.title.includes("JavaScript")
          ? "Could improve TTI"
          : "May enhance performance",
        effort: "Medium",
        priority: "Medium",
        details: audit.details?.items
          ? `${audit.details.items.length} issues found`
          : "Some issues found",
      }));
    console.log(`API performance audit completed for ${url}`);
    return {
      url,
      overallScore: {
        performance: Math.round(categories.performance?.score * 100 || 0),
        accessibility: Math.round(categories.accessibility?.score * 100 || 0),
        bestPractices: Math.round(
          categories["best-practices"]?.score * 100 || 0
        ),
        seo: Math.round(categories.seo?.score * 100 || 0),
      },
      metrics: {
        fcp: audits["first-contentful-paint"]?.displayValue || "0s",
        lcp: audits["largest-contentful-paint"]?.displayValue || "0s",
        tti: audits["interactive"]?.displayValue || "0s",
        speedIndex: audits["speed-index"]?.displayValue || "0s",
        blockingTime: audits["total-blocking-time"]?.displayValue || "0ms",
        cls: audits["cumulative-layout-shift"]?.displayValue || "0",
      },
      opportunities,
      diagnostics,
      recommendations,
    };
  } catch (err) {
    console.warn(`Audit failed for ${url}: ${err.message}`);
    return null;
  }
}

function summarizeAudits(audits) {
  const averageMetric = (key) =>
    average(
      audits.map(
        (a) => parseFloat((a.metrics?.[key] || "").replace(/[^\d.]/g, "")) || 0
      )
    );

  return {
    overallScore: {
      performance: average(audits.map((a) => a.overallScore.performance)),
      accessibility: average(audits.map((a) => a.overallScore.accessibility)),
      bestPractices: average(audits.map((a) => a.overallScore.bestPractices)),
      seo: average(audits.map((a) => a.overallScore.seo)),
    },
    metrics: {
      fcp: `${averageMetric("fcp")}s`,
      lcp: `${averageMetric("lcp")}s`,
      speedIndex: `${averageMetric("speedIndex")}s`,
      tti: `${averageMetric("tti")}s`,
      blockingTime: `${averageMetric("blockingTime")}ms`,
      cls: `${averageMetric("cls")}`,
    },
    accessibility: {
      colorContrast: audits.every(
        (a) => a.accessibility?.colorContrast === "Pass"
      )
        ? "Pass"
        : "Fail",
      altText: `${
        average(audits.map((a) => parseInt(a.accessibility?.altText || "0"))) ||
        "N/A"
      }%`,
      keyboard: audits.every((a) => a.accessibility?.keyboard === "Pass")
        ? "Pass"
        : "Fail",
      screenReader: audits.every(
        (a) => a.accessibility?.screenReader === "Pass"
      )
        ? "Pass"
        : "Fail",
      focusIndicators: audits.every(
        (a) => a.accessibility?.focusIndicators === "Pass"
      )
        ? "Pass"
        : "Fail",
    },
    bestPractices: {
      https: audits.every((a) => a.bestPractices?.https === "Pass")
        ? "Pass"
        : "Fail",
      deprecatedAPIs: audits.reduce(
        (sum, a) => sum + (a.bestPractices?.deprecatedAPIs || 0),
        0
      ),
      consoleErrors: audits.reduce(
        (sum, a) => sum + (a.bestPractices?.consoleErrors || 0),
        0
      ),
    },
    seo: {
      metaDescription: audits.every((a) => a.seo?.metaDescription === "Pass")
        ? "Pass"
        : "Fail",
      titleTag: audits.every((a) => a.seo?.titleTag === "Pass")
        ? "Pass"
        : "Fail",
      structuredData: audits.every((a) => a.seo?.structuredData === "Pass")
        ? "Pass"
        : "Fail",
      crawlableLinks: audits.every((a) => a.seo?.crawlableLinks === "Pass")
        ? "Pass"
        : "Fail",
      mobileFriendly: audits.every((a) => a.seo?.mobileFriendly === "Pass")
        ? "Pass"
        : "Fail",
    },
    recommendations: Array.from(
      new Map(
        audits
          .flatMap((a) => a.recommendations || [])
          .map((item) => [item.title, item])
      ).values()
    ),
    opportunities: Array.from(
      new Map(
        audits
          .flatMap((a) => a.opportunities || [])
          .map((item) => [item.title, item])
      ).values()
    ),
    diagnostics: Array.from(
      new Map(
        audits
          .flatMap((a) => a.diagnostics || [])
          .map((item) => [item.title, item])
      ).values()
    ),
  };
}

const PLAN_SEO_LIMITS = {
  Trial: 1,
  Free: 1,
  Starter: 1,
  Growth: 2,
  Scale: 4,
};

const triggerPerformance = async (req, res) => {
  const { chatbot_id } = req.body;
  const io = req.app.get("io");

  try {
    const existing = await seo_performances.findOne({ where: { chatbot_id } });
    const chatbot = await chatbots.findOne({ where: { chatbot_id } });

    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    const organization_id = chatbot.organization_id;
    const subscription = await subscriptions.findOne({
      where: { organization_id },
    });

    if (!existing || !existing.baseUrl)
      return res
        .status(400)
        .json({ message: "Base URL not configured for this chatbot." });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    // check limits
    const tier = subscription.subscription_tier || "Trial";
    const weeklyLimit = PLAN_SEO_LIMITS[tier] || 1;
    const now = new Date();
    const lastAudit = existing.updated_at;
    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));

    // Reset count if last audit was more than a week ago
    if (lastAudit && lastAudit < oneWeekAgo) {
      await subscription.update({ seo_performance_trigger_count: 0 });
    }

    await subscription.reload();

    if (subscription.seo_performance_trigger_count >= weeklyLimit) {
      const message = `Weekly SEO performance limit reached (${weeklyLimit}/week for ${tier} plan).`;
      io.emit(`seo:performance:error:${organization_id}`, {
        organization_id,
        message,
      });
      return res.status(429).json({ message });
    }

    // Within limit → start audit
    res.json({ message: "SEO performance audit started." });
    console.log(`API performance audit started for org ${organization_id}...`);

    // Run audit asynchronously
    (async () => {
      const { default: pLimit } = await import("p-limit");
      const baseUrl = existing.baseUrl;
      const limit = pLimit(1);
      let browser;

      try {
        browser = await puppeteer.launch({
          headless: "new",
          args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
          defaultViewport: null,
        });

        const pageUrls = await getRenderedHtmlAndLinks(baseUrl, browser);
        console.log(pageUrls);

        const started_at = Date.now();
        const estimated_time = pageUrls.length * 30;

        io.emit(`seo:performance:started:${organization_id}`, {
          message: "Performance audit started",
          organization_id,
          started_at,
          estimated_time,
        });

        const auditResults = (
          await Promise.all(
            pageUrls.map((url) =>
              limit(() =>
                callExternalAuditAPI(url).catch((err) => {
                  console.warn(`Audit failed for ${url}:`, err.message);
                  return null;
                })
              )
            )
          )
        ).filter(Boolean);

        if (!auditResults.length) {
          io.emit(`seo:performance:error:${organization_id}`, {
            organization_id,
            message: "Performance audit failed. No successful results.",
          });
          return;
        }

        const summary = summarizeAudits(auditResults);
        await existing.update({ ...summary, updated_at: new Date() });
        await existing.save();

        await subscription.update({
          seo_performance_trigger_count:
            (subscription.seo_performance_trigger_count || 0) + 1,
        });

        // logActivity(
        //   req.user?.id || null,
        //   organization_id,
        //   "SEO",
        //   "New SEO performance audit created"
        // );

        console.log("SEO performance audit completed.");
        io.emit(`seo:performance:completed:${organization_id}`, {
          message: "SEO performance audit completed.",
          organization_id,
          data: existing,
        });
      } catch (err) {
        console.error("Performance audit failed:", err.message);
        io.emit(`seo:performance:error:${organization_id}`, {
          message: "SEO performance audit failed.",
          organization_id,
          error: err.message,
        });
      } finally {
        if (browser) await browser.close();
      }
    })();
  } catch (err) {
    console.error("Trigger Performance Error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSeoPerformance = async (req, res) => {
  const { chatbot_id } = req.query;

  if (!chatbot_id) {
    return res.status(400).json({ message: "chatbot_id is required" });
  }

  try {
    const audit = await seo_performances.findOne({ where: { chatbot_id } });

    if (!audit) {
      return res.status(404).json({ message: "No performance audit found." });
    }

    res.json({ message: "Performance audit retrieved", data: audit });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching performance audit",
      error: err.message,
    });
  }
};

module.exports = { triggerPerformance, getSeoPerformance };
