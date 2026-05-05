import { useEffect, useMemo, useRef } from "react";
import { Outlet } from "react-router-dom";

const PARTICLE_COUNT = 170;

export function AuthLayout() {
  const shellRef = useRef(null);
  const particleRefs = useRef([]);

  const particleList = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
      const t = index / PARTICLE_COUNT;
      const angle = index * 2.39996323;
      const radius = Math.sqrt(t) * 48;
      const x = 50 + Math.cos(angle) * radius * 1.45;
      const y = 50 + Math.sin(angle) * radius * 1.08;
      const size = 3 + (index % 7);
      const hue = 220 + Math.sin(angle * 0.65) * 95;
      const depth = 0.25 + (index % 11) / 10;
      const seed = (index * 0.43 + angle) % (Math.PI * 2);

      return {
        id: index,
        xNorm: x / 100,
        yNorm: y / 100,
        depth,
        seed,
        style: {
          left: `${x}%`,
          top: `${y}%`,
          "--size": `${size}px`,
          "--color": `hsl(${hue.toFixed(1)} 88% 56%)`,
        },
      };
    });
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const mouse = { x: 0.5, y: 0.5, movedAt: 0 };
    let rafId = 0;

    const onMove = (event) => {
      const rect = shell.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) / rect.width;
      mouse.y = (event.clientY - rect.top) / rect.height;
      mouse.movedAt = performance.now();

      const dx = (mouse.x - 0.5) * 2;
      const dy = (mouse.y - 0.5) * 2;

      shell.style.setProperty("--dx", dx.toFixed(3));
      shell.style.setProperty("--dy", dy.toFixed(3));
      shell.style.setProperty("--cx", `${(mouse.x * 100).toFixed(2)}%`);
      shell.style.setProperty("--cy", `${(mouse.y * 100).toFixed(2)}%`);
    };

    const onLeave = () => {
      mouse.x = 0.5;
      mouse.y = 0.5;
      shell.style.setProperty("--dx", "0");
      shell.style.setProperty("--dy", "0");
      shell.style.setProperty("--cx", "50%");
      shell.style.setProperty("--cy", "50%");
    };

    const animate = (time) => {
      const recentMove = Math.max(0, 1 - (time - mouse.movedAt) / 900);

      particleList.forEach((particle, index) => {
        const node = particleRefs.current[index];
        if (!node) return;

        const dx = mouse.x - particle.xNorm;
        const dy = mouse.y - particle.yNorm;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;

        const bobX = Math.sin(time * 0.001 + particle.seed * 1.9) * (4 + particle.depth * 1.6);
        const bobY = Math.cos(time * 0.0012 + particle.seed * 2.3) * (4 + particle.depth * 1.8);

        const wave =
          Math.sin(dist * 42 - time * 0.015 + particle.seed * 2.1) *
          Math.exp(-dist * 5.7) *
          18 *
          recentMove;

        const pull = recentMove * particle.depth * 8;
        const tx = bobX + nx * (pull + wave);
        const ty = bobY + ny * (pull + wave);

        node.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      });

      rafId = requestAnimationFrame(animate);
    };

    shell.addEventListener("mousemove", onMove);
    shell.addEventListener("mouseleave", onLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      shell.removeEventListener("mousemove", onMove);
      shell.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [particleList]);

  return (
    <div className="auth-shell" ref={shellRef}>
      <div className="auth-particles" aria-hidden="true">
        {particleList.map((item, index) => (
          <span
            key={item.id}
            className="auth-particle"
            style={item.style}
            ref={(node) => {
              particleRefs.current[index] = node;
            }}
          />
        ))}
      </div>

      <div className="auth-stage">
        <section className="auth-hero-pane">
          <p className="auth-brand">LMS MATRIX</p>
          <h1>Experience lift-off with a modern LMS platform</h1>
          <p>
            Role-based learning, clean instructor workflow, and a separate admin
            control panel in one place.
          </p>
          <div className="auth-hero-chips">
            <span>Student Path</span>
            <span>Instructor Workspace</span>
            <span>Admin Analytics</span>
          </div>
        </section>

        <section className="auth-form-pane">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
