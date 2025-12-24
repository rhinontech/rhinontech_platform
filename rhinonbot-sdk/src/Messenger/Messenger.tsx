import React, { Suspense, lazy, useEffect } from 'react';
import { Minus } from 'lucide-react';
import './Messenger.scss';
import { io } from 'socket.io-client';
import type { Message, ChatScreenProps } from '@/types';

// Lazy load screens for better initial bundle size
const ChatScreen = lazy(() => import('@/screens/ChatScreen/ChatScreen'));
// ChatHistoryScreen removed - using unified chat screen instead
const HelpScreen = lazy(() => import('@/screens/HelpScreen/HelpScreen'));
const HomeScreen = lazy(() => import('@/screens/HomeScreen/HomeScreen'));
const Voice = lazy(() => import('@/screens/VoiceScreen/Voice'));
const NewsScreen = lazy(() => import('@/screens/NewsScreen/NewsScreen'));
const NewsPage = lazy(() => import('@/screens/NewsPage/NewsPage'));
const HelpAriclePage = lazy(() => import('@/screens/HelpArticlePage/HelpArticlePage'));
const Campaigns = lazy(() =>
  import('@/screens/Campaigns/Campaigns').then(module => ({ default: module.Campaigns }))
);

import { AnimatePresence, motion } from 'motion/react';

// Common components
import { Loader } from '@/components/common';

// Types
import type { RhinontechConfig } from '@/types';

// Hooks - centralized state and logic
import {
  useMessengerState,
  useCampaignLogic,
  useScreenNavigation
} from './hooks';

// Components - extracted UI pieces
import { BottomNav, MessengerFooter, ChatButton } from './components';

// Utilities
import { themeVars } from '@/utils/theme';
import useTracking from '@/utils/useTracking';
import { useChatLogic } from '@src/screens/ChatScreen/useChatLogic';

interface MessengerProps {
  config?: RhinontechConfig | null;
}

