import React, { useRef, useEffect, useCallback } from 'react'

export default function ParticleCanvas({ className = '' }) {
    const canvasRef = useRef(null)

    const init = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return () => { }

        const ctx = canvas.getContext('2d')
        let animationId
        let mouseX = -1000
        let mouseY = -1000
        let mouseActive = false
        const particles = []
        const ripples = []
        const PARTICLE_COUNT = 140
        const CONNECTION_DISTANCE = 170
        const MOUSE_RADIUS = 250

        const colors = [
            { r: 102, g: 126, b: 234 },
            { r: 118, g: 75, b: 162 },
            { r: 240, g: 147, b: 251 },
            { r: 56, g: 249, b: 215 },
            { r: 67, g: 233, b: 123 },
            { r: 245, g: 87, b: 108 },
        ]

        function resize() {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        class Ripple {
            constructor(x, y) {
                this.x = x
                this.y = y
                this.radius = 0
                this.maxRadius = 200
                this.opacity = 0.4
                this.speed = 3
            }
            update() {
                this.radius += this.speed
                this.opacity = 0.4 * (1 - this.radius / this.maxRadius)
                return this.radius < this.maxRadius
            }
            draw() {
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
                ctx.strokeStyle = `rgba(102, 126, 234, ${this.opacity})`
                ctx.lineWidth = 1.5
                ctx.stroke()
            }
        }

        class Particle {
            constructor() {
                this.reset()
            }
            reset() {
                const w = canvas.offsetWidth
                const h = canvas.offsetHeight
                this.x = Math.random() * w
                this.y = Math.random() * h
                this.vx = (Math.random() - 0.5) * 0.8
                this.vy = (Math.random() - 0.5) * 0.8
                this.baseSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
                const c = colors[Math.floor(Math.random() * colors.length)]
                this.r = c.r; this.g = c.g; this.b = c.b
                this.radius = Math.random() * 3 + 1.2
                this.baseRadius = this.radius
                this.opacity = Math.random() * 0.6 + 0.3
                this.phase = Math.random() * Math.PI * 2
                this.phaseSpeed = Math.random() * 0.03 + 0.01
                // Orbit properties
                this.orbitRadius = 0
                this.orbitAngle = Math.random() * Math.PI * 2
                this.orbitSpeed = (Math.random() - 0.5) * 0.02
            }
            update(time) {
                const w = canvas.offsetWidth
                const h = canvas.offsetHeight

                this.phase += this.phaseSpeed
                const pulse = Math.sin(this.phase) * 0.3 + 0.7

                // Mouse interaction
                const dx = this.x - mouseX
                const dy = this.y - mouseY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < MOUSE_RADIUS && mouseActive) {
                    const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS
                    const angle = Math.atan2(dy, dx)
                    // Stronger push + orbit effect
                    this.x += Math.cos(angle) * force * 5
                    this.y += Math.sin(angle) * force * 5
                    // Grow near mouse
                    this.radius = this.baseRadius + force * 3
                    this.opacity = Math.min(1, this.opacity + force * 0.3)
                    // Orbit around mouse gently
                    this.orbitAngle += this.orbitSpeed
                    this.orbitRadius = dist * 0.1
                } else {
                    this.radius += (this.baseRadius - this.radius) * 0.05
                    this.x += this.vx
                    this.y += this.vy
                }

                // Soft boundary wrapping
                if (this.x < -20) this.x = w + 20
                if (this.x > w + 20) this.x = -20
                if (this.y < -20) this.y = h + 20
                if (this.y > h + 20) this.y = -20

                this.currentOpacity = this.opacity * pulse
            }
            draw() {
                // Outer glow
                const grad = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius * 6
                )
                grad.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.currentOpacity * 0.5})`)
                grad.addColorStop(0.4, `rgba(${this.r},${this.g},${this.b},${this.currentOpacity * 0.15})`)
                grad.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`)
                ctx.beginPath()
                ctx.fillStyle = grad
                ctx.arc(this.x, this.y, this.radius * 6, 0, Math.PI * 2)
                ctx.fill()

                // Core
                ctx.beginPath()
                ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.currentOpacity})`
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
                ctx.fill()

                // Bright center
                ctx.beginPath()
                ctx.fillStyle = `rgba(255,255,255,${this.currentOpacity * 0.6})`
                ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        function drawConnections() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < CONNECTION_DISTANCE) {
                        const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.2
                        const gradient = ctx.createLinearGradient(
                            particles[i].x, particles[i].y,
                            particles[j].x, particles[j].y
                        )
                        gradient.addColorStop(0, `rgba(${particles[i].r},${particles[i].g},${particles[i].b},${opacity})`)
                        gradient.addColorStop(1, `rgba(${particles[j].r},${particles[j].g},${particles[j].b},${opacity})`)
                        ctx.beginPath()
                        ctx.strokeStyle = gradient
                        ctx.lineWidth = 0.6
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.stroke()
                    }
                }

                // Mouse connections with triangle fill
                if (mouseActive) {
                    const mdx = particles[i].x - mouseX
                    const mdy = particles[i].y - mouseY
                    const mdist = Math.sqrt(mdx * mdx + mdy * mdy)

                    if (mdist < MOUSE_RADIUS) {
                        const opacity = (1 - mdist / MOUSE_RADIUS) * 0.35
                        ctx.beginPath()
                        const gradient = ctx.createLinearGradient(
                            particles[i].x, particles[i].y,
                            mouseX, mouseY
                        )
                        gradient.addColorStop(0, `rgba(${particles[i].r},${particles[i].g},${particles[i].b},${opacity})`)
                        gradient.addColorStop(1, `rgba(102, 126, 234, ${opacity * 0.3})`)
                        ctx.strokeStyle = gradient
                        ctx.lineWidth = 1
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(mouseX, mouseY)
                        ctx.stroke()
                    }
                }
            }
        }

        function drawMouseGlow() {
            if (!mouseActive) return
            const grad = ctx.createRadialGradient(
                mouseX, mouseY, 0,
                mouseX, mouseY, 120
            )
            grad.addColorStop(0, 'rgba(102, 126, 234, 0.08)')
            grad.addColorStop(0.5, 'rgba(118, 75, 162, 0.04)')
            grad.addColorStop(1, 'rgba(240, 147, 251, 0)')
            ctx.beginPath()
            ctx.fillStyle = grad
            ctx.arc(mouseX, mouseY, 120, 0, Math.PI * 2)
            ctx.fill()
        }

        let time = 0
        function animate() {
            const w = canvas.offsetWidth
            const h = canvas.offsetHeight
            ctx.clearRect(0, 0, w, h)
            time++

            drawMouseGlow()

            particles.forEach(p => {
                p.update(time)
                p.draw()
            })

            drawConnections()

            // Update ripples
            for (let i = ripples.length - 1; i >= 0; i--) {
                ripples[i].draw()
                if (!ripples[i].update()) {
                    ripples.splice(i, 1)
                }
            }

            animationId = requestAnimationFrame(animate)
        }

        function handleMouseMove(e) {
            const rect = canvas.getBoundingClientRect()
            mouseX = e.clientX - rect.left
            mouseY = e.clientY - rect.top
            mouseActive = true
        }

        function handleMouseLeave() {
            mouseActive = false
        }

        function handleClick(e) {
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            ripples.push(new Ripple(x, y))
            // Burst particles outward on click
            particles.forEach(p => {
                const dx = p.x - x
                const dy = p.y - y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 200) {
                    const force = (200 - dist) / 200
                    const angle = Math.atan2(dy, dx)
                    p.vx += Math.cos(angle) * force * 8
                    p.vy += Math.sin(angle) * force * 8
                    // Gradually slow  down
                    setTimeout(() => {
                        p.vx *= 0.3
                        p.vy *= 0.3
                    }, 600)
                }
            })
        }

        resize()
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle())
        }
        animate()

        window.addEventListener('resize', resize)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseleave', handleMouseLeave)
        canvas.addEventListener('click', handleClick)

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', resize)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mouseleave', handleMouseLeave)
            canvas.removeEventListener('click', handleClick)
        }
    }, [])

    useEffect(() => {
        return init()
    }, [init])

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                zIndex: 0,
            }}
        />
    )
}
