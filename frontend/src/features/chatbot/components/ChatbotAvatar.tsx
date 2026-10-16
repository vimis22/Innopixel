import { useId } from "react";
import type { AvatarState } from "../types/chatbot.types";

interface ChatbotAvatarProps {
    state: AvatarState;
    size?: "sm" | "md" | "lg";
    still?: boolean;             // no idle motion (e.g. the small avatars next to messages)
}

/*
 * Innopixel's own robot mascot: a rounded white helmet with orange ear pods, a dark faceplate and
 * glowing orange-to-pink eyes. Every expression is plain SVG; chatbot.css animates it per data-state.
 * Decorative only: the surrounding button or header carries the accessible name.
 */
function ChatbotAvatar({ state, size = "md", still = false }: ChatbotAvatarProps) {
    const id = useId().replace(/:/g, "");
    const shell = `${id}-shell`;
    const face = `${id}-face`;
    const eye = `${id}-eye`;
    const glow = `${id}-glow`;

    return (
        <span className={`bot bot--${size} ${still ? "bot--still" : ""}`} data-state={state} aria-hidden="true">
            <svg viewBox="0 0 120 120" focusable="false">
                <defs>
                    <linearGradient id={shell} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#c9ccd6" />
                    </linearGradient>
                    <linearGradient id={face} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1d1d26" />
                        <stop offset="100%" stopColor="#060609" />
                    </linearGradient>
                    <linearGradient id={eye} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ffb347" />
                        <stop offset="55%" stopColor="#ff5a3c" />
                        <stop offset="100%" stopColor="#ff2d7a" />
                    </linearGradient>
                    <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.2" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                <g className="bot-body">
                    {/* Shoulders peeking out below the head */}
                    <path className="bot-torso" d="M30 118c2-14 14-22 30-22s28 8 30 22z" fill={`url(#${shell})`} />
                    <circle className="bot-chest-light" cx="60" cy="108" r="3.2" fill={`url(#${eye})`} filter={`url(#${glow})`} />

                    {/* Waving hand (greeting) */}
                    <g className="bot-hand">
                        <rect x="92" y="78" width="7" height="20" rx="3.5" fill={`url(#${shell})`} />
                        <circle cx="95.5" cy="76" r="7" fill={`url(#${shell})`} />
                    </g>

                    <g className="bot-head">
                        {/* Antenna */}
                        <line x1="60" y1="22" x2="60" y2="12" stroke="#c9ccd6" strokeWidth="3" strokeLinecap="round" />
                        <circle className="bot-antenna" cx="60" cy="10" r="4.5" fill={`url(#${eye})`} filter={`url(#${glow})`} />

                        {/* Ear pods */}
                        <rect x="14" y="44" width="12" height="26" rx="6" fill="#ff6a2b" />
                        <rect x="94" y="44" width="12" height="26" rx="6" fill="#ff4d6d" />

                        {/* Helmet and faceplate */}
                        <rect x="20" y="20" width="80" height="74" rx="34" fill={`url(#${shell})`} />
                        <rect x="27" y="32" width="66" height="50" rx="24" fill={`url(#${face})`} />
                        <path d="M36 38c8-4 40-4 48 0" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                        <g className="bot-face">
                            {/* Eyes: round (most states) or happy arcs */}
                            <g className="bot-eyes" filter={`url(#${glow})`}>
                                <ellipse className="bot-eye" cx="47" cy="55" rx="6.5" ry="7.5" fill={`url(#${eye})`} />
                                <ellipse className="bot-eye" cx="73" cy="55" rx="6.5" ry="7.5" fill={`url(#${eye})`} />
                            </g>
                            <g className="bot-eyes-happy" filter={`url(#${glow})`} fill="none" stroke={`url(#${eye})`} strokeWidth="4" strokeLinecap="round">
                                <path d="M40 57c3-6 11-6 14 0" />
                                <path d="M66 57c3-6 11-6 14 0" />
                            </g>

                            {/* Cheeks */}
                            <circle cx="37" cy="66" r="3.5" fill="#ff2d7a" opacity="0.35" />
                            <circle cx="83" cy="66" r="3.5" fill="#ff2d7a" opacity="0.35" />

                            {/* Mouths: one is visible per state */}
                            <path className="bot-mouth bot-mouth--smile" d="M52 68c4 4 12 4 16 0" stroke={`url(#${eye})`} strokeWidth="3" strokeLinecap="round" fill="none" />
                            <ellipse className="bot-mouth bot-mouth--talk" cx="60" cy="70" rx="5" ry="3.5" fill={`url(#${eye})`} />
                            <circle className="bot-mouth bot-mouth--think" cx="62" cy="70" r="2.4" fill={`url(#${eye})`} />
                            <path className="bot-mouth bot-mouth--unsure" d="M52 71c3-2.5 5-2.5 8 0s5 2.5 8 0" stroke={`url(#${eye})`} strokeWidth="2.6" strokeLinecap="round" fill="none" />
                        </g>
                    </g>

                    {/* Thinking dots */}
                    <g className="bot-thinking" fill={`url(#${eye})`}>
                        <circle cx="96" cy="22" r="3" />
                        <circle cx="105" cy="14" r="3.8" />
                        <circle cx="114" cy="5" r="4.4" />
                    </g>
                </g>
            </svg>
        </span>
    );
}

export default ChatbotAvatar;
