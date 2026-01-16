interface NavButtonProps {
    label: string;
    icon?: string;
    active: boolean;
    onClick: () => void;
    primary?: boolean;
}

export function NavButton({ label, icon, active, onClick, primary = false }: NavButtonProps) {
    const baseStyle = "w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3";
    const activeStyle = primary
        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/50"
        : "bg-white/10 text-white font-medium ring-1 ring-white/10";
    const inactiveStyle = "text-slate-400 hover:text-slate-200 hover:bg-white/5";

    return (
        <button onClick={onClick} className={`${baseStyle} ${active ? activeStyle : inactiveStyle}`}>
            {icon && <span className="text-lg opacity-80">{icon}</span>}
            <span className={primary ? "font-bold tracking-wide" : "text-sm"}>{label}</span>
            {active && !primary && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-blue-400/50 shadow-sm" />}
        </button>
    );
}

interface SummaryCardProps {
    title: string;
    value: string;
    sub?: string;
    badge?: string;
    highlight?: boolean;
    onClick?: () => void;
    imageUrl?: string;
}

export function SummaryCard({ title, value, sub, badge, highlight = false, onClick, imageUrl }: SummaryCardProps) {
    return (
        <div
            onClick={onClick}
            className={`relative overflow-hidden p-4 rounded-xl border transition-all duration-300 group ${onClick ? "cursor-pointer hover:bg-white/10 hover:border-white/20 active:scale-[0.98]" : ""} ${highlight ? "bg-white/5 border-white/10" : "bg-slate-900/30 border-white/5"}`}
        >
            {/* Ambient Background Image */}
            {imageUrl && (
                <div className="absolute right-[-5%] top-[-10%] bottom-[-10%] w-[70%] pointer-events-none select-none grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500">
                    <div className="w-full h-full relative">
                        <img
                            key={imageUrl}
                            src={imageUrl}
                            className="w-full h-full object-cover object-[50%_15%] animate-slide-in-right opacity-0" // Default opacity 0, animation handles fade-in to 0.6
                            style={{
                                maskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 100%)'
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-black drop-shadow-sm">{title}</p>
                    {badge && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shadow-sm ${badge === "logic" ? "bg-blue-500/20 text-blue-400 border border-blue-500/20 backdrop-blur-sm" :
                            badge === "sense" ? "bg-orange-500/20 text-orange-400 border border-orange-500/20 backdrop-blur-sm" :
                                "bg-purple-500/20 text-purple-400 border border-purple-500/20 backdrop-blur-sm"
                            }`}>
                            {badge}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="min-w-0 pr-6">
                        <p className={`text-sm font-bold truncate ${highlight ? "text-white" : "text-slate-400"} drop-shadow-md shadow-black`}>{value}</p>
                        {sub && <p className="text-[10px] text-slate-500 truncate drop-shadow-sm shadow-black">{sub}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
