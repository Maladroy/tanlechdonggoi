import type React from "react";
import { useEffect, useState } from "react";

const FACEBOOK_PAGE_ID = "911781842019004";
const ZALO_ID = "0964186768";

// SVG Icons
const MessengerIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden="true">
        <title>Messenger</title>
        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.34.29.55l.06 1.73c.02.55.56.91 1.07.72l1.93-.77c.17-.07.36-.08.53-.03.86.24 1.78.36 2.74.36 5.64 0 10-4.13 10-9.7S17.64 2 12 2zm5.89 7.58l-2.89 4.58c-.46.73-1.46.91-2.14.38l-2.3-1.72a.75.75 0 00-.9 0l-3.1 2.35c-.41.31-.95-.17-.68-.6l2.89-4.58c.46-.73 1.46-.91 2.14-.38l2.3 1.72c.27.2.65.2.9 0l3.1-2.35c.41-.31.95.17.68.6z" />
    </svg>
);

interface ChatButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    bgColor: string;
    hoverColor: string;
    label: string;
    isShaking: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({
    onClick,
    children,
    bgColor,
    hoverColor,
    label,
    isShaking,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                relative w-14 h-14 rounded-full shadow-lg
                flex items-center justify-center
                text-white transition-all duration-300 ease-out
                hover:scale-110 hover:shadow-xl
                focus:outline-none focus:ring-4 focus:ring-opacity-50
                ${bgColor} ${isHovered ? hoverColor : ""}
                ${isShaking ? "animate-shake" : ""}
            `}
            style={{
                boxShadow: isHovered
                    ? "0 8px 25px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 136, 255, 0.5)"
                    : "0 4px 15px -3px rgba(0, 0, 0, 0.2)",
            }}
            aria-label={label}
            title={label}
        >
            {/* Pulse animation ring */}
            <span
                className={`
                    absolute inset-0 rounded-full animate-ping opacity-20
                    ${bgColor}
                `}
                style={{
                    animationDuration: "2s",
                    display: isHovered ? "block" : "none",
                }}
            />
            {children}
        </button>
    );
};

export const ChatWidget: React.FC = () => {
    const [isShaking, setIsShaking] = useState(false);

    // Intermittent shake animation
    useEffect(() => {
        const triggerShake = () => {
            setIsShaking(true);
            // Stop shaking after animation completes
            setTimeout(() => setIsShaking(false), 500);
        };

        // Initial shake after 2 seconds
        const initialTimeout = setTimeout(triggerShake, 2000);

        // Random interval between 5-15 seconds for subsequent shakes
        const getRandomInterval = () => Math.random() * 10000 + 5000;

        let intervalId: NodeJS.Timeout;
        const scheduleNextShake = () => {
            intervalId = setTimeout(() => {
                triggerShake();
                scheduleNextShake();
            }, getRandomInterval());
        };

        // Start the random shake cycle after initial shake
        const startCycle = setTimeout(scheduleNextShake, 2500);

        return () => {
            clearTimeout(initialTimeout);
            clearTimeout(startCycle);
            clearTimeout(intervalId);
        };
    }, []);

    const openMessenger = () => {
        window.open(`https://m.me/${FACEBOOK_PAGE_ID}`, "_blank");
    };

    const openZalo = () => {
        window.open(`https://zalo.me/${ZALO_ID}`, "_blank");
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
            {/* Header Label */}
            <div
                className={`
                    bg-linear-to-r from-orange-500 to-red-500 
                    text-white text-xs font-bold 
                    px-3 py-1.5 rounded-full shadow-lg
                    whitespace-nowrap
                    ${isShaking ? "animate-shake" : ""}
                `}
            >
                Liên Hệ Ngay
            </div>

            {/* Zalo Button with Text */}
            <ChatButton
                onClick={openZalo}
                bgColor="bg-[#0068FF]"
                hoverColor="bg-[#0054CC]"
                label="Chat với chúng tôi qua Zalo"
                isShaking={isShaking}
            >
                <span className="font-bold text-sm">Zalo</span>
            </ChatButton>

            {/* Facebook Messenger Button */}
            <ChatButton
                onClick={openMessenger}
                bgColor="bg-gradient-to-br from-[#00B2FF] via-[#006AFF] to-[#9B36FF]"
                hoverColor=""
                label="Chat với chúng tôi qua Messenger"
                isShaking={isShaking}
            >
                <MessengerIcon />
            </ChatButton>

            {/* CSS for shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px) rotate(-2deg); }
                    20%, 40%, 60%, 80% { transform: translateX(3px) rotate(2deg); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ChatWidget;
