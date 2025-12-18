import React, { useEffect, useState, useRef } from 'react';
import {
  MessageCircle,
  X,
  Home,
  MessageSquare,
  HelpCircle,
  Mic,
  Newspaper,
  Minus,
} from 'lucide-react';
import './Messenger.scss';
import ChatScreen from './ChatScreen/ChatScreen';
import ChatHistoryScreen from './ChatHistoryScreen/ChatHistoryScreen';
import HelpScreen from './HelpScreen/HelpScreen';
import HomeScreen from './HomeScreen/HomeScreen';
import Voice from './Voice/Voice';
import NewsScreen from './NewsScreen/NewsScreen';
import NewsPage from './NewsPage/NewsPage';
import HelpAriclePage from './HelpArticlePage/HelpArticlePage';
import RaiseTicket from './TicketScreen/RaiseTicket';
import { Campaigns } from './Campaigns/Campaigns';
import { AnimatePresence, motion } from 'motion/react';
import Cookies from 'js-cookie';

// New imports from restructured modules
import type { 
  Campaign, 
  Folder, 
  Article, 
  PostChatFormConfig,
  RhinontechConfig 
} from '@/types';
import { useConfigStore } from '@/store';
import { getChatbotConfig, getForms } from '@/services/config';
import { getCampaignsChatbot, trackCampaignImpression } from '@/services/campaign';
import { getEffectiveTheme } from '@/constants/theme';
import { COOKIE_KEYS } from '@/constants/storage';

// Legacy imports still needed (to be migrated later)
import { themeVars } from '@tools/utils/theme';
import useTracking from '@tools/utils/useTracking';
import svgIcons from '@tools/assets/svgIcons';
import { evaluateTargeting } from '@tools/utils/campaignTargeting';
import {
  canShowCampaign,
  recordCampaignView,
} from '@tools/utils/campaignFrequency';
import {
  isReturningVisitor,
  getCurrentUrl,
  getReferrerUrl,
  getPageLoadTime,
  initVisitorTracking,
} from '@tools/utils/visitorTracking';

interface MessengerProps {
  config?: RhinontechConfig | null;
}

interface selectedNewsProps {
  title: string;
  content: string;
  img: string;
  tags: string[];
  authorImg: string;
  authorName: string;
  updatedAt: string;
}

interface selectedHelpArticleProps {
  articleId: string;
  title: string;
  content: string;
  status: string;
  views: number;
  likes: number;
  dislikes: number;
  createdAt: string;
  updatedAt: string;
}

