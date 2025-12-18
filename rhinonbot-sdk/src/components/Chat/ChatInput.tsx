// Chat Input Component - Text input, file upload, emoji picker, and voice recording
import React from 'react';
import {
  SendHorizontal,
  Smile,
  Paperclip,
  Mic,
  X,
  Square,
  MessageCircle,
} from 'lucide-react';
import type { ChatbotConfig, WhatsAppConfig } from '@/types';

export interface ChatInputProps {
  isAdmin: boolean;
  isConversationActive: boolean;
  isConversationClosed: boolean;
  reachedLimit: boolean;
  isListening: boolean;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
  loading: boolean;
  isSpeakingWithRealPerson: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
  startListening: () => void;
  cancelListening: () => void;
  stopListening: () => void;
  chatbot_config: ChatbotConfig;
  showEmojiPicker: boolean;
  EmojiPicker: any;
  adminTestingMode?: boolean;
  whatsappConfig?: WhatsAppConfig;
  onWhatsAppClick?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isAdmin,
  isConversationActive,
  isConversationClosed,
  reachedLimit,
  isListening,
  message,
  setMessage,
  handleSend,
  loading,
  isSpeakingWithRealPerson,
  fileInputRef,
  handleFileUpload,
  setShowEmojiPicker,
  startListening,
  cancelListening,
  stopListening,
  chatbot_config,
  showEmojiPicker,
  EmojiPicker,
  adminTestingMode,
  whatsappConfig,
  onWhatsAppClick,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isConversationActive && !loading) {
      handleSend();
    }
  };

  // Don't render input in certain conditions
  if (
    (isAdmin && !adminTestingMode) ||
    !isConversationActive ||
    isConversationClosed ||
    reachedLimit
  ) {
    return null;
  }

  const getPlaceholder = (): string => {
    if (isConversationClosed) return 'Conversation closed';
    if (isConversationActive) return 'Type a message';
    return 'Conversation expired';
  };

  return (
    <div
      className='chat-input'
      style={{
        position: 'relative',
        ['--primary-color' as any]: chatbot_config.primaryColor,
      }}
    >
      {!isListening ? (
        <>
          <input
            type='text'
            placeholder={getPlaceholder()}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConversationActive}
            style={{
              opacity: isConversationActive ? 1 : 0.6,
            }}
          />

          {/* File upload - only when speaking with real person */}
          {isSpeakingWithRealPerson && isConversationActive && (
            <>
              <input
                type='file'
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                className='input-btn'
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConversationActive}
              >
                <Paperclip color='var(--text-primary)' size={20} />
              </button>
            </>
          )}

          {isConversationActive && (
            <>
              {/* Emoji picker button */}
              <button
                className='input-btn'
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker((prev) => !prev);
                }}
                disabled={!isConversationActive}
              >
                <Smile size={20} color='var(--text-primary)' />
              </button>

              {/* WhatsApp button */}
              {isSpeakingWithRealPerson &&
                whatsappConfig?.phoneNumber &&
                onWhatsAppClick && (
                  <button
                    onClick={onWhatsAppClick}
                    className='input-btn'
                    title='Connect on WhatsApp'
                  >
                    <MessageCircle color='#25D366' size={20} />
                  </button>
                )}

              {/* Voice input button */}
              <button onClick={startListening} className='input-btn'>
                <Mic color='var(--text-primary)' size={20} />
              </button>

              {/* Send button */}
              <button
                onClick={handleSend}
                className={`send-btn ${
                  (message.length === 0 || !isConversationActive || loading) &&
                  'disabled'
                }`}
                disabled={!isConversationActive || loading}
              >
                <SendHorizontal size={20} />
              </button>
            </>
          )}
        </>
      ) : (
        // Voice recording mode
        <div
          className='voice-mode'
          style={{ display: 'flex', alignItems: 'center', width: '100%' }}
        >
          <button
            className='voice-btn cancel'
            onClick={cancelListening}
            style={{ marginRight: '10px' }}
          >
            <X size={22} color='white' />
          </button>

          <div className='waveform'>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <button
            className='voice-btn stop'
            onClick={stopListening}
            style={{ marginLeft: '10px' }}
          >
            <Square
              fill={chatbot_config.primaryColor}
              size={22}
              color={chatbot_config.primaryColor}
            />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && isConversationActive && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: '20px',
            zIndex: 1000,
            transform: 'scale(0.8)',
            transformOrigin: 'bottom right',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <EmojiPicker
            onEmojiClick={(emojiData: any) => {
              setMessage((prev) => prev + emojiData.emoji);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ChatInput;
