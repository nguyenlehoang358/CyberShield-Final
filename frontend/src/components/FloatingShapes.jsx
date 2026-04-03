import React from 'react'

export default function FloatingShapes() {
    return (
        <div className="floating-shapes" aria-hidden="true">
            {/* === 3D Rotating Cube === */}
            <div className="shape-wrapper shape-1">
                <div className="cube">
                    <div className="cube-face front"></div>
                    <div className="cube-face back"></div>
                    <div className="cube-face right"></div>
                    <div className="cube-face left"></div>
                    <div className="cube-face top"></div>
                    <div className="cube-face bottom"></div>
                </div>
            </div>

            {/* === Second Cube (smaller, different pos) === */}
            <div className="shape-wrapper shape-6">
                <div className="cube cube-sm">
                    <div className="cube-face front"></div>
                    <div className="cube-face back"></div>
                    <div className="cube-face right"></div>
                    <div className="cube-face left"></div>
                    <div className="cube-face top"></div>
                    <div className="cube-face bottom"></div>
                </div>
            </div>

            {/* === Floating Ring === */}
            <div className="shape-wrapper shape-2">
                <div className="ring"></div>
            </div>

            {/* === Second Ring (nested, different angle) === */}
            <div className="shape-wrapper shape-7">
                <div className="ring ring-lg">
                    <div className="ring ring-inner"></div>
                </div>
            </div>

            {/* === 3D Pyramid === */}
            <div className="shape-wrapper shape-3">
                <div className="pyramid">
                    <div className="pyramid-face pf-1"></div>
                    <div className="pyramid-face pf-2"></div>
                    <div className="pyramid-face pf-3"></div>
                    <div className="pyramid-face pf-4"></div>
                </div>
            </div>

            {/* === Glowing Sphere === */}
            <div className="shape-wrapper shape-4">
                <div className="sphere"></div>
            </div>

            {/* === Second Sphere (different color) === */}
            <div className="shape-wrapper shape-8">
                <div className="sphere sphere-purple"></div>
            </div>

            {/* === Diamond === */}
            <div className="shape-wrapper shape-5">
                <div className="diamond"></div>
            </div>

            {/* === Hexagon === */}
            <div className="shape-wrapper shape-9">
                <div className="hexagon"></div>
            </div>

            {/* === Rotating Cross === */}
            <div className="shape-wrapper shape-10">
                <div className="cross-shape">
                    <div className="cross-h"></div>
                    <div className="cross-v"></div>
                </div>
            </div>

            {/* === DNA Helix === */}
            <div className="shape-wrapper shape-11">
                <div className="dna-helix">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="dna-dot" style={{
                            animationDelay: `${i * 0.15}s`,
                            top: `${i * 12.5}%`
                        }}></div>
                    ))}
                </div>
            </div>

            {/* === Orbit System === */}
            <div className="shape-wrapper shape-12">
                <div className="orbit-system">
                    <div className="orbit-center"></div>
                    <div className="orbit-ring orbit-ring-1">
                        <div className="orbit-dot"></div>
                    </div>
                    <div className="orbit-ring orbit-ring-2">
                        <div className="orbit-dot"></div>
                    </div>
                </div>
            </div>

            {/* === Floating Dots (more of them) === */}
            <div className="floating-dot dot-1"></div>
            <div className="floating-dot dot-2"></div>
            <div className="floating-dot dot-3"></div>
            <div className="floating-dot dot-4"></div>
            <div className="floating-dot dot-5"></div>
            <div className="floating-dot dot-6"></div>
            <div className="floating-dot dot-7"></div>
            <div className="floating-dot dot-8"></div>
            <div className="floating-dot dot-9"></div>
            <div className="floating-dot dot-10"></div>

            {/* === Grid Lines (background) === */}
            <div className="grid-lines"></div>

            {/* === Aurora Effect === */}
            <div className="aurora">
                <div className="aurora-band aurora-1"></div>
                <div className="aurora-band aurora-2"></div>
                <div className="aurora-band aurora-3"></div>
            </div>
        </div>
    )
}
