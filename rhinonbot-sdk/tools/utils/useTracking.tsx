import { useEffect, useRef } from 'react';
import Cookies from 'js-cookie';

const serverUrl = process.env.REACT_APP_NEW_SERVER_API_URL;
const socketUrl = process.env.REACT_APP_SOCKET_URL;

// Generate or retrieve session ID (per tab)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Generate or retrieve user ID (persistent across tabs)
const getUserId = () => {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
};

// Capture UTM query parameters
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
};

// Send event to backend
const sendToTrackingServer = (
  endpoint: string,
  payload: Record<string, any>,
) => {
  payload.sessionId = getSessionId();
  payload.userId = getUserId();
  payload.screenSize = `${window.innerWidth}x${window.innerHeight}`;
  payload.language = navigator.language;

  const url = `${serverUrl}${endpoint}`;
  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json',
  });

  if (!navigator.sendBeacon(url, blob)) {
    // Fallback
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.warn(`Tracking error for ${endpoint}:`, err);
    });
  }
};

const trackPageView = (appId: string) => {
  const referrer =
    sessionStorage.getItem('prevUrl') || document.referrer || 'direct';
  const url = window.location.href;
  sessionStorage.setItem('prevUrl', url);

  sendToTrackingServer('/seo/pageview', {
    chatbot_id: appId,
    url,
    referrer,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    ...getUTMParams(),
  });
};

const trackBaseUrl = (appId: string) => {
  const baseUrl = window.location.origin;
  sendToTrackingServer('/seo/complaint-url', {
    chatbot_id: appId,
    baseUrl,
    timestamp: Date.now(),
  });
};

import { io, Socket } from 'socket.io-client';

// Fetch Public IP
const getPublicIp = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.warn('Failed to fetch IP address:', err);
    return 'unknown';
  }
};

// Persistent visitor ID (stored in localStorage)
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('userId');
  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('userId', visitorId);
  }
  return visitorId;
};

export const connectToSocket = async (appId: string): Promise<Socket> => {
  const visitorId = getVisitorId();
  const userEmail = Cookies.get('userEmail') || null; // null if not exist
  const ipAddress = await getPublicIp();

  const socket: Socket = io(socketUrl, {
    query: {
      chatbot_id: appId,
      visitor_id: visitorId,
      ip_address: ipAddress,
      user_email: !userEmail ? 'New Customer' : userEmail, // will be null if cookie not set
      is_visitor: 'true',
    },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log(`[Socket] Connected as ${'visitor'} → ${visitorId}`);
  });

  socket.on('open_chat', ({ conversationId }) => {
    console.log('[Socket] Received open_chat event with ID:', conversationId);

    const openChatEvent = new CustomEvent('open_chat_from_server', {
      detail: { conversationId },
    });

    window.dispatchEvent(openChatEvent);
  });

  return socket;
};

const useTracking = (appId: string, enabled: boolean) => {
  console.log(`[useTracking] server : ${serverUrl}`);

  const hasTrackedRef = useRef(false);
  const pathname = window.location.pathname;

  useEffect(() => {
    if (!enabled) return; // Skip tracking if disabled
    let hasScrolled = false;
    let interactedWithChatbot = false;
    let interval: NodeJS.Timeout | null = null;
    let startTime = Date.now();

    const startTimer = () => {
      startTime = Date.now();
      interval = setInterval(() => {
        const timeSpent = Date.now() - startTime;
        sendToTrackingServer('/seo/timeOnPage', {
          chatbot_id: appId,
          url: window.location.href,
          timeSpent,
        });
        startTime = Date.now(); // reset timer
      }, 30000);
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const trackBounce = () => {
      const timeOnPage = Date.now() - startTime;
      sendToTrackingServer('/seo/bounce', {
        chatbot_id: appId,
        timeOnPage,
        interactedWithChatbot,
        url: window.location.href,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopTimer();
        trackBounce();
      } else if (document.visibilityState === 'visible') {
        startTimer(); // restart fresh
      }
    };

    const onBeforeUnload = () => {
      stopTimer();
      trackBounce();
    };

    const onScroll = () => {
      if (!hasScrolled && window.scrollY > 0) {
        hasScrolled = true;
        sendToTrackingServer('/seo/scroll', {
          chatbot_id: appId,
          scrollY: window.scrollY,
          timestamp: Date.now(),
        });
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.rhinon-chatbot-wrapper')) {
        interactedWithChatbot = true;
        sendToTrackingServer('/seo/click', {
          chatbot_id: appId,
          timestamp: Date.now(),
        });
      }
    };

    if (!hasTrackedRef.current) {
      trackPageView(appId);
      connectToSocket(appId);
      trackBaseUrl(appId);
      hasTrackedRef.current = true;
    }

    // Start timer if visible
    if (document.visibilityState === 'visible') {
      startTimer();
    }

    window.addEventListener('scroll', onScroll);
    document.addEventListener('click', onClick);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, appId]);
};

export default useTracking;
