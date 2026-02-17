"use strict";

const {
  seo_sessions,
  seo_page_views,
  seo_engagements,
  seo_compliances,
  seo_performances,
  chatbots,
} = require("../models");

const geoip = require("geoip-lite");

// Helper to extract client IP (with x-forwarded-for fallback)
const getClientIp = (req) => {
  const xfwd = req.headers["x-forwarded-for"];
  if (xfwd) {
    const ips = xfwd.split(",").map((ip) => ip.trim());
    return ips[0]; // First one is original client
  }

  const ip =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress;

  if (!ip) return "0.0.0.0";

  // Normalize IPv6 localhost
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";

  // Handle IPv6-mapped IPv4 (e.g., "::ffff:192.168.1.1")
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");

  return ip;
};

const getSeoAnalytics = async (req, res) => {
  const { chatbot_id } = req.query;
  if (!chatbot_id) return res.status(400).json({ error: "Missing chatbot_id" });

  const filterDevice = req.query.device || "all";
  const filterLocation = req.query.location || "all";
  const filterSource = req.query.source || "all";
  const filterDate = req.query.date || "30d";

  try {
    const [sessions, pageviews, engagements] = await Promise.all([
      seo_sessions.findAll({ where: { chatbot_id } }),
      seo_page_views.findAll({ where: { chatbot_id } }),
      seo_engagements.findAll({ where: { chatbot_id } }),
    ]);

    const now = new Date();
    let rangeDays = 7; // default to 7 days

    switch (filterDate) {
      case "30d":
        rangeDays = 30;
        break;
      case "90d":
        rangeDays = 90;
        break;
      case "1y":
        rangeDays = 365;
        break;
      case "7d":
      default:
        rangeDays = 7;
        break;
    }

    // current period
    const startCurrent = new Date(now);
    startCurrent.setDate(now.getDate() - rangeDays);

    // previous period
    const endPrev = new Date(startCurrent);
    endPrev.setDate(startCurrent.getDate() - 1);
    const startPrev = new Date(endPrev);
    startPrev.setDate(endPrev.getDate() - rangeDays + 1);

    const filterByDateRange = (items, start, end) =>
      items.filter(
        (i) => new Date(i.created_at) >= start && new Date(i.created_at) <= end
      );

    const sessionsCurrent = filterByDateRange(sessions, startCurrent, now);
    const sessionsPrev = filterByDateRange(sessions, startPrev, endPrev);
    const pvsCurrent = filterByDateRange(pageviews, startCurrent, now);
    const pvsPrev = filterByDateRange(pageviews, startPrev, endPrev);
    const engsCurrent = filterByDateRange(engagements, startCurrent, now);

    const getChange = (current, previous) =>
      previous === 0
        ? current > 0
          ? 100
          : 0
        : ((current - previous) / previous) * 100;

    const deviceTypes = {};
    const countries = {};
    const filteredSessions = sessions.filter((s) => {
      const ua = s.userAgent || "";
      const deviceType = /mobile/i.test(ua)
        ? "mobile"
        : /tablet/i.test(ua)
          ? "tablet"
          : "desktop";
      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;

      const country = s.country || "Unknown";
      countries[country] = (countries[country] || 0) + 1;

      const locMatch = filterLocation === "all" || s.country === filterLocation;
      const devMatch = filterDevice === "all" || deviceType === filterDevice;
      return locMatch && devMatch;
    });

    const sessionIds = new Set(filteredSessions.map((s) => s.sessionId));

    const trafficSources = {};
    const filteredPageviews = pageviews.filter((pv) => {
      const src = pv.utm_source || "direct";
      if (sessionIds.has(pv.sessionId)) {
        trafficSources[src] = (trafficSources[src] || 0) + 1;
      }
      return (
        sessionIds.has(pv.sessionId) &&
        (filterSource === "all" || src === filterSource)
      );
    });

    const filteredEngagements = engagements.filter((e) =>
      sessionIds.has(e.sessionId)
    );

    const uniqueVisitors = new Set(filteredSessions.map((s) => s.userId)).size;
    const totalSessions = filteredSessions.length;
    const totalPageViews = filteredPageviews.length;
    const pagesPerSession =
      totalSessions > 0 ? totalPageViews / totalSessions : 0;

    const timeEngs = filteredEngagements.filter((e) => e.type === "timeOnPage");
    const avgSessionDuration =
      timeEngs.length > 0
        ? timeEngs.reduce((sum, e) => sum + (e.metadata?.timeSpent || 0), 0) /
        timeEngs.length
        : 0;

    const pvBySess = filteredPageviews.reduce((acc, pv) => {
      if (!acc[pv.sessionId]) acc[pv.sessionId] = [];
      acc[pv.sessionId].push(pv);
      return acc;
    }, {});
    const timeOnP = new Set(
      timeEngs
        .filter((e) => (e.metadata?.timeSpent || 0) >= 8000)
        .map((e) => e.sessionId)
    );
    const bounceCount = Object.values(pvBySess).filter(
      (views) => views.length === 1 && !timeOnP.has(views[0].sessionId)
    ).length;
    const bounceRate =
      totalSessions > 0 ? (bounceCount / totalSessions) * 100 : 0;

    const visitorCount = {};
    for (const session of filteredSessions) {
      visitorCount[session.userId] = (visitorCount[session.userId] || 0) + 1;
    }
    const returningVisitors =
      uniqueVisitors > 0
        ? (Object.values(visitorCount).filter((v) => v > 1).length /
          uniqueVisitors) *
        100
        : 0;

    const getPrevMetrics = () => {
      const uniqueVisitorsPrev = new Set(sessionsPrev.map((s) => s.userId))
        .size;
      const totalSessionsPrev = sessionsPrev.length;
      const totalPageViewsPrev = pvsPrev.length;
      const pagesPerSessionPrev =
        totalSessionsPrev > 0 ? totalPageViewsPrev / totalSessionsPrev : 0;

      const timeEngsPrev = engagements.filter(
        (e) =>
          sessionIds.has(e.sessionId) &&
          new Date(e.createdAt) >= startPrev &&
          new Date(e.createdAt) <= endPrev &&
          e.type === "timeOnPage"
      );
      const avgSessionDurationPrev =
        timeEngsPrev.length > 0
          ? timeEngsPrev.reduce(
            (sum, e) => sum + (e.metadata?.timeSpent || 0),
            0
          ) / timeEngsPrev.length
          : 0;

      const pvBySessPrev = pvsPrev.reduce((acc, pv) => {
        if (!acc[pv.sessionId]) acc[pv.sessionId] = [];
        acc[pv.sessionId].push(pv);
        return acc;
      }, {});
      const timeOnPPrev = new Set(
        timeEngsPrev
          .filter((e) => (e.metadata?.timeSpent || 0) >= 8000)
          .map((e) => e.sessionId)
      );
      const bounceCountPrev = Object.values(pvBySessPrev).filter(
        (views) => views.length === 1 && !timeOnPPrev.has(views[0].sessionId)
      ).length;
      const bounceRatePrev =
        totalSessionsPrev > 0 ? (bounceCountPrev / totalSessionsPrev) * 100 : 0;

      const visitorCountPrev = {};
      for (const session of sessionsPrev) {
        visitorCountPrev[session.userId] =
          (visitorCountPrev[session.userId] || 0) + 1;
      }
      const returningVisitorsPrev =
        uniqueVisitorsPrev > 0
          ? (Object.values(visitorCountPrev).filter((v) => v > 1).length /
            uniqueVisitorsPrev) *
          100
          : 0;

      return {
        uniqueVisitorsPrev,
        pageViewsPrev: totalPageViewsPrev,
        sessionsPrev: totalSessionsPrev,
        pagesPerSessionPrev,
        avgSessionDurationPrev,
        bounceRatePrev,
        returningVisitorsPrev,
      };
    };

    const prevMetrics = getPrevMetrics();

    const trend = {
      uniqueVisitorsChange: Number(
        getChange(uniqueVisitors, prevMetrics.uniqueVisitorsPrev).toFixed(2)
      ),
      pageViewsChange: Number(
        getChange(totalPageViews, prevMetrics.pageViewsPrev).toFixed(2)
      ),
      sessionsChange: Number(
        getChange(totalSessions, prevMetrics.sessionsPrev).toFixed(2)
      ),
      bounceRateChange: Number(
        getChange(bounceRate, prevMetrics.bounceRatePrev).toFixed(2)
      ),
      avgSessionDurationChange: Number(
        getChange(
          avgSessionDuration,
          prevMetrics.avgSessionDurationPrev
        ).toFixed(2)
      ),
      pagesPerSessionChange: Number(
        getChange(pagesPerSession, prevMetrics.pagesPerSessionPrev).toFixed(2)
      ),
      returningVisitorsChange: Number(
        getChange(returningVisitors, prevMetrics.returningVisitorsPrev).toFixed(
          2
        )
      ),
    };

    const weeklyTraffic = Array(7)
      .fill(0)
      .map((_, idx) => {
        const date = new Date();
        date.setDate(now.getDate() - 6 + idx);
        const label = date.toLocaleDateString("en-US", { weekday: "short" });
        const count = sessionsCurrent.filter(
          (s) => new Date(s.created_at).getDay() === date.getDay()
        ).length;
        return { day: label, visitors: count };
      });

    const dailyTraffic = Array(7)
      .fill(0)
      .map((_, idx) => {
        const date = new Date();
        date.setDate(now.getDate() - 6 + idx);
        const dayStr = date.toISOString().split("T")[0];
        const count = sessionsCurrent.filter((s) => {
          const created = new Date(s.created_at);
          return created.toISOString().split("T")[0] === dayStr;
        }).length;
        return { date: dayStr, visitors: count };
      });
    // Top Pages Fix
    const pageStats = {};
    filteredPageviews.forEach((pv) => {
      if (!pv.url) return;
      const ps = (pageStats[pv.url] = pageStats[pv.url] || {
        views: 0,
        totalTime: 0,
        bounces: 0,
      });
      ps.views++;
    });

    timeEngs.forEach((e) => {
      const url = e.url || e.metadata?.page;
      if (!url) return;
      const ps = (pageStats[url] = pageStats[url] || {
        views: 0,
        totalTime: 0,
        bounces: 0,
      });
      ps.totalTime += e.metadata?.timeSpent || 0;
    });

    for (const [sid, pvs] of Object.entries(pvBySess)) {
      if (pvs.length === 1 && !timeOnP.has(sid)) {
        const url = pvs[0].url;
        if (url && pageStats[url]) pageStats[url].bounces++;
      }
    }

    const topPages = Object.entries(pageStats)
      .map(([page, stat]) => ({
        page,
        views: stat.views,
        avgTime: stat.views ? stat.totalTime / stat.views : 0,
        bounceRate: stat.views ? (stat.bounces / stat.views) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views);

    return res.json({
      uniqueVisitors,
      totalPageViews,
      totalSessions,
      bounceRate: Number(bounceRate.toFixed(2)),
      avgSessionDuration: Number(avgSessionDuration.toFixed(2)),
      returningVisitors: Number(returningVisitors.toFixed(2)),
      pagesPerSession: Number(pagesPerSession.toFixed(2)),
      trafficSources,
      deviceTypes,
      countries,
      topPages,
      dailyTraffic,
      trend,
    });
  } catch (error) {
    console.error("SEO Analytics Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

const upsertSession = async (data, ip) => {
  if (!data.sessionId || !data.chatbot_id || !data.userId) return;

  const existing = await seo_sessions.findOne({
    where: { userId: data.userId },
  });

  const geo = geoip.lookup(ip);
  const country = geo?.country || "Unknown";

  await seo_sessions.upsert({
    sessionId: data.sessionId,
    chatbot_id: data.chatbot_id,
    userId: data.userId,
    screenSize: data.screenSize,
    language: data.language,
    userAgent: data.userAgent,
    country,
    isReturning: !!existing,
  });
};

// Tracking Endpoints
const trackPageView = async (req, res) => {
  try {
    const ip = getClientIp(req);
    await upsertSession(req.body, ip);

    await seo_page_views.create({ ...req.body, timestamp: Date.now() });
    res.status(201).json({ message: "Pageview tracked" });
  } catch (err) {
    console.error("Pageview Error:", err);
    res.status(500).json({ error: "Failed to track pageview" });
  }
};

const trackScroll = async (req, res) => {
  try {
    const ip = getClientIp(req);
    await upsertSession(req.body, ip);
    await seo_engagements.create({
      ...req.body,
      type: "scroll",
      timestamp: Date.now(),
    });
    res.status(201).json({ message: "Scroll event tracked" });
  } catch (err) {
    console.error("Scroll Error:", err);
    res.status(500).json({ error: "Failed to track scroll" });
  }
};

const trackClick = async (req, res) => {
  try {
    const ip = getClientIp(req);
    await upsertSession(req.body, ip);
    await seo_engagements.create({
      ...req.body,
      type: "click",
      timestamp: Date.now(),
    });
    res.status(201).json({ message: "Click tracked" });
  } catch (err) {
    console.error("Click Error:", err);
    res.status(500).json({ error: "Failed to track click" });
  }
};

const trackBounce = async (req, res) => {
  try {
    const ip = getClientIp(req);
    await upsertSession(req.body, ip);

    const { timeOnPage, interactedWithChatbot } = req.body;
    await seo_engagements.create({
      ...req.body,
      type: "bounce",
      metadata: { timeOnPage, interactedWithChatbot },
      timestamp: Date.now(),
    });
    res.status(201).json({ message: "Bounce tracked" });
  } catch (err) {
    console.error("Bounce Error:", err);
    res.status(500).json({ error: "Failed to track bounce" });
  }
};

const trackTimeOnPage = async (req, res) => {
  try {
    const ip = getClientIp(req);
    await upsertSession(req.body, ip);

    const { timeSpent } = req.body;
    await seo_engagements.create({
      ...req.body,
      type: "timeOnPage",
      metadata: { timeSpent },
      timestamp: Date.now(),
    });
    res.status(201).json({ message: "Time on page tracked" });
  } catch (err) {
    console.error("TimeOnPage Error:", err);
    res.status(500).json({ error: "Failed to track time on page" });
  }
};

// Compliance + Performance Check
const complaintUrl = async (req, res) => {
  try {
    const { chatbot_id, baseUrl } = req.body;

    if (!chatbot_id || !baseUrl)
      return res.status(400).json({ message: "Missing chatbot_id or baseUrl" });

    // Normalize URL
    let origin;
    try {
      origin = new URL(baseUrl).origin;
    } catch (e) {
      return res.status(400).json({ message: "Invalid baseUrl format" });
    }

    // Prevent saving localhost or IP-based URLs
    const hostname = new URL(origin).hostname;

    const isLocalOrIp =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(hostname) || // any IPv4
      hostname.startsWith("192.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.");

    if (isLocalOrIp) {
      return res.status(400).json({
        message: "Localhost or IP-based URLs are not allowed",
      });
    }

    // Check chatbot_id exists
    const chatbot = await chatbots.findOne({ where: { chatbot_id } });

    if (!chatbot) {
      return res.status(404).json({
        message: "Invalid chatbot_id. Chatbot not found.",
      });
    }

    // Find existing Compliance + Performance
    let compliance = await seo_compliances.findOne({
      where: { chatbot_id, baseUrl: origin },
    });

    let performance = await seo_performances.findOne({
      where: { chatbot_id, baseUrl: origin },
    });

    // If exist → Update baseUrl (optional)
    if (compliance) {
      await compliance.update({ baseUrl: origin });
    } else {
      compliance = await seo_compliances.create({
        chatbot_id,
        baseUrl: origin,
        seoScore: null,
        passedChecks: 0,
        totalChecks: 0,
        categories: [],
        actionItems: [],
      });
    }

    if (performance) {
      await performance.update({ baseUrl: origin });
    } else {
      performance = await seo_performances.create({
        chatbot_id,
        baseUrl: origin,
        overallScore: {},
        metrics: {},
        accessibility: {},
        bestPractices: {},
        seo: {},
        opportunities: [],
        diagnostics: [],
        recommendations: [],
      });
    }

    return res.status(200).json({
      message: "Compliance & Performance created or updated successfully",
      data: { compliance, performance },
    });
  } catch (error) {
    console.error("SeoCompliance Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSeoAnalytics,
  trackPageView,
  trackScroll,
  trackClick,
  trackBounce,
  trackTimeOnPage,
  complaintUrl,
};
