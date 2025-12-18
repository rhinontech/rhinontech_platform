// Re-export all components from a single entry point

// Chat components
export { ChatHeader } from './Chat/ChatHeader';
export type { ChatHeaderProps } from './Chat/ChatHeader';

export { MessageItem } from './Chat/MessageItem';
export type { MessageItemProps } from './Chat/MessageItem';

export { TypingIndicator } from './Chat/TypingIndicator';
export type { TypingIndicatorProps } from './Chat/TypingIndicator';

export { ChatInput } from './Chat/ChatInput';
export type { ChatInputProps } from './Chat/ChatInput';

export { ActionButtons } from './Chat/ActionButtons';
export type { ActionButtonsProps } from './Chat/ActionButtons';

// Form components
export { PreChatForm } from './Forms/PreChatForm';
export type { PreChatFormProps } from './Forms/PreChatForm';

export { PostChatForm } from './Forms/PostChatForm';
export type { PostChatFormProps } from './Forms/PostChatForm';

// Modal components
export { WhatsAppQRModal } from './Modals/WhatsAppQRModal';
export type { WhatsAppQRModalProps } from './Modals/WhatsAppQRModal';

// Utility components
export { StarRating } from './StarRating/StarRating';
export type { StarRatingProps } from './StarRating/StarRating';

export { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';
