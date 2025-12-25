// ChatButton - Floating chat button component
import React, { memo } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { ChatbotConfig } from '@/types';

interface ChatButtonProps {
  chatbot_config: ChatbotConfig;
  isOpen: boolean;
  isAdmin: boolean;
  freePlan: boolean;
  isApiKeyProvided: boolean;
  onToggle: () => void;
  onClose: () => void;
  showNotification: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = memo(({
  chatbot_config,
  isOpen,
  isAdmin,
  freePlan,
  isApiKeyProvided,
  onToggle,
  onClose,
  showNotification,
}) => {
  // Hide button if free plan + no API key
  if (freePlan && !isApiKeyProvided) {
    return null;
  }

  const buttonLabel = isOpen ? 'Close chat' : 'Open chat';

  return (
    <motion.button
      style={{ ['--primary-color' as string]: chatbot_config.primaryColor }}
      className={`chat-button ${!isAdmin && isOpen ? '' : ''}`}
      onClick={isAdmin ? undefined : isOpen ? onClose : onToggle}
      disabled={isAdmin}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={buttonLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      role="button"
    >
      {(showNotification && !isOpen) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'red',
            zIndex: 10,
          }}
        />
      )}


      {!isAdmin && isOpen ? (
        <X size={24} color='#fff' aria-hidden="true" />
      ) : (
        <img
          src={chatbot_config.primaryLogo}
          alt={`${chatbot_config.chatbotName || 'Chat'} icon`}
          style={{ width: '32px', height: '32px', objectFit: 'fill' }}
        />
      )}
    </motion.button>
  );
});

ChatButton.displayName = 'ChatButton';

export default ChatButton;
