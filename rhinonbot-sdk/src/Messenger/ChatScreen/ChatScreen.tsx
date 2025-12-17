import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react/dist';
import './ChatScreen.scss';
import RaiseTicket from '../TicketScreen/RaiseTicket';
import Loader from '../Loader/Loader';
import { useChatLogic } from './useChatLogic';
import {
  getWhatsAppConfig,
  checkCustomerPhone,
} from '@tools/services/chatbotConfigService';
import {
  ChatHeader,
  MessageItem,
  TypingIndicator,
  ActionButtons,
  ChatInput,
  PreChatForm,
  PostChatForm,
} from './ChatComponents';

// ====== Interfaces ======
interface Message {
  id?: number;
  text: string;
  role:
  | 'user'
  | 'bot'
  | 'separator'
  | 'support'
  | 'trigger'
  | 'timeout'
  | 'whatsapp_qr'
  | 'phone_request'
  | 'whatsapp_trigger';
  timestamp: string;
  user_email?: string;
  user_id?: string;
  chatbot_id?: string;
  chatbot_history?: string;
  isEmailForm?: boolean;
  sender_name?: string;
  sender_image?: string;
}

interface TicketField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder: string;
}

interface ChatScreenProps {
  isAdmin: boolean;
  isFreePlan?: boolean;
  onNavigate: (screen: string) => void;
  chatName?: string;
  chatAvatar?: string;
  userId: string;
  userEmail: string;
  setUserEmail: React.Dispatch<React.SetStateAction<string>>;
  appId: string;
  preChatForm: any;
  postChatForm: any;
  raiseTicket: () => void;
  conversationId: string;
  onBack?: () => void;
  isEmailAvailable: boolean;
  setIsEmailAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  isSpeakingWithRealPerson: boolean;
  setIsSpeakingWithRealPerson: React.Dispatch<React.SetStateAction<boolean>>;
  timeoutDuration?: number;
  onConversationTimeout?: () => void;
  chatbot_config: any;
  setIsTicketRaised: React.Dispatch<React.SetStateAction<boolean>>;
  ticketForm: TicketField[];
  setWindowWidth: React.Dispatch<React.SetStateAction<string>>;
  adminTestingMode?: boolean;
}