const Messenger: React.FC<MessengerProps> = ({ config }) => {
  const { chatbot_config, setConfig } = useConfigStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // const [preChatForm, setPreChatForm] = useState<any | null>(null);
  // const [postChatForm, setPostChatForm] = useState<PostChatFormConfig | null>(
  //   null,
  // );
  // const [ticketForm, setTicketForm] = useState<any | null>(null);
  const [isSpeakingWithRealPerson, setIsSpeakingWithRealPerson] =
    useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isTicketRaised, setIsTicketRaised] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<string>('400px');
  const [selectedNews, setSelectedNews] = useState<selectedNewsProps | null>(
    null,
  );
  const [selectedHelpArticle, setSelectedHelpArticle] =
    useState<selectedHelpArticleProps | null>(null);
  const [helpArticles, setHelpArticles] = useState<Folder[]>([]);

  const [selectedHelp, setSelectedHelp] = useState<Folder | null>(null);
  const [isApiKeyProvided, setIsApiKeyProvided] = useState<boolean>(false);
  const [freePlan, setFreePlan] = useState<boolean>(false);
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    'light',
  );
  const [activeCampaign, setActiveCampaign] = useState<Campaign | undefined>(
    undefined,
  );

  // Ref to track if campaign has been found (persists across renders)
  const campaignFoundRef = useRef(false);

  // Function to get effective theme based on config
  const getEffectiveTheme = (
    configTheme?: 'light' | 'dark' | 'system',
  ): 'light' | 'dark' => {
    if (configTheme === 'system' || !configTheme) {
      // Detect system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      return prefersDark ? 'dark' : 'light';
    }
    return configTheme;
  };

  // Initialize / Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      if (config?.admin && config.chatbot_config) {
        // Admin mode: apply config locally but don’t store selectedPage
        const { selectedPage, ...restConfig } = config.chatbot_config;

        setConfig({
          app_id: config.app_id,
          admin: true,
          chatbot_config: restConfig, // exclude selectedPage
        });

        // Open the selected page if provided
        if (selectedPage) {
          setActiveScreen(selectedPage.toLowerCase());
        } else {
          setActiveScreen('home'); // fallback
        }
      } else if (config?.app_id) {
        try {
          console.log('Fetching chatbot config from server...');
          const response = await getChatbotConfig(config.app_id);

          setIsApiKeyProvided(response.isApiKeyProvided);
          setFreePlan(response.plan === 'Free' ? true : false);
          const isFree = response.plan === 'Free' ? true : false;
          // setIsApiKeyProvided(false);
          // const isFree = false;
          // setFreePlan(true);

          const cfg = response.chatbot_config;

          const formResponse = await getForms(config.app_id);
          console.log('Reseponse ------------->', response);

          setConfig({
            app_id: config.app_id,
            admin: true,
            adminTestingMode: config.adminTestingMode,
            chatbot_config: {
              theme: cfg.theme || 'dark',
              isFreePlan: isFree,
              currentPlan: response.plan || 'Trail',
              isBackgroundImage: cfg.isBackgroundImage || false,
              backgroundImage: cfg.backgroundImage || '',
              isBgFade: cfg.isBgFade ?? true,
              primaryColor: cfg.primaryColor || '#1403ac',
              secondaryColor: cfg.secondaryColor || '#f3f6ff',
              chatbotName: cfg.chatbotName || 'Rhinon',
              navigationOptions: cfg.navigationOptions,
              popupMessage:
                cfg.popupMessage ||
                'Hey, I am Rhinon AI Assistant, How can I help you?',
              greetings: cfg.greetings?.length
                ? cfg.greetings
                : ['Hi there👋', 'How can we help?'],
              primaryLogo:
                cfg.primaryLogo ||
                'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_White.png',
              secondaryLogo:
                cfg.secondaryLogo ||
                'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png',

              // forms will be updated after fetchForms()
              preChatForm: formResponse.pre_chat_form,
              postChatForm: formResponse.post_chat_form,
              ticketForm: formResponse.ticket_form,
            },
          });
        } catch (err) {
          console.error('Failed to fetch chatbot config', err);
        }
      }
    };

    fetchConfig();
  }, [config, setConfig]);

  // Handle system theme detection and changes
  useEffect(() => {
    // Set initial theme from chatbot_config
    setEffectiveTheme(getEffectiveTheme(chatbot_config?.theme));

    // Listen for system theme changes if theme is 'system'
    if (chatbot_config?.theme === 'system' || !chatbot_config?.theme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleThemeChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newTheme);
      };

      mediaQuery.addEventListener('change', handleThemeChange);

      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, [chatbot_config?.theme]);

  // Compute a flag for whether tracking should run
  const shouldTrack = !config?.admin && !(freePlan && !isApiKeyProvided);
  // Call the hook unconditionally
  useTracking(config?.app_id, shouldTrack);

  // Handle chat open event from server
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      const conversationId = event.detail?.conversationId;
      if (!conversationId) return;

      //  Always ensure chat UI is open
      setIsOpen(true);

      //  Close or reset the existing conversation if any
      setSelectedChatId(null);

      // Open new conversation
      setTimeout(() => {
        setSelectedChatId(conversationId);
      }, 0);

      // Set UI state
      setActiveScreen('chats');
      setIsSpeakingWithRealPerson(true);
    };

    window.addEventListener('open_chat_from_server', handleOpenChat);
    return () => {
      window.removeEventListener('open_chat_from_server', handleOpenChat);
    };
  }, []);

  const campaignsRef = useRef<Campaign[]>([]);

  const checkCampaigns = () => {
    if (campaignFoundRef.current) return;

    try {
      const activeCampaigns = campaignsRef.current;

      // Prepare visitor data
      const visitorData = {
        isReturning: isReturningVisitor(),
        timeOnPage: getPageLoadTime(),
        currentUrl: getCurrentUrl(),
        referrerUrl: getReferrerUrl(),
      };

      for (const campaign of activeCampaigns) {
        // Check frequency capping with campaign type
        if (!canShowCampaign(campaign.id, campaign.type)) {
          console.log(
            `Campaign ${campaign.id} skipped: frequency limit reached`,
          );
          continue;
        }

        // Evaluate targeting
        if (evaluateTargeting(campaign, visitorData)) {
          console.log(`Campaign ${campaign.id} matched targeting rules`);
          setActiveCampaign(campaign);
          recordCampaignView(campaign.id, campaign.type);
          trackCampaignImpression(campaign.id, config?.app_id || '');
          campaignFoundRef.current = true; // Mark as found immediately
          break; // Show first matching campaign
        }
      }
    } catch (error) {
      console.error('Error checking campaigns:', error);
    }
  };

  useEffect(() => {
    // Initialize visitor tracking
    const initTracking = async () => {
      initVisitorTracking();
    };
    initTracking();

    const fetchCampaigns = async () => {
      try {
        const response = await getCampaignsChatbot(config?.app_id || '');
        if (response && response.length > 0) {
          // Filter only active campaigns
          campaignsRef.current = response.filter(
            (c: any) => c.status === 'active',
          );
          // Initial check immediately after fetch
          checkCampaigns();
        }
      } catch (error) {
        console.error('Failed to get campaigns chatbot', error);
      }
    };

    fetchCampaigns();

    // Re-check campaigns every 5 seconds for time-based triggers using LOCAL data
    const interval = setInterval(() => {
      if (!campaignFoundRef.current) {
        checkCampaigns();
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

  // Update ref when activeCampaign changes (safety check)
  useEffect(() => {
    if (activeCampaign) {
      campaignFoundRef.current = true;
    }
  }, [activeCampaign]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleNavigate = (screen: string) => {
    setActiveScreen(screen);
    if (screen === 'chats') setSelectedChatId(null);
  };

  const handleChatSelect = (chatId: string) => setSelectedChatId(chatId);

  const handleBackToChats = () => {
    setSelectedChatId(null);
    setIsSpeakingWithRealPerson(false);
  };

  //  Resolve saved user info
  useEffect(() => {
    const savedVisitorId = localStorage.getItem('userId');
    setUserId(savedVisitorId);

    const savedEmail = Cookies.get('userEmail');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsEmailAvailable(true);
    } else {
      setIsEmailAvailable(false);
      setUserEmail(
        isSpeakingWithRealPerson && !savedEmail ? 'New Customer' : savedEmail,
      );
    }
  }, [isSpeakingWithRealPerson]);

  // Auto open if admin
  useEffect(() => {
    if (config.admin) {
      setIsOpen(true);
    }
  }, [config.admin]);

  // Popup
  useEffect(() => {
    setTimeout(() => {
      setShowPopup(true);
    }, 1000);
  }, []);

  const navigationOptions = chatbot_config?.navigationOptions || [
    'Home',
    'Messages',
    'Help',
  ];

  const renderNavButton = (option: string) => {
    if (
      freePlan &&
      !['home', 'help', 'messages'].includes(option.toLowerCase())
    ) {
      return null;
    }

    let icon: JSX.Element | null = null;
    let screen: 'home' | 'chats' | 'help' | 'voice' | 'news' | null = null;

    switch (option.toLowerCase()) {
      case 'home':
        icon = svgIcons.homeIcon();
        screen = 'home';
        break;
      case 'messages':
        icon = svgIcons.chatIcon();
        screen = 'chats';
        break;
      case 'help':
        icon = svgIcons.helpIcon();
        screen = 'help';
        break;
      case 'voice':
        icon = <Mic size={20} />;
        screen = 'voice';
        break;
      case 'news':
        icon = svgIcons.newsIcon();
        screen = 'news';
        break;
      default:
        return null;
    }

    return (
      <button
        key={screen}
        className={`nav-btn ${activeScreen === screen ? 'active' : ''}`}
        style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}
        onClick={() => screen && handleNavigate(screen)}
      >
        <div className='icon-wrapper'>{icon}</div>
      </button>
    );
  };

  const onToChat = () => {
    setActiveScreen('chats');
  };
  const onToHome = () => {
    setActiveScreen('home');
  };
  const raiseTicket = () => setActiveScreen('raiseTicket');

  const handleClose = () => {
    setIsOpen(false);
    const closeChatEvent = new CustomEvent('close_chat_from_server');
    window.dispatchEvent(closeChatEvent);
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            isFreePlan={freePlan}
            isAdmin={config.admin}
            appId={config?.app_id || ''}
            userId={userId}
            userEmail={userEmail}
            chatbot_config={chatbot_config}
            setIsTicketRaised={setIsTicketRaised}
            ticketForm={chatbot_config.ticketForm}
            onChatSelect={handleChatSelect}
          />
        );
      case 'chats':
        if (selectedChatId) {
          return (
            <ChatScreen
              isAdmin={config.admin}
              isFreePlan={freePlan}
              onNavigate={handleNavigate}
              isEmailAvailable={isEmailAvailable}
              setIsEmailAvailable={setIsEmailAvailable}
              isSpeakingWithRealPerson={isSpeakingWithRealPerson}
              setIsSpeakingWithRealPerson={setIsSpeakingWithRealPerson}
              onBack={handleBackToChats}
              appId={config?.app_id || ''}
              userId={userId}
              setUserEmail={setUserEmail}
              userEmail={userEmail}
              conversationId={selectedChatId}
              chatbot_config={chatbot_config}
              preChatForm={chatbot_config.preChatForm}
              raiseTicket={raiseTicket}
              postChatForm={chatbot_config.postChatForm}
              setIsTicketRaised={setIsTicketRaised}
              ticketForm={chatbot_config.ticketForm}
              setWindowWidth={setWindowWidth}
              adminTestingMode={config.adminTestingMode}
            // isPostChatSubmitted={isPostChatSubmitted}
            // setIsPostChatSubmitted={setIsPostChatSubmitted}
            />
          );
        }
        return (
          <ChatHistoryScreen
            isFreePlan={freePlan}
            setIsSpeakingWithRealPerson={setIsSpeakingWithRealPerson}
            onChatSelect={handleChatSelect}
            appId={config?.app_id || ''}
            userId={userId}
            chatbot_config={chatbot_config}
            isAdmin={config.admin}
          />
        );
      case 'voice':
        return (
          <Voice
            appId={config?.app_id || ''}
            onButtonClick={onToHome}
            isAdmin={config.admin}
          />
        );
      case 'help':
        if (selectedHelpArticle) {
          return (
            <HelpAriclePage
              chatbot_config={chatbot_config}
              setWindowWidth={setWindowWidth}
              setSelectedHelpArticle={setSelectedHelpArticle}
              selectedHelpArticle={selectedHelpArticle}
            />
          );
        }
        return (
          <HelpScreen
            onNavigate={handleNavigate}
            setSelectedHelpArticle={setSelectedHelpArticle}
            chatbot_config={chatbot_config}
            selectedHelp={selectedHelp}
            setSelectedHelp={setSelectedHelp}
            appId={config?.app_id}
          />
        );
      // case 'raiseTicket':
      //   return (
      //     <RaiseTicket
      //       onButtonClick={onToChat}
      //       goBackClick={onToChat}
      //       // userId={email}
      //       appId={app_id}
      //       setIsTicketRaised={setIsTicketRaised}
      //       chatbot_config={chatbot_config}
      //       ticketForm={ticketForm}
      //     />

      //   );
      case 'news':
        if (selectedNews) {
          return (
            <NewsPage
              setWindowWidth={setWindowWidth}
              setSelectedNews={setSelectedNews}
              selectedNews={selectedNews}
              chatbot_config={chatbot_config}
            />
          );
        }
        return (
          <NewsScreen
            setSelectedNews={setSelectedNews}
            chatbot_config={chatbot_config}
          />
        );
      default:
        return (
          <ChatHistoryScreen
            isFreePlan={freePlan}
            setIsSpeakingWithRealPerson={setIsSpeakingWithRealPerson}
            onChatSelect={handleChatSelect}
            appId={config?.app_id || ''}
            userId={userId}
            chatbot_config={chatbot_config}
            isAdmin={config.admin}
          />
        );
    }
  };

  return (
    <div
      className={`chatbot-container ${config.admin ? 'admin-align' : ''}`}
      data-theme={effectiveTheme}
      style={{
        ...themeVars,
        ['--primary-color' as any]: chatbot_config?.primaryColor || '#1403ac',
        ['--secondary-color' as any]:
          chatbot_config?.secondaryColor || '#f3f6ff',
      }}
    >
      {/* Popup Message */}
      {!isOpen &&
        showPopup &&
        chatbot_config?.popupMessage &&
        activeCampaign && (
          <Campaigns
            setIsOpen={(val) => {
              if (val === false) {
                setActiveCampaign(undefined);
              } else {
                setIsOpen(val);
              }
            }}
            activeCampaign={activeCampaign}
          />
        )}

      {/* Chat Window */}
      <AnimatePresence>
        {(isOpen || config.admin) &&
          (config?.admin ? (
            // Admin mode: no animation
            <div
              className='chat-window'
              style={{ ['--set-width' as any]: windowWidth }}
            >

              <div className='screen-wrapper'>{renderActiveScreen()}</div>

              {/* Dynamic Bottom Navigation */}
              {!(
                (activeScreen === 'chats' && selectedChatId) ||
                (activeScreen === 'news' && selectedNews) ||
                activeScreen === 'raiseTicket' ||
                (activeScreen === 'help' && selectedHelpArticle)
              ) && (
                  <div className='bottom-nav'>
                    {navigationOptions.map((option: string) =>
                      renderNavButton(option),
                    )}
                  </div>
                )}

              <div className='footer'>
                <p>Powered by</p>
                <img
                  src={
                    effectiveTheme === 'dark'
                      ? 'https://rhinon.tech/assets/rhinonlogo.png'
                      : 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png'
                  }
                  alt='Rhinon Logo'
                  style={{ width: 50 }}
                />
              </div>
            </div>
          ) : (
            // Normal mode: with animation
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className='chat-window'
              style={{ ['--set-width' as any]: windowWidth }}
            >
              <div className='chat-bot-header'>
                <button className='chat-bot-header-button' onClick={handleClose}><Minus /> </button>
              </div>
              <div className='screen-wrapper'>{renderActiveScreen()}</div>

              {/* Dynamic Bottom Navigation */}
              {!(
                (activeScreen === 'chats' && selectedChatId) ||
                (activeScreen === 'news' && selectedNews) ||
                activeScreen === 'raiseTicket' ||
                (activeScreen === 'help' && selectedHelpArticle) ||
                activeScreen === 'voice'
              ) && (
                  <div className='bottom-nav'>
                    {navigationOptions.map((option: string) =>
                      renderNavButton(option),
                    )}
                  </div>
                )}

              <div className='footer'>
                <p>Powered by</p>
                <img
                  src={
                    effectiveTheme === 'dark'
                      ? 'https://rhinon.tech/assets/rhinonlogo.png'
                      : 'https://rhinontech.s3.ap-south-1.amazonaws.com/rhinon-live/Logo_Rhinon_Tech_Dark+2.png'
                  }
                  alt='Rhinon Logo'
                  style={{ width: 50 }}
                />
              </div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Chat Button */}
      {!(freePlan && !isApiKeyProvided) && ( // Hide button if free plan + no key
        <>
          <motion.button
            style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}
            className={`chat-button ${!config.admin && isOpen ? '' : ''}`}
            onClick={
              config.admin ? undefined : isOpen ? handleClose : toggleChat
            }
            disabled={config.admin}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          // animate={!isOpen ? {
          //   boxShadow: [
          //     "0 0 0 0 rgba(0, 0, 0, 0.2)",
          //     "0 0 0 10px rgba(0, 0, 0, 0)",
          //   ],
          // } : {}}
          // transition={!isOpen ? {
          //   duration: 2,
          //   repeat: Infinity,
          // } : {}}
          >
            {!config.admin && isOpen ? (
              <X size={24} color='#fff' />
            ) : (
              <img
                src={chatbot_config.primaryLogo}
                alt='Chat icon'
                style={{ width: '32px', height: '32px', objectFit: 'fill' }}
              />
            )}
          </motion.button>
        </>
      )}
    </div>
  );
};

export default Messenger;
