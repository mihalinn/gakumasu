import type { ReactNode } from 'react';

interface LayoutProps {
    sidebar: ReactNode;
    children: ReactNode;
}

export function Layout({ sidebar, children }: LayoutProps) {
    return (
        <div className="flex h-screen w-full bg-[#1a1c23] text-slate-200 font-sans overflow-hidden selection:bg-pink-500/30">
            <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50 relative">
                {/* Background effects can be moved here or kept in children if they depend on state. 
                    For now, keeping the static background glows here. */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-orange-500/5 opacity-50"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                {/* Main Content Container */}
                <div className="flex-1 relative overflow-hidden flex flex-col z-10">
                    {children}
                </div>
            </div>
            {sidebar}
        </div>
    );
}
