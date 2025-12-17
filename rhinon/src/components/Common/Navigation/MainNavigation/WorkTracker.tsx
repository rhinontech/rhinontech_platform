"use client";

import React, { useEffect, useState } from "react";
import { useWorkStore } from "@/store/useWorkStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Clock,
    Play,
    Pause,
    Square,
    Coffee,
    History,
    CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const WorkTracker = () => {
    const {
        status,
        startTime,
        breakStartTime,
        totalWorkedSeconds,
        totalBreakSeconds,
        sessions,
        dailyGoalSeconds,
        startWork,
        pauseWork,
        resumeWork,
        stopWork,
    } = useWorkStore();

    const [elapsed, setElapsed] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const updateTimer = () => {
            const now = new Date();
            if (status === "working" && startTime) {
                const currentSessionSeconds = Math.floor(
                    (now.getTime() - new Date(startTime).getTime()) / 1000
                );
                setElapsed(totalWorkedSeconds + currentSessionSeconds);
            } else if (status === "break" && breakStartTime) {
                // For break, we might want to show break duration or keep showing work duration
                // Let's show total work duration static, and maybe break duration somewhere else
                setElapsed(totalWorkedSeconds);
            } else {
                setElapsed(totalWorkedSeconds);
            }
        };

        updateTimer(); // Initial call
        interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [status, startTime, breakStartTime, totalWorkedSeconds]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const progress = Math.min((elapsed / dailyGoalSeconds) * 100, 100);
    const isGoalReached = elapsed >= dailyGoalSeconds;

    // Calculate current break time if on break
    const [currentBreakTime, setCurrentBreakTime] = useState(0);
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "break" && breakStartTime) {
            interval = setInterval(() => {
                const now = new Date();
                const diff = Math.floor(
                    (now.getTime() - new Date(breakStartTime).getTime()) / 1000
                );
                setCurrentBreakTime(totalBreakSeconds + diff);
            }, 1000);
        } else {
            setCurrentBreakTime(totalBreakSeconds);
        }
        return () => clearInterval(interval);
    }, [status, breakStartTime, totalBreakSeconds]);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "relative h-9 w-9 rounded-full transition-all duration-300 mr-2",
                        status === "working"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : status === "break"
                                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "hover:bg-muted"
                    )}
                >
                    <Clock className="h-4 w-4" />
                    {status !== "idle" && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span
                                className={cn(
                                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                    status === "working" ? "bg-green-400" : "bg-yellow-400"
                                )}
                            ></span>
                            <span
                                className={cn(
                                    "relative inline-flex rounded-full h-3 w-3",
                                    status === "working" ? "bg-green-500" : "bg-yellow-500"
                                )}
                            ></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 p-0 overflow-hidden border shadow-xl bg-background/95 backdrop-blur-sm border"
            >
                {/* Header Section with Progress Ring */}
                <div className="relative p-6 flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-transparent">
                    <div className="relative h-40 w-40 flex items-center justify-center">
                        {/* Progress Ring SVG */}
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                            <circle
                                className="text-muted stroke-current"
                                strokeWidth="8"
                                fill="transparent"
                                r="42"
                                cx="50"
                                cy="50"
                            />
                            <circle
                                className={cn(
                                    "stroke-current transition-all duration-1000 ease-in-out",
                                    isGoalReached
                                        ? "text-green-500"
                                        : status === "working"
                                            ? "text-primary"
                                            : status === "break"
                                                ? "text-yellow-500"
                                                : "text-primary/50"
                                )}
                                strokeWidth="8"
                                strokeLinecap="round"
                                fill="transparent"
                                r="42"
                                cx="50"
                                cy="50"
                                strokeDasharray="264"
                                strokeDashoffset={264 - (264 * progress) / 100}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold tabular-nums tracking-tight">
                                {formatTime(elapsed)}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                                {status === "idle"
                                    ? "Ready"
                                    : status === "working"
                                        ? "Working"
                                        : "On Break"}
                            </span>
                        </div>
                    </div>

                    {/* Break Timer (if applicable) */}
                    {(status === "break" || totalBreakSeconds > 0) && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                            <Coffee className="h-3 w-3" />
                            <span>Break: {formatTime(currentBreakTime)}</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 grid grid-cols-2 gap-3">
                    {status === "idle" ? (
                        <Button
                            className="col-span-2 h-12 text-base font-medium shadow-lg shadow-primary/20"
                            onClick={startWork}
                        >
                            <Play className="mr-2 h-4 w-4 fill-current" />
                            Clock In
                        </Button>
                    ) : (
                        <>
                            {status === "working" ? (
                                <Button
                                    variant="secondary"
                                    className="h-12 font-medium"
                                    onClick={pauseWork}
                                >
                                    <Coffee className="mr-2 h-4 w-4" />
                                    Take Break
                                </Button>
                            ) : (
                                <Button
                                    className="h-12 font-medium"
                                    onClick={resumeWork}
                                >
                                    <Play className="mr-2 h-4 w-4 fill-current" />
                                    Resume
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                className="h-12 font-medium shadow-lg shadow-destructive/20"
                                onClick={stopWork}
                            >
                                <Square className="mr-2 h-4 w-4 fill-current" />
                                Clock Out
                            </Button>
                        </>
                    )}
                </div>

                {/* Session History */}
                <div className="border-t bg-muted/30">
                    <div className="px-4 py-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <History className="h-3 w-3" /> Today's Sessions
                        </span>
                        <span>{sessions.length} sessions</span>
                    </div>
                    <ScrollArea className="h-32">
                        <div className="px-4 pb-4 space-y-2">
                            {sessions.length === 0 ? (
                                <div className="text-center py-4 text-xs text-muted-foreground">
                                    No sessions yet today.
                                </div>
                            ) : (
                                [...sessions].reverse().map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between text-xs p-2 rounded-md bg-background border shadow-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    session.type === "work"
                                                        ? "bg-green-500"
                                                        : "bg-yellow-500"
                                                )}
                                            />
                                            <span className="font-medium capitalize">
                                                {session.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <span>
                                                {new Date(session.startTime).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                            {session.duration > 0 && (
                                                <span className="font-mono">
                                                    {formatTime(session.duration)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default WorkTracker;
