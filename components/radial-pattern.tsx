"use client";

export function RadialPattern() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Concentric circles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%]">
                {[10, 20, 30, 40, 50].map((size, i) => (
                    <div
                        key={i}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/40"
                        style={{
                            width: `${size}%`,
                            height: `${size}%`,
                        }}
                    />
                ))}
            </div>

            {/* Gradient glows */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(191, 69, 245, 0.15) 0%, transparent 70%)"
                }}
            />
            <div
                className="absolute top-0 right-0 w-[500px] h-[400px] opacity-20"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(65, 114, 246, 0.2) 0%, transparent 60%)"
                }}
            />
        </div>
    );
}
