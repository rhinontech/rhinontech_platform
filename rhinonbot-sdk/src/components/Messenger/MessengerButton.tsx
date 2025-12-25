/**
 * MessengerButton - The floating chat toggle button
 */
import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChatbotConfig } from '@/types';

interface MessengerButtonProps {
  isOpen: boolean;
  isAdmin: boolean;
  chatbotConfig: ChatbotConfig;
  onToggle: () => void;
  onClose: () => void;
}

export const MessengerButton: React.FC<MessengerButtonProps> = ({
  isOpen,
  isAdmin,
  chatbotConfig,
  onToggle,
  onClose,
}) => {
  return (
    <motion.button
      style={{ ['--primary-color' as any]: chatbotConfig?.primaryColor }}
      className={`chat-button ${!isAdmin && isOpen ? '' : ''}`}
      onClick={isAdmin ? undefined : isOpen ? onClose : onToggle}
      disabled={isAdmin}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {!isAdmin && isOpen ? (
        <X size={24} color='#fff' />
      ) : (
        <img
          src={chatbotConfig?.primaryLogo}
          alt='Chat icon'
          style={{ width: '32px', height: '32px', objectFit: 'fill' }}
        />
      )}
    </motion.button>
  );
};

export default MessengerButton;