const Messenger: React.FC<MessengerProps> = ({ config }) => {
  // Use centralized state management hook
  const state = useMessengerState(config);

  const {
    isOpen,
    setIsOpen,
    activeScreen,
    setActiveScreen,
    showPopup,
    windowWidth,
    setWindowWidth,
    effectiveTheme,
    selectedChatId,
    setSelectedChatId,
    isSpeakingWithRealPerson,
    setIsSpeakingWithRealPerson,
    setIsTicketRaised,
    isEmailAvailable,
    setIsEmailAvailable,
    userEmail,
    setUserEmail,
    userId,
    selectedNews,
    setSelectedNews,
    selectedHelpArticle,
    setSelectedHelpArticle,
    selectedHelp,
    setSelectedHelp,
    isApiKeyProvided,
    freePlan,
    activeCampaign,
    setActiveCampaign,
    campaignFoundRef,
    campaignsRef,
    chatbot_config,
  } = state;

  // Use screen navigation hook
  const {
    toggleChat,
    handleNavigate,
    handleChatSelect,
    handleBackToChats,
    raiseTicket,
    handleClose,
  } = useScreenNavigation({
    state: {
      setIsOpen,
      setActiveScreen,
      setSelectedChatId,
      setIsSpeakingWithRealPerson,
    },
  });

  // Use campaign logic hook
  useCampaignLogic({
    appId: config?.app_id || '',
    campaignsRef,
    campaignFoundRef,
    setActiveCampaign,
  });

  // chat logic
  const chatLogic = useChatLogic({
    userId,
    userEmail,
    appId: config?.app_id || '',
    conversationId: selectedChatId,
    isAdmin: config?.admin,
    chatAvatar: "https://img.freepik.com/premium-photo/beautiful-woman-with-natural-makeup-women-with-clean-fresh-skin-dark-hear-blue-eyes_150254-452.jpg?semt=ais_hybrid&w=740",
    chatbot_config,
    setSelectedChatId,
    timeoutDuration: 15 * 60 * 1000,
    setUserEmail,
    setIsEmailAvailable,
    isSpeakingWithRealPerson,
    setIsSpeakingWithRealPerson,
    onBack: handleBackToChats,
    setWindowWidth,
    postChatForm: chatbot_config?.postChatForm,
    isEmailAvailable,
    preChatForm: chatbot_config?.preChatForm,
    adminTestingMode: config?.adminTestingMode,
  });

  const {
    chatMessages,
    message,
    setMessage,
    loading,
    convoId,
    setConvoId,
    isConversationActive,
    isConversationClosed,
    reachedLimit,
    supportName,
    setSupportName,
    setChatMessages,
    supportImage,
    setSupportImage,
    showTyping,
    setShowTyping,
    isListening,
    setIsListening,
    openPostChatForm,
    lastFetchedConversationIdRef,
    socketRef,
    fileInputRef,
    typingRef,
    transcript,
    resetInactivityTimeout,
    handleSend,
    handleFileUpload,
    handleSaveEmail,
    handlePostFormSubmit,
    handleCloseChat,
    startListening,
    stopListening,
    cancelListening,
    handleSwitchToRealPerson,
    fetchChats,
    isfetching,
    startNewConversation,
    setOpenPostChatForm,
    playSound,
  } = chatLogic;

  useEffect(() => {
    if (
      selectedChatId &&
      lastFetchedConversationIdRef.current !== selectedChatId &&
      lastFetchedConversationIdRef.current !== 'NEW_CHAT'
    ) {
      lastFetchedConversationIdRef.current = selectedChatId;
      fetchChats();
    }
  }, [selectedChatId]);

  let chatAvatar = 'https://img.freepik.com/premium-photo/beautiful-woman-with-natural-makeup-women-with-clean-fresh-skin-dark-hear-blue-eyes_150254-452.jpg?semt=ais_hybrid&w=740';



  // ====== WebSocket connection ======
  useEffect(() => {
    if (isSpeakingWithRealPerson && isConversationActive) {
      let activeConvoId = convoId;
      if (activeConvoId === 'NEW_CHAT') {
        activeConvoId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
      }

      const socket = io(process.env.REACT_APP_SOCKET_URL, {
        query: {
          user_email: userEmail,
          chatbot_id: config?.app_id,
          conversation_id: activeConvoId,
          user_id: userId,
        },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Connected to real-person chat');

        if (convoId === 'NEW_CHAT' && isSpeakingWithRealPerson) {
          const firstMessage: Message = {
            user_email: userEmail,
            user_id: userId,
            chatbot_id: config?.app_id,
            role: 'trigger',
            text: 'start the conversation..',
            chatbot_history: activeConvoId,
            timestamp: new Date().toISOString(),
          };
          setConvoId(activeConvoId);
          socket.emit('message', firstMessage);
        }
      });

      socket.on('message', (incoming: Message) => {
        setSupportName((prevName) => {
          if (incoming.sender_name && incoming.sender_name !== prevName) {
            return incoming.sender_name;
          }
          return prevName;
        });
        playSound();

        setSupportImage((prevImage) => {
          if (
            incoming.sender_image !== null &&
            incoming.sender_image !== prevImage
          ) {
            return incoming.sender_image;
          } else if (incoming.sender_image === '') {
            return chatAvatar;
          }
          return prevImage;
        });

        if (incoming.chatbot_history === activeConvoId) {
          // Fix: Prevent duplicate messages for user's own messages
          if (incoming.role === 'user') return;

          setChatMessages((prev) => [...prev, incoming]);
          resetInactivityTimeout();
        }
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from real-person chat');
      });

      return () => {
        socket.off('message');
        socket.disconnect();
      };
    }
  }, [isSpeakingWithRealPerson, userId, config?.app_id, convoId, isConversationActive]);





  // Compute tracking flag
  const shouldTrack = !config?.admin && !(freePlan && !isApiKeyProvided);
  useTracking(config?.app_id, shouldTrack);

  // Navigation options from config
  const navigationOptions = chatbot_config?.navigationOptions || [
    'Home',
    'Messages',
    'Help',
  ];

  // Check if bottom nav should be hidden
  const shouldHideBottomNav = (
    (activeScreen === 'chats') ||
    (activeScreen === 'news' && selectedNews) ||
    activeScreen === 'raiseTicket' ||
    (activeScreen === 'help' && selectedHelpArticle) ||
    activeScreen === 'voice'
  );

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            isFreePlan={freePlan}
            isAdmin={config?.admin}
            appId={config?.app_id || ''}
            userId={userId}
            userEmail={userEmail}
            setSelectedChatId={setSelectedChatId}
            chatbot_config={chatbot_config}
            setIsTicketRaised={setIsTicketRaised}
            ticketForm={chatbot_config?.ticketForm}
            onChatSelect={handleChatSelect}
          />
        );
      case 'chats':
        // Always show unified ChatScreen directly (like WhatsApp)
        // Use 'NEW_CHAT' if no conversation selected
        return (
          <ChatScreen
            isAdmin={config?.admin}
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
            conversationId={selectedChatId || 'NEW_CHAT'}
            setSelectedChatId={setSelectedChatId}
            chatbot_config={chatbot_config}
            preChatForm={chatbot_config?.preChatForm}
            raiseTicket={raiseTicket}
            postChatForm={chatbot_config?.postChatForm}
            setIsTicketRaised={setIsTicketRaised}
            ticketForm={chatbot_config?.ticketForm}
            setWindowWidth={setWindowWidth}
            adminTestingMode={config?.adminTestingMode}
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            loading={loading}
            convoId={convoId}
            setConvoId={setConvoId}
            isConversationActive={isConversationActive}
            isConversationClosed={isConversationClosed}
            reachedLimit={reachedLimit}
            supportName={supportName}
            setSupportName={setSupportName}
            supportImage={supportImage}
            setSupportImage={setSupportImage}
            setChatMessages={setChatMessages}
            showTyping={showTyping}
            setShowTyping={setShowTyping}
            isListening={isListening}
            setIsListening={setIsListening}
            openPostChatForm={openPostChatForm}
            lastFetchedConversationIdRef={lastFetchedConversationIdRef}
            socketRef={socketRef}
            fileInputRef={fileInputRef}
            typingRef={typingRef}
            transcript={transcript}
            resetInactivityTimeout={resetInactivityTimeout}
            handleSend={handleSend}
            handleFileUpload={handleFileUpload}
            handleSaveEmail={handleSaveEmail}
            handlePostFormSubmit={handlePostFormSubmit}
            handleCloseChat={handleCloseChat}
            startListening={startListening}
            stopListening={stopListening}
            cancelListening={cancelListening}
            handleSwitchToRealPerson={handleSwitchToRealPerson}
            fetchChats={fetchChats}
            isfetching={isfetching}
            startNewConversation={startNewConversation}
            setOpenPostChatForm={setOpenPostChatForm}
            playSound={playSound}
          />
        );
      case 'voice':
        return (
          <Voice
            appId={config?.app_id || ''}
            onButtonClick={() => setActiveScreen('home')}
            isAdmin={config?.admin}
            userEmail={userEmail}
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
        // Default to unified chat screen instead of history
        return (
          <ChatScreen
            isAdmin={config?.admin}
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
            conversationId={selectedChatId || 'NEW_CHAT'}
            setSelectedChatId={setSelectedChatId}
            chatbot_config={chatbot_config}
            preChatForm={chatbot_config?.preChatForm}
            raiseTicket={raiseTicket}
            postChatForm={chatbot_config?.postChatForm}
            setIsTicketRaised={setIsTicketRaised}
            ticketForm={chatbot_config?.ticketForm}
            setWindowWidth={setWindowWidth}
            adminTestingMode={config?.adminTestingMode}
            chatMessages={chatMessages}
            message={message}
            setMessage={setMessage}
            loading={loading}
            convoId={convoId}
            setConvoId={setConvoId}
            isConversationActive={isConversationActive}
            isConversationClosed={isConversationClosed}
            reachedLimit={reachedLimit}
            supportName={supportName}
            setSupportName={setSupportName}
            supportImage={supportImage}
            setSupportImage={setSupportImage}
            setChatMessages={setChatMessages}
            showTyping={showTyping}
            setShowTyping={setShowTyping}
            isListening={isListening}
            setIsListening={setIsListening}
            openPostChatForm={openPostChatForm}
            lastFetchedConversationIdRef={lastFetchedConversationIdRef}
            socketRef={socketRef}
            fileInputRef={fileInputRef}
            typingRef={typingRef}
            transcript={transcript}
            resetInactivityTimeout={resetInactivityTimeout}
            handleSend={handleSend}
            handleFileUpload={handleFileUpload}
            handleSaveEmail={handleSaveEmail}
            handlePostFormSubmit={handlePostFormSubmit}
            handleCloseChat={handleCloseChat}
            startListening={startListening}
            stopListening={stopListening}
            cancelListening={cancelListening}
            handleSwitchToRealPerson={handleSwitchToRealPerson}
            fetchChats={fetchChats}
            isfetching={isfetching}
            startNewConversation={startNewConversation}
            setOpenPostChatForm={setOpenPostChatForm}
            playSound={playSound}
          />
        );
    }
  };

  return (
    <div
      className={`chatbot-container ${config?.admin ? 'admin-align' : ''}`}
      data-theme={effectiveTheme}
      style={{
        ...themeVars,
        ['--primary-color' as string]: chatbot_config?.primaryColor || '#1403ac',
        ['--secondary-color' as string]: chatbot_config?.secondaryColor || '#f3f6ff',
      }}
    >
      {/* Campaign Popup */}
      {!isOpen && showPopup && chatbot_config?.popupMessage && activeCampaign && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {(isOpen || config?.admin) && (
          config?.admin ? (
            // Admin mode: no animation
            <div
              className='chat-window'
              style={{ ['--set-width' as string]: windowWidth }}
              role="dialog"
              aria-label="Chat window"
            >
              <div className='screen-wrapper'>
                <Suspense fallback={<div className="screen-loading"><Loader /></div>}>
                  {renderActiveScreen()}
                </Suspense>
              </div>

              {/* Bottom Navigation */}
              {!shouldHideBottomNav && (
                <BottomNav
                  navigationOptions={navigationOptions}
                  activeScreen={activeScreen}
                  chatbot_config={chatbot_config}
                  freePlan={freePlan}
                  onNavigate={handleNavigate}
                />
              )}

              <MessengerFooter effectiveTheme={effectiveTheme} />
            </div>
          ) : (
            // Normal mode: with animation
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className='chat-window'
              style={{ ['--set-width' as string]: windowWidth }}
              role="dialog"
              aria-label="Chat window"
            >
              <div className='chat-bot-header'>
                <button
                  className='chat-bot-header-button'
                  onClick={handleClose}
                  aria-label="Minimize chat"
                >
                  <Minus aria-hidden="true" />
                </button>
              </div>

              <div className='screen-wrapper'>
                <Suspense fallback={<div className="screen-loading"><Loader /></div>}>
                  {renderActiveScreen()}
                </Suspense>
              </div>

              {/* Bottom Navigation */}
              {!shouldHideBottomNav && (
                <BottomNav
                  navigationOptions={navigationOptions}
                  activeScreen={activeScreen}
                  chatbot_config={chatbot_config}
                  freePlan={freePlan}
                  onNavigate={handleNavigate}
                />
              )}

              <MessengerFooter effectiveTheme={effectiveTheme} />
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Chat Button */}
      <ChatButton
        chatbot_config={chatbot_config}
        isOpen={isOpen}
        isAdmin={config?.admin || false}
        freePlan={freePlan}
        isApiKeyProvided={isApiKeyProvided}
        onToggle={toggleChat}
        onClose={handleClose}
      />
    </div>
  );
};

export default Messenger;
