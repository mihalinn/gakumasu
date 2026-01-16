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
    title?: string;
    value: string;
    sub: string;
    badge?: 'logic' | 'sense' | 'anomaly';
    highlight?: boolean;
    onClick?: () => void;
    imageUrl?: string;
    imagePosition?: string;
    imageLayout?: 'full' | 'right';
}

export function SummaryCard({ title, value, sub, badge, highlight = false, onClick, imageUrl, imagePosition = "object-top", imageLayout = 'full' }: SummaryCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                relative overflow-hidden rounded-lg border transition-all duration-300 group min-h-[5.5rem]
                ${highlight
                    ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-400/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]'
                    : 'bg-slate-800/50 border-white/5 hover:border-white/10 hover:bg-slate-800/80'
                }
            `}
        >
            {/* Background Image/Effect */}
            {imageUrl ? (
                imageLayout === 'right' ? (
                    /* Right-side layout (2:8 ratio with gradient mask) */
                    <>
                        <div
                            className="absolute right-0 top-0 bottom-0 w-[80%] opacity-80 group-hover:scale-105 transition-transform duration-700"
                            style={{
                                maskImage: 'linear-gradient(to right, transparent, black 30%)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
                            }}
                        >
                            <img src={imageUrl} alt="" className={`w-full h-full object-cover ${imagePosition}`} />
                        </div>
                        {/* Subtle text protection gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/20 to-transparent" />
                    </>
                ) : (
                    /* Full background layout (Original) */
                    <>
                        <div className="absolute inset-0 opacity-20 transition-transform duration-700 group-hover:scale-105">
                            <img src={imageUrl} alt="" className={`w-full h-full object-cover ${imagePosition}`} />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    </>
                )
            ) : highlight && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {/* Content */}
            <div className="relative p-3">
                <div className="flex justify-between items-start mb-1 min-h-[1.25rem]">
                    {title && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                    )}
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
                    <div className="min-w-0 w-full">
                        <p className={`text-sm font-bold truncate ${highlight ? "text-white" : "text-slate-400"} drop-shadow-md shadow-black`}>{value}</p>
                        {sub && <p className="text-[10px] text-slate-500 truncate drop-shadow-sm shadow-black">{sub}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
