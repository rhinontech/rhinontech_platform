"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useUserStore } from "@/utils/store";

interface IncomingCall {
    from: string; // Socket ID
    fromCallId: string; // User ID/Email
    fromName?: string;
}

interface CallContextType {
    isInCall: boolean;
    isCalling: boolean; // Outgoing ringing
    incomingCall: IncomingCall | null;
    callDuration: string;
    isMuted: boolean;
    isSpeakerOn: boolean;
    toggleMute: () => void;
    toggleSpeaker: () => void;
    startCall: (targetVisitorId: string) => Promise<void>;
    endCall: () => void;
    acceptCall: () => void;
    rejectCall: () => void;
}

const CallContext = createContext<CallContextType>({} as CallContextType);

// Config
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";
const ICE_SERVERS = {
    iceServers: [
        {
            urls: [
                "stun:3.109.172.202:3478",
                "turn:3.109.172.202:3478?transport=udp",
                "turn:3.109.172.202:3478?transport=tcp",
            ],
            username: "rhinon",
            credential: "rtWebRtc@123",
        },
    ],
};

export function CallProvider({ children }: { children: React.ReactNode }) {
    const userEmail = useUserStore((state) => state.userData.userEmail);

    // State
    const [isInCall, setIsInCall] = useState(false);
    const [isCalling, setIsCalling] = useState(false); // Outgoing
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

    const [callStartTime, setCallStartTime] = useState<number | null>(null);
    const [callDuration, setCallDuration] = useState("00:00");
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    // Create global audio element for remote stream
    useEffect(() => {
        if (!remoteAudioRef.current) {
            const audio = new Audio();
            audio.autoplay = true;
            remoteAudioRef.current = audio;
            document.body.appendChild(audio); // Append to body to ensure it plays
        }
        return () => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.remove();
                remoteAudioRef.current = null;
            }
        };
    }, []);


    // ========== SOCKET SETUP ==========
    useEffect(() => {
        if (!SOCKET_URL) return;

        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Global Socket connected:", socket.id);
            if (userEmail) {
                socket.emit("register_manual", {
                    callId: userEmail,
                    username: "Agent", // Or user's name
                });
                console.log(`🎧 Auto-registered Agent: ${userEmail}`);
            }
        });

        socket.on("registered_manual", ({ callId }) => {
            console.log("Registered manual (Provider):", callId);
        });

        // --- Outgoing Call Events ---
        socket.on("call_accepted_manual", async ({ from }) => {
            console.log("Call accepted by user:", from);
            setIsCalling(false); // Stop ringing UI
            startPeerConnection(from, true); // Initiator = true
        });

        socket.on("call_rejected_manual", () => {
            console.log("Call rejected");
            setIsCalling(false);
            toast.info("Call was rejected by the user.");
            cleanupMedia();
        });

        // --- Incoming Call Events (Agent receiving call?) ---
        // If Agents can receive calls, handle 'call_request_manual' here.
        socket.on("call_request_manual", ({ from, fromName, fromCallId }) => {
            console.log("Incoming call:", from);
            setIncomingCall({ from, fromName, fromCallId });
        });

        socket.on("call_ended_manual", () => {
            console.log("Remote ended call");
            endCall(false); // false = don't emit end_call again if remote did it
        });

        // --- WebRTC Signaling ---
        socket.on("offer_manual", async ({ offer, from }) => {
            // Only accept offer if we are expecting one (e.g. we accepted call)
            // Or if we auto-accept? For now, assume this flows after 'acceptCall' for incoming
            // OR if we are answering.
            // Note: In the SDK, the caller sends offer immediately?
            // Let's handle it via startPeerConnection logic if feasible.

            // If we are NOT in a call and NOT incoming, this is weird.
            // But if we accepted an incoming call, we might trigger logic there.

            // Actually 'startPeerConnection' handles the offer processing if we pass it.
            // We'll call it differently.
            // If we are the Callee, we wait for Offer after Accept? 
            // Standard WebRTC: Caller creates Offer. Callee receives Offer.
            console.log("Received Offer from:", from);
            startPeerConnection(from, false, offer);
        });

        socket.on("answer_manual", async ({ answer }) => {
            if (peerRef.current) {
                console.log("Received Answer");
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on("ice_candidate_manual", ({ candidate }) => {
            if (!candidate || !peerRef.current) return;
            const ice = new RTCIceCandidate(candidate);
            if (!peerRef.current.remoteDescription) {
                pendingCandidatesRef.current.push(ice);
            } else {
                peerRef.current.addIceCandidate(ice).catch(console.error);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [userEmail]);

    // ========== TIMER ==========
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isInCall && callStartTime) {
            interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
                const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
                const s = String(elapsed % 60).padStart(2, "0");
                setCallDuration(`${m}:${s}`);
            }, 1000);
        } else {
            setCallDuration("00:00");
        }
        return () => clearInterval(interval);
    }, [isInCall, callStartTime]);


    // ========== ACTIONS ==========

    const startCall = async (targetVisitorId: string) => {
        if (!socketRef.current) {
            toast.error("Connection not ready");
            return;
        }
        if (!targetVisitorId) {
            toast.error("Invalid user ID");
            return;
        }

        // 1. Get Media
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream; // Store for later usage
        } catch (err) {
            console.error("Mic error:", err);
            toast.error("Microphone access denied");
            return;
        }

        // 2. State Update
        setIsCalling(true); // Ringing
        setIsInCall(false);
        setCallDuration("00:00");

        console.log(`📞 Calling ${targetVisitorId}...`);
        socketRef.current.emit("call_user_manual", { targetCallId: targetVisitorId });
    };

    const acceptCall = async () => {
        if (!incomingCall || !socketRef.current) return;
        const { from } = incomingCall;

        // 1. Get Media
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
        } catch (err) {
            console.error(err);
            toast.error("Mic access failed");
            return;
        }

        setIncomingCall(null);

        // 2. Notify Sender
        socketRef.current.emit("call_accepted_manual", { to: from });
        // Wait for Offer... (or if we are Callee, do we wait? Logic varies. 
        // In ChatInfoSidebar: socket.on('call_accepted') -> startPeerConnection(true).
        // Wait, if Agent Calls User: Agent is Caller (true).
        // If User Calls Agent: Agent is Callee.
        // If Callee, we usually wait for Offer?
        // Let's see Messenger.tsx logic: Messenger (User) emits 'call_user_manual'. Agent receives 'call_request_manual'. Agent accepts -> emits 'call_accepted_manual'.
        // Messenger receives 'call_accepted_manual' -> calls startPeerConnection(true). 
        // So Messenger (User) creates Offer. Agent (Agent) receives Offer.
        // So Agent just waits for 'offer_manual'.
    };

    const rejectCall = () => {
        if (!incomingCall || !socketRef.current) return;
        socketRef.current.emit("call_rejected_manual", { to: incomingCall.from });
        setIncomingCall(null);
        cleanupMedia();
    };

    const endCall = (notifyRemote = true) => {
        if (notifyRemote && socketRef.current) {
            socketRef.current.emit("end_call_manual");
        }
        cleanupMedia();
        setIsInCall(false);
        setIsCalling(false);
        setIncomingCall(null);
        setCallStartTime(null);
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleSpeaker = () => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
            setIsSpeakerOn(!remoteAudioRef.current.muted);
        }
    };

    // ========== HELPERS ==========

    const cleanupMedia = () => {
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        pendingCandidatesRef.current = [];
    };

    const startPeerConnection = async (remoteSocketId: string, isInitiator: boolean, remoteOffer?: RTCSessionDescriptionInit) => {
        const socket = socketRef.current;
        if (!socket) return;

        const peer = new RTCPeerConnection(ICE_SERVERS);
        peerRef.current = peer;

        // Add Local Stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => peer.addTrack(t, localStreamRef.current!));
        }

        // Handle Remote Stream
        peer.ontrack = (e) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = e.streams[0];
            }
        };

        // Handle ICE
        peer.onicecandidate = (e) => {
            if (e.candidate) {
                socket.emit("ice_candidate_manual", { candidate: e.candidate, to: remoteSocketId });
            }
        };

        if (isInitiator) {
            // Create Offer
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit("offer_manual", { offer, to: remoteSocketId });
        } else if (remoteOffer) {
            // Answer Offer
            await peer.setRemoteDescription(new RTCSessionDescription(remoteOffer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("answer_manual", { answer, to: remoteSocketId });

            // Process pending ICE
            for (const c of pendingCandidatesRef.current) {
                await peer.addIceCandidate(c);
            }
            pendingCandidatesRef.current = [];
        }

        setIsInCall(true);
        setCallStartTime(Date.now());
    };


    return (
        <CallContext.Provider value={{
            isInCall,
            isCalling,
            incomingCall,
            callDuration,
            isMuted,
            isSpeakerOn,
            toggleMute,
            toggleSpeaker,
            startCall,
            endCall,
            acceptCall,
            rejectCall
        }}>
            {children}
        </CallContext.Provider>
    );
}

export const useCallContext = () => useContext(CallContext);
