"use client";

import React from "react";
import { useCallContext } from "@/context/CallContext";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

export function GlobalCallWidget() {
    const {
        isInCall,
        isCalling,
        incomingCall,
        callDuration,
        isMuted,
        isSpeakerOn,
        toggleMute,
        toggleSpeaker,
        acceptCall,
        rejectCall,
        endCall,
    } = useCallContext();

    // Only render if something is happening
    if (!isInCall && !isCalling && !incomingCall) return null;

    return (
        <motion.div
            drag
            dragMomentum={false}
            className="fixed bottom-6 right-6 z-[9999] cursor-move"
        >
            <AnimatePresence mode="wait">
                {/* INCOMING CALL */}
                {incomingCall && !isInCall && (
                    <motion.div
                        key="incoming"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-6 w-[320px] flex flex-col items-center gap-4"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs uppercase tracking-widest font-bold text-gray-500 animate-pulse">
                                Incoming Call
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 text-center leading-tight">
                                {incomingCall.fromName || "User"}
                            </h3>
                            <span className="text-sm text-gray-500">{incomingCall.fromCallId}</span>
                        </div>

                        <div className="flex gap-6 mt-2">
                            <button
                                onClick={rejectCall}
                                title="Decline"
                                className="w-14 h-14 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-all shadow-lg hover:scale-105"
                            >
                                <PhoneOff size={24} />
                            </button>
                            <button
                                onClick={acceptCall}
                                title="Accept"
                                className="w-14 h-14 rounded-full bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-all shadow-lg hover:scale-105 animate-[pulse_1.5s_infinite]"
                            >
                                <Phone size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* OUTGOING RINGING */}
                {isCalling && (
                    <motion.div
                        key="outgoing"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white/90 backdrop-blur-md border border-yellow-200 shadow-2xl rounded-2xl p-6 w-[300px] flex flex-col items-center gap-4"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2 animate-pulse">
                                <Phone size={32} className="text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Calling...</h3>
                            <p className="text-sm text-gray-500">Waiting for response</p>
                        </div>

                        <button
                            onClick={() => endCall()}
                            className="w-full py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <PhoneOff size={16} /> Cancel
                        </button>
                    </motion.div>
                )}

                {/* ACTIVE CALL */}
                {isInCall && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white/95 backdrop-blur-md border border-green-200 shadow-2xl rounded-2xl p-6 w-[320px] flex flex-col items-center gap-4"
                    >
                        <div className="w-full flex flex-col items-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full mb-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-bold text-green-700">LIVE CALL</span>
                            </div>
                            <h3 className="text-3xl font-light text-gray-800 tabular-nums tracking-tighter">
                                {callDuration}
                            </h3>
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                            <button
                                onClick={toggleMute}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            <button
                                onClick={toggleSpeaker}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSpeakerOn ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>

                            <button
                                onClick={() => endCall()}
                                className="w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg hover:scale-105"
                            >
                                <PhoneOff size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