// ====== Main ChatScreen Component ======
const ChatScreen: React.FC<ChatScreenProps> = (props) => {
  const {
    isAdmin,
    isFreePlan,
    onNavigate,
    onBack,
    userId,
    userEmail,
    setUserEmail,
    appId,
    isSpeakingWithRealPerson,
    setIsSpeakingWithRealPerson,
    conversationId,
    isEmailAvailable,
    setIsEmailAvailable,
    preChatForm,
    postChatForm,
    chatAvatar = 'https://img.freepik.com/premium-photo/beautiful-woman-with-natural-makeup-women-with-clean-fresh-skin-dark-hear-blue-eyes_150254-452.jpg?semt=ais_hybrid&w=740',
    timeoutDuration = 15 * 60 * 1000,
    onConversationTimeout,
    chatbot_config,
    setIsTicketRaised,
    ticketForm,
    setWindowWidth,
    adminTestingMode,
  } = props;

  // Custom hook for all business logic
  const chatLogic = useChatLogic({
    userId,
    userEmail,
    appId,
    conversationId,
    isAdmin,
    chatAvatar,
    chatbot_config,
    timeoutDuration,
    onConversationTimeout,
    setUserEmail,
    setIsEmailAvailable,
    isSpeakingWithRealPerson,
    setIsSpeakingWithRealPerson,
    onBack,
    setWindowWidth,
    postChatForm,
    isEmailAvailable,
    preChatForm,
    adminTestingMode,
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
  } = chatLogic;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [openTicket, setOpenTicket] = useState(false);
  const [maxScreen, setMaxScreen] = useState<boolean>(false);
  const [closeChatPopup, setCloseChatPopup] = useState<boolean>(false);

  // WhatsApp State
  const [whatsappConfig, setWhatsappConfig] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch WhatsApp Config
  useEffect(() => {
    const fetchWhatsApp = async () => {
      if (appId) {
        const config = await getWhatsAppConfig(appId);
        if (config) {
          setWhatsappConfig(config);
        }
      }
    };
    fetchWhatsApp();
  }, [appId]);

  const [isRegistered, setIsRegistered] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [incomingCall, setIncomingCall] = useState<null | {
    from: string;
    fromName: string;
    fromCallId: string;
  }>(null);
  const [isInCall, setIsInCall] = useState(false);

  // --- Audio control states ---
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // ====== Voice Call Listener ======
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log(' Connected:', newSocket.id);

      // Auto-register with userId as callId
      if (userId) {
        newSocket.emit('register_manual', {
          callId: userId,
          username: 'Visitor',
        });
        console.log(`Auto-registering Visitor with ID: ${userId}`);
      }
    });

    newSocket.on('registered_manual', ({ callId }) => {
      setIsRegistered(true);
      console.log(`Registered with Call ID: ${callId}`);
    });

    // Incoming call
    newSocket.on('call_request_manual', ({ from, fromName, fromCallId }) => {
      console.log(`Incoming call from ${fromName} (${fromCallId})`);
      setIncomingCall({ from, fromName, fromCallId });
    });

    // ICE + offer handlers
    newSocket.on('offer_manual', async ({ offer, from }) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(offer),
      );
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      newSocket.emit('answer_manual', { answer, to: from });
    });

    newSocket.on('ice_candidate_manual', ({ candidate }) => {
      if (peerRef.current)
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    newSocket.on('call_ended_manual', () => {
      console.log('Call ended by other side');
      setIsInCall(false);
      setIncomingCall(null);
      setCallStartTime(null);

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const handleAcceptCall = async () => {
    if (!incomingCall || !socket) return;
    const { from } = incomingCall;

    console.log('Accepting call from:', from);

    // Step 1: Ask for microphone permission FIRST
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Please allow microphone access to accept the call.');
      return;
    }

    // Step 2: Only after permission granted — proceed with connection
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            'stun:3.109.172.202:3478',
            'turn:3.109.172.202:3478?transport=udp',
            'turn:3.109.172.202:3478?transport=tcp',
          ],
          username: 'rhinon',
          credential: 'rtWebRtc@123',
        },
      ],
    });
    peerRef.current = peer;

    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate)
        socket.emit('ice_candidate_manual', {
          candidate: e.candidate,
          to: from,
        });
    };

    peer.ontrack = (e) => {
      console.log('Remote audio received:', e.streams[0]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.autoplay = true;
      } else {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.autoplay = true;
        audio.muted = false;
        document.body.appendChild(audio);
        remoteAudioRef.current = audio;
      }
    };

    // Step 3: Update state & notify server
    setIncomingCall(null);
    setIsInCall(true);
    setCallStartTime(Date.now());
    setIsMuted(false);
    setIsSpeakerOn(true);

    socket.emit('call_accepted_manual', { to: from });
  };

  const handleRejectCall = () => {
    if (!incomingCall || !socket) return;
    const { from } = incomingCall;
    console.log('Rejected call from:', from);
    socket.emit('call_rejected_manual', { to: from });
    setIncomingCall(null);

    // Stop mic if it was accessed
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const handleEndCall = () => {
    console.log('Ending call...');

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.muted = false;
    }

    if (socket) socket.emit('end_call_manual');

    setIsInCall(false);
    setCallStartTime(null);
    setIsMuted(false);
    setIsSpeakerOn(true);
    console.log('Call ended and audio reset');
  };

  // ====== Call Timer ======
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall && callStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        setCallDuration(`${minutes}:${seconds}`);
      }, 1000);
    } else {
      setCallDuration('00:00');
    }
    return () => clearInterval(interval);
  }, [isInCall, callStartTime]);

  // ====== Auto-scroll on new messages ======
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, message]);

  // ====== Fetch chats on conversation change ======
  useEffect(() => {
    if (
      conversationId &&
      lastFetchedConversationIdRef.current !== conversationId
    ) {
      lastFetchedConversationIdRef.current = conversationId;
      fetchChats();
    }
  }, [conversationId]);

  // ====== Typing indicator logic ======
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (loading && !isSpeakingWithRealPerson) {
      timer = setTimeout(() => {
        setShowTyping(true);
      }, 500);
    } else {
      setShowTyping(false);
    }

    return () => clearTimeout(timer);
  }, [loading, isSpeakingWithRealPerson]);

  useEffect(() => {
    if (showTyping && typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [showTyping]);

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
          chatbot_id: appId,
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
            chatbot_id: appId,
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

          chatLogic.setChatMessages((prev) => [...prev, incoming]);
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
  }, [isSpeakingWithRealPerson, userId, appId, convoId, isConversationActive]);

  const handlePhoneSubmitted = () => {
    if (!whatsappConfig) return;

    chatLogic.setChatMessages((prev) => {
      const messages = [...prev];
      const lastIndex = messages.length - 1;

      // If the last message was the phone request, replace it with QR
      if (messages[lastIndex]?.role === 'phone_request') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          role: 'whatsapp_qr',
          text: JSON.stringify(whatsappConfig),
          timestamp: new Date().toISOString(),
        };
        return messages;
      }

      // Otherwise append QR message
      return [
        ...messages,
        {
          role: 'whatsapp_qr',
          text: JSON.stringify(whatsappConfig),
          timestamp: new Date().toISOString(),
        },
      ];
    });
  };

  // ====== Handle WhatsApp Trigger Messages ======
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    const secondLastMessage = chatMessages[chatMessages.length - 2];

    if (lastMessage?.role === 'whatsapp_trigger' && whatsappConfig) {
      // Trigger phone validation flow
      const handleWhatsAppTrigger = async () => {
        const email = chatLogic.userEmail;
        if (!email) {
          console.error('No email found for customer');
          return;
        }

        const data = await checkCustomerPhone(email);

        if (data && data.hasPhone && data.phoneNumber) {
          // Has phone - show WhatsApp QR directly
          chatLogic.setChatMessages((prev: Message[]) => [
            ...prev,
            {
              role: 'whatsapp_qr',
              text: JSON.stringify(whatsappConfig),
              timestamp: new Date().toISOString(),
            },
          ]);
        } else {
          // No phone - ask for phone number first
          chatLogic.setChatMessages((prev: Message[]) => [
            ...prev,
            {
              role: 'support',
              text: 'To connect on WhatsApp, please provide your phone number (with country code, e.g., +1234567890):',
              timestamp: new Date().toISOString(),
            },
            {
              role: 'phone_request',
              text: 'waiting_for_phone',
              timestamp: new Date().toISOString(),
              user_email: email,
            },
          ]);
        }
      };

      handleWhatsAppTrigger();
    }

    // Check if phone was just submitted (phone_request followed by user message or after delay)
    if (secondLastMessage?.role === 'phone_request' && whatsappConfig) {
      // Re-check phone and show QR if now available
      const checkPhoneAndShowQR = async () => {
        const email = chatLogic.userEmail;
        if (!email) return;

        const data = await checkCustomerPhone(email);

        if (data && data.hasPhone && data.phoneNumber) {
          // Phone was saved, show QR
          chatLogic.setChatMessages((prev: Message[]) => {
            // Only add QR if not already present
            const hasQR = prev.some((m) => m.role === 'whatsapp_qr');
            if (hasQR) return prev;

            return [
              ...prev,
              {
                role: 'whatsapp_qr',
                text: JSON.stringify(whatsappConfig),
                timestamp: new Date().toISOString(),
              },
            ];
          });
        }
      };

      // Small delay to ensure phone is saved
      setTimeout(checkPhoneAndShowQR, 1000);
    }
  }, [chatMessages, whatsappConfig]);

  // ====== Scroll to bottom on new messages ======
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, message]);

  // ====== Fetch chats on conversation change ======
  useEffect(() => {
    if (
      conversationId &&
      lastFetchedConversationIdRef.current !== conversationId
    ) {
      lastFetchedConversationIdRef.current = conversationId;
      fetchChats();
    }
  }, [conversationId]);

  // ====== Typing indicator logic ======
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (loading && !isSpeakingWithRealPerson) {
      timer = setTimeout(() => {
        setShowTyping(true);
      }, 2000);
    } else {
      setShowTyping(false);
    }

    return () => clearTimeout(timer);
  }, [loading, isSpeakingWithRealPerson]);

  useEffect(() => {
    if (showTyping && typingRef.current) {
      typingRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [showTyping]);

  if (isfetching) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loader />
      </div>
    );
  }

  return (
    <div
      className='chat-screen'
      onClick={() => {
        setShowEmojiPicker(false);
        setCloseChatPopup(false);
      }}
      style={{ position: 'relative' }}
    >
      {incomingCall && (
        <div
          className='incoming-call-overlay'
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            padding: '20px 30px',
            zIndex: 1000,
            textAlign: 'center',
            width: '280px',
          }}
        >
          <h3 className='text-lg font-semibold mb-2'
            style={{
              color: 'black',
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: ' 0.5rem',
            }}
          >📞 Incoming Call</h3>
          <p className='text-sm text-gray-700 mb-4'
            style={{
              fontSize: "0.875rem",   // text-sm
              color: "#374151",       // text-gray-700
              marginBottom: "1rem",   // mb-4
            }}
          >
            {incomingCall.fromName || 'Unknown Caller'} (
            {incomingCall.fromCallId})
          </p>
          <div className='flex justify-center gap-3'
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <button
              onClick={handleAcceptCall}
              style={{
                background: '#10b981',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
              }}
            >
              ✅ Accept
            </button>
            <button
              onClick={handleRejectCall}
              style={{
                background: '#ef4444',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
              }}
            >
              ❌ Reject
            </button>
          </div>
        </div>
      )}

      {/* ====== In-Call Overlay ====== */}
      {isInCall && (
        <div
          className='in-call-overlay'
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#f9fafb',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            padding: '16px 24px',
            zIndex: 1000,
            textAlign: 'center',
            width: '280px',
          }}
        >
          <h4 className='font-semibold text-gray-800 mb-1'
            style={{
              fontWeight: 600,        // font-semibold
              color: "#1F2937",       // text-gray-800
              marginBottom: "4px" // mb-1
            }}

          >🎧 In Call</h4>
          <p className='text-sm text-gray-600 mb-2'
            style={{
              fontSize: "14px",
              color: "#4B5563",
              marginBottom: "8px",
            }}
          >Duration: {callDuration}</p>

          {/* Mute & Speaker Controls */}
          <div className='flex justify-center gap-2 mb-3'
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <button
              onClick={() => {
                if (localStreamRef.current) {
                  localStreamRef.current.getAudioTracks().forEach((t) => {
                    t.enabled = !t.enabled;
                  });
                  setIsMuted((prev) => !prev);
                }
              }}
              style={{
                flex: 1,
                background: isMuted ? '#fee2e2' : '#dcfce7',
                color: isMuted ? '#b91c1c' : '#166534',
                borderRadius: '8px',
                padding: '6px 10px',
                fontWeight: 600,
              }}
            >
              {isMuted ? '🔇 Unmute' : '🎤 Mute'}
            </button>

            <button
              onClick={() => {
                setIsSpeakerOn((prev) => {
                  const newVal = !prev;
                  if (remoteAudioRef.current)
                    remoteAudioRef.current.muted = !newVal;
                  return newVal;
                });
              }}
              style={{
                flex: 1,
                background: isSpeakerOn ? '#dcfce7' : '#e5e7eb',
                color: isSpeakerOn ? '#166534' : '#374151',
                borderRadius: '8px',
                padding: '6px 10px',
                fontWeight: 600,
              }}
            >
              {isSpeakerOn ? '🔊 Speaker On' : '🔈 Speaker Off'}
            </button>
          </div>

          <button
            onClick={handleEndCall}
            style={{
              background: '#ef4444',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              width: '100%',
            }}
          >
            🔴 End Call
          </button>
        </div>
      )}

      {/* Header */}
      <ChatHeader
        onBack={onBack}
        isFreePlan={isFreePlan}
        isAdmin={isAdmin}
        onNavigate={onNavigate}
        setWindowWidth={setWindowWidth}
        setMaxScreen={setMaxScreen}
        supportName={supportName}
        supportImage={supportImage}
        isSpeakingWithRealPerson={isSpeakingWithRealPerson}
        isConversationClosed={isConversationClosed}
        isConversationActive={isConversationActive}
        maxScreen={maxScreen}
        closeChatPopup={closeChatPopup}
        setCloseChatPopup={setCloseChatPopup}
        handleCloseChat={handleCloseChat}
        chatbot_config={chatbot_config}
        adminTestingMode={adminTestingMode}
      />

      {/* Messages */}
      <div className='messages-container'>
        {chatMessages.map((msg, index) => (
          <MessageItem
            key={index}
            msg={msg}
            index={index}
            supportImage={supportImage}
            chatbot_config={chatbot_config}
            onPhoneSubmitted={handlePhoneSubmitted}
          />
        ))}
        {showTyping && (
          <TypingIndicator
            supportImage={supportImage}
            chatbot_config={chatbot_config}
            typingRef={typingRef}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Raise Ticket Modal */}
      {openTicket && !isAdmin && (
        <div className='overlay' onClick={(e) => setOpenTicket(false)}>
          <RaiseTicket
            setOpenTicket={setOpenTicket}
            appId={appId}
            setIsTicketRaised={setIsTicketRaised}
            chatbot_config={chatbot_config}
            ticketForm={ticketForm}
          />
        </div>
      )}

      {/* Pre-Chat Form */}
      {!isAdmin &&
        !isEmailAvailable &&
        !isSpeakingWithRealPerson &&
        preChatForm && (
          <PreChatForm
            preChatForm={preChatForm}
            isConversationActive={isConversationActive}
            handleSaveEmail={handleSaveEmail}
            chatbot_config={chatbot_config}
          />
        )}

      {/* Post-Chat Form */}
      {openPostChatForm &&
        postChatForm &&
        postChatForm?.elements?.length !== 0 &&
        postChatForm?.enabled && (
          <PostChatForm
            postChatForm={postChatForm}
            handlePostFormSubmit={handlePostFormSubmit}
            chatbot_config={chatbot_config}
            handleCancel={() => setOpenPostChatForm(false)}
          />
        )}

      {/* Action Buttons */}
      <ActionButtons
        isConversationActive={isConversationActive}
        isAdmin={isAdmin}
        isSpeakingWithRealPerson={isSpeakingWithRealPerson}
        reachedLimit={reachedLimit}
        chatMessages={chatMessages}
        loading={loading}
        handleSwitchToRealPerson={handleSwitchToRealPerson}
        setOpenTicket={setOpenTicket}
        startNewConversation={startNewConversation}
        adminTestingMode={adminTestingMode}
        whatsappConfig={whatsappConfig}
        onWhatsAppClick={async () => {
          // Check if customer has phone number
          const email = chatLogic.userEmail;
          if (!email) {
            console.error('No email found for customer');
            return;
          }

          const data = await checkCustomerPhone(email);

          if (data && data.hasPhone && data.phoneNumber) {
            // Has phone - show WhatsApp QR directly
            chatLogic.setChatMessages((prev) => [
              ...prev,
              {
                role: 'whatsapp_qr',
                text: JSON.stringify(whatsappConfig),
                timestamp: new Date().toISOString(),
              },
            ]);
          } else {
            // No phone - ask for phone number first
            chatLogic.setChatMessages((prev) => [
              ...prev,
              {
                role: 'support',
                text: 'To connect on WhatsApp, please provide your phone number (with country code, e.g., +1234567890):',
                timestamp: new Date().toISOString(),
              },
              {
                role: 'phone_request',
                text: 'waiting_for_phone',
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }}
      />

      {/* Chat Input */}
      <ChatInput
        isAdmin={isAdmin}
        isConversationActive={isConversationActive}
        isConversationClosed={isConversationClosed}
        reachedLimit={reachedLimit}
        isListening={isListening}
        message={message}
        setMessage={setMessage}
        handleSend={handleSend}
        loading={loading}
        adminTestingMode={adminTestingMode}
        isSpeakingWithRealPerson={isSpeakingWithRealPerson}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        setShowEmojiPicker={setShowEmojiPicker}
        startListening={() => {
          setIsListening(true);
          startListening();
        }}
        cancelListening={cancelListening}
        stopListening={stopListening}
        chatbot_config={chatbot_config}
        showEmojiPicker={showEmojiPicker}
        EmojiPicker={EmojiPicker}
      />
    </div>
  );
};

export default ChatScreen;
