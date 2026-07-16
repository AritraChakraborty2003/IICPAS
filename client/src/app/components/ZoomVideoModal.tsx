import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Mic,
  MicOff,
  VideoOff,
  Users,
  MessageSquare,
  Smile,
  Share,
  Shield,
  Sparkles,
  Maximize,
  PhoneOff,
  Settings,
  Volume2,
  Plus,
  Minus,
  MoreHorizontal,
} from "lucide-react";

interface ZoomVideoModalProps {
  isOpen: boolean;
  videoUrl: string | null;
  isLive: boolean;
  // When the live class actually started (ISO string or epoch ms). Playback
  // joins at the elapsed offset so late joiners don't watch from the top.
  liveStartTime?: string | number | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

function ZoomVideoModal({
  isOpen,
  videoUrl,
  isLive,
  liveStartTime,
  onClose,
  onShowToast,
}: ZoomVideoModalProps) {
  const introVideoRef = React.useRef<HTMLVideoElement>(null);
  const [isIntroVideoPlaying, setIsIntroVideoPlaying] = React.useState(true);
  const [isIntroVideoMuted, setIsIntroVideoMuted] = React.useState(false);
  const [introVideoCurrentTime, setIntroVideoCurrentTime] = React.useState(0);
  const [introVideoDuration, setIntroVideoDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);

  if (!isOpen || !videoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <style>{`
        #chatbot-floating-button, .chatbot-container {
          display: none !important;
        }
      `}</style>
      <div
        className="absolute inset-0 flex items-center justify-center bg-black"
        onClick={() => {
          if (isLive) {
            onShowToast("Cannot pause a live session");
            return;
          }
          const video = introVideoRef.current;
          if (!video) return;
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }}
      >
        {/* Top Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs font-bold tracking-wider text-white shadow-sm backdrop-blur-md">
            IICPA Workspace
          </span>
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded bg-red-600/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white"></span>
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded bg-emerald-600/90 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
              RECORDED
            </span>
          )}
        </div>

        <video
          key={videoUrl}
          ref={introVideoRef}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          autoPlay
          playsInline
          onContextMenu={(event) => event.preventDefault()}
          onPlay={() => setIsIntroVideoPlaying(true)}
          onPause={() => setIsIntroVideoPlaying(false)}
          onLoadedMetadata={(event) => {
            setIntroVideoDuration(event.currentTarget.duration || 0);
            if (isLive) {
              const fromProp = liveStartTime
                ? new Date(liveStartTime).getTime()
                : NaN;
              const startTime = !Number.isNaN(fromProp)
                ? fromProp
                : parseInt(
                    localStorage.getItem("mockLiveSessionStartTime") ||
                      Date.now().toString(),
                    10,
                  );
              const duration = event.currentTarget.duration || 0;
              const elapsedSeconds = (Date.now() - startTime) / 1000;
              if (elapsedSeconds > 0 && duration > 0) {
                // Late joiners land at the live position; if the class has
                // outrun the file, keep a few seconds before the end.
                event.currentTarget.currentTime = Math.min(
                  elapsedSeconds,
                  Math.max(duration - 5, 0),
                );
              }
            }
          }}
          onTimeUpdate={(event) =>
            setIntroVideoCurrentTime(event.currentTarget.currentTime)
          }
          className="h-full max-h-full w-full max-w-full object-contain bg-black"
        >
          <source src={videoUrl} />
          Your browser does not support the video tag.
        </video>

        <div className="absolute bottom-20 left-4 z-10 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm sm:bottom-24 sm:left-6 sm:px-3 sm:py-1.5 sm:text-sm">
          <MicOff className="h-3 w-3 text-red-500 sm:h-4 sm:w-4" />
          CA POONAM GUPTA IICPA
        </div>
      </div>

      {/* Zoom-style bottom control bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-3 pb-6 pt-12 sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={introVideoDuration || 0}
          step={0.1}
          value={introVideoCurrentTime}
          onChange={(event) => {
            if (isLive) return;
            const video = introVideoRef.current;
            const nextTime = Number(event.target.value);
            if (video) video.currentTime = nextTime;
            setIntroVideoCurrentTime(nextTime);
          }}
          className={`mb-2 h-1 w-full accent-sky-400 ${isLive ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          aria-label="Seek video"
          disabled={isLive}
        />
        <div className="flex items-center justify-between">
          {/* Left group */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                if (isLive) {
                  onShowToast("Cannot pause a live session");
                  return;
                }
                const video = introVideoRef.current;
                if (!video) return;
                if (video.paused) {
                  video.play();
                } else {
                  video.pause();
                }
              }}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors ${isLive ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"} sm:px-3`}
            >
              {isIntroVideoPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              <span className="text-[11px]">
                {isIntroVideoPlaying ? "Pause" : "Play"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsIntroVideoMuted((prev) => !prev);
              }}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 sm:px-3"
              aria-label={isIntroVideoMuted ? "Unmute" : "Mute"}
            >
              {isIntroVideoMuted ? (
                <MicOff className="h-5 w-5 text-red-500" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              <span className="text-[11px]">
                {isIntroVideoMuted ? "Unmute" : "Mute"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                onShowToast("Camera not available");
              }}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 sm:px-3"
            >
              <VideoOff className="h-5 w-5 text-red-500" />
              <span className="text-[11px]">Start Video</span>
            </button>
            <div className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors sm:px-3 hidden sm:flex">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isIntroVideoMuted ? 0 : volume}
                  onChange={(e) => {
                    const video = introVideoRef.current;
                    if (!video) return;
                    const newVol = parseFloat(e.target.value);
                    video.volume = newVol;
                    setVolume(newVol);
                    if (newVol === 0) {
                      video.muted = true;
                      setIsIntroVideoMuted(true);
                    } else if (video.muted) {
                      video.muted = false;
                      setIsIntroVideoMuted(false);
                    }
                  }}
                  className="w-16 h-1 accent-sky-400 cursor-pointer"
                  aria-label="Volume Control"
                />
              </div>
              <span className="text-[11px]">Sound</span>
            </div>
          </div>

          {/* Middle group */}
          <div className="flex flex-1 items-center justify-center gap-1 sm:gap-4 md:flex-wrap">
            <button
              type="button"
              onClick={() => {
                onShowToast("Cannot see participants now");
              }}
              className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 sm:flex sm:px-3"
              aria-label="Participants"
            >
              <Users className="h-5 w-5" />
              <span className="text-[11px]">Participants</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onShowToast("Chat not available");
              }}
              className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 sm:flex sm:px-3"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-[11px]">Chat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onShowToast("React not available");
              }}
              className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 md:flex sm:px-3"
            >
              <Smile className="h-5 w-5" />
              <span className="text-[11px]">React</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onShowToast("Screen share not available");
              }}
              className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 lg:flex sm:px-3"
            >
              <Share className="h-5 w-5 text-green-500" />
              <span className="text-[11px]">Share</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onShowToast("Host tools not available");
              }}
              className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 xl:flex sm:px-3"
            >
              <Shield className="h-5 w-5" />
              <span className="text-[11px]">Host tools</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onShowToast("Zoom AI not available");
              }}
              className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 2xl:flex sm:px-3"
            >
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span className="text-[11px]">Zoom AI</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const video = introVideoRef.current;
                if (!video) return;
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  video.requestFullscreen();
                }
              }}
              className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 sm:flex sm:px-3"
            >
              <Maximize className="h-5 w-5" />
              <span className="text-[11px]">Fullscreen</span>
            </button>
            {!isLive && <MoreVideoOptionsButton videoRef={introVideoRef} />}
          </div>

          {/* Right group */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-red-500 transition-colors hover:bg-white/10 sm:px-3"
              aria-label="End"
            >
              <PhoneOff className="h-5 w-5 rounded-full border border-red-500 p-0.5" />
              <span className="text-[11px] font-medium">End</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoreVideoOptionsButton({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);

  const handleSpeedChange = (newSpeed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
      setSpeed(newSpeed);
    }
  };

  const handleVolumeChange = (delta: number) => {
    if (videoRef.current) {
      const newVol = Math.max(0, Math.min(1, videoRef.current.volume + delta));
      videoRef.current.volume = newVol;
      setVolume(newVol);
    }
  };

  return (
    <div className="relative">
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-slate-800 p-2 shadow-xl border border-white/10 text-slate-200 text-sm z-50">
          <div className="mb-2 border-b border-white/10 pb-2">
            <div className="mb-1 font-semibold text-xs text-slate-400 text-left">
              Playback Speed
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`flex-1 rounded py-1 text-center transition-colors ${speed === s ? "bg-indigo-600 text-white" : "bg-white/5 hover:bg-white/10"}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 font-semibold text-xs text-slate-400 text-left">
              Volume ({(volume * 100).toFixed(0)}%)
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleVolumeChange(-0.1)}
                className="flex-1 rounded bg-white/5 py-1 hover:bg-white/10"
              >
                -
              </button>
              <button
                onClick={() => handleVolumeChange(0.1)}
                className="flex-1 rounded bg-white/5 py-1 hover:bg-white/10"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hidden flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-slate-200 transition-colors hover:bg-white/10 sm:flex sm:px-3"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-[11px]">More</span>
      </button>
    </div>
  );
}


export default ZoomVideoModal;
