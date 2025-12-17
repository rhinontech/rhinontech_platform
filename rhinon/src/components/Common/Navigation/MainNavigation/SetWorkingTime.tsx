import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, Coffee, Play, RotateCcw, Square } from "lucide-react"
import { motion } from "framer-motion"

export default function WorkTrackerDropdown() {
  const [punchInTime, setPunchInTime] = useState<Date | null>(null)
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null)
  const [workingSeconds, setWorkingSeconds] = useState(0)

  const [totalWorkedSeconds, setTotalWorkedSeconds] = useState(0)

  const [breakStart, setBreakStart] = useState<Date | null>(null)
  const [breakSeconds, setBreakSeconds] = useState(0)


  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (punchInTime && !punchOutTime) {
        const now = new Date()
        const sessionSeconds = Math.floor((now.getTime() - punchInTime.getTime()) / 1000)
        setWorkingSeconds(totalWorkedSeconds + sessionSeconds)
      }

      if (breakStart) {
        setBreakSeconds((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [punchInTime, punchOutTime, breakStart, totalWorkedSeconds])

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const handlePunchIn = () => {
    setPunchInTime(new Date())
    setPunchOutTime(null)
  }

  const handlePunchOut = () => {
    if (punchInTime) {
      const now = new Date()
      const sessionSeconds = Math.floor((now.getTime() - punchInTime.getTime()) / 1000)
      setTotalWorkedSeconds((prev) => prev + sessionSeconds)
    }

    if (breakStart) {
      setBreakStart(null)
    }
    setPunchOutTime(new Date())
  }

  const handleBreakToggle = () => {
    setBreakStart(breakStart ? null : new Date())
  }


  const effectiveWorkSeconds = Math.max(
    workingSeconds - breakSeconds,
    0
  )

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full mr-2"
              >
                <Clock />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Work Tracker</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent
        side="bottom"
        align="end"
        sideOffset={4}
        className="w-80 relative z-[2000] p-4 space-y-4"
      >
        {/* Timers */}
        <div className="flex justify-between text-sm">
          <span>Working:</span>
          <span>{formatTime(workingSeconds)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Break:</span>
          <span>{formatTime(breakSeconds)}</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {!punchInTime && !punchOutTime ? (
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
              <Button onClick={handlePunchIn} className="w-full gap-2">
                <Play size={16} />
                Clock In
              </Button>
            </motion.div>
          ) : punchOutTime ? (
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
              <Button onClick={handlePunchIn} className="w-full gap-2">
                <RotateCcw size={16} />
                Clock In Again
              </Button>
            </motion.div>
          ) : (
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
              <Button
                variant="destructive"
                onClick={handlePunchOut}
                className="w-full gap-2"
              >
                <Square fill="white" size={16} />
                Clock Out
              </Button>
            </motion.div>
          )}

          {punchInTime && !punchOutTime && (
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
              <Button
                variant={breakStart ? "destructive" : "outline"}
                onClick={handleBreakToggle}
                className="w-full gap-2"
              >
                <Coffee size={16} />
                {breakStart ? "End Break" : "Break"}
              </Button>
            </motion.div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
