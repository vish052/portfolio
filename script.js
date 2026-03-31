/* ═══════════════════════════════════════════════════════
   3D PORTFOLIO — script.js
   Uses: Three.js (r128), GSAP 3 + ScrollTrigger
═══════════════════════════════════════════════════════ */

/* ─── Register GSAP plugin ─────────────────────────── */
gsap.registerPlugin(ScrollTrigger);

/* ─── Hero animation guard ─────────────────────────── */
let heroAnimFired = false;

/* ─── Lenis smooth scroll ──────────────────────────── */
let lenis;
(function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
        duration: 1.2,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.5,
    });
    // Hook Lenis into GSAP ticker so ScrollTrigger stays in sync
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    // Disable on mobile (touch feels better native)
    if (window.innerWidth < 768) lenis.destroy();
})();

/* ═══════════════════════════════════════════════════════
   1.  PRELOADER
═══════════════════════════════════════════════════════ */
(function initPreloader() {
    const preloader = document.getElementById('preloader');
    const bar       = document.getElementById('preloader-bar');
    const pct       = document.getElementById('preloader-pct');

    let progress = 0;
    const interval = setInterval(() => {
        // Simulate async loading with variable speed
        const increment = progress < 70 ? Math.random() * 12 + 4
                        : progress < 90 ? Math.random() * 5  + 1
                        : 0.5;
        progress = Math.min(progress + increment, 100);
        bar.style.width = progress + '%';
        pct.textContent = Math.floor(progress) + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('done');
                startHeroAnimation();
                heroAnimFired = true;
            }, 300);
        }
    }, 60);

    // Safety net: if preloader stalls (e.g. slow mobile), force hero visible after 4s
    setTimeout(() => {
        if (!heroAnimFired) {
            if (preloader) preloader.classList.add('done');
            startHeroAnimation();
            heroAnimFired = true;
        }
    }, 4000);
})();

/* ═══════════════════════════════════════════════════════
   2.  CUSTOM CURSOR
═══════════════════════════════════════════════════════ */
(function initCursor() {
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let raf;

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top  = mouseY + 'px';
    });

    // Smooth trailing ring
    (function animateRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.left = ringX + 'px';
        ring.style.top  = ringY + 'px';
        raf = requestAnimationFrame(animateRing);
    })();

    // Hover state
    const interactives = 'a, button, .tilt-card, .social-link, .nav-link';
    document.addEventListener('mouseover', e => {
        if (e.target.closest(interactives)) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest(interactives)) ring.classList.remove('hover');
    });
})();

/* ═══════════════════════════════════════════════════════
   3.  HEADER SCROLL BEHAVIOUR + SCROLL SPY
═══════════════════════════════════════════════════════ */
(function initHeader() {
    const header     = document.getElementById('header');
    const backToTop  = document.getElementById('back-to-top');
    const navLinks   = document.querySelectorAll('.nav-link');
    const sections   = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;

        // Sticky style
        header.classList.toggle('scrolled', y > 60);

        // Back to top
        backToTop.classList.toggle('visible', y > 500);

        // Scroll spy
        let current = '';
        sections.forEach(sec => {
            if (y >= sec.offsetTop - 120) current = sec.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }, { passive: true });

    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ═══════════════════════════════════════════════════════
   4.  MOBILE NAV
═══════════════════════════════════════════════════════ */
(function initMobileNav() {
    const btn       = document.getElementById('mobile-menu-btn');
    const closeBtn  = document.getElementById('mobile-nav-close');
    const nav       = document.getElementById('mobile-nav');
    const links     = nav.querySelectorAll('.mobile-nav-link');

    let scrollY = 0;

    const toggle = (force) => {
        const open = force !== undefined ? force : btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('open', open);

        // iOS-safe scroll lock: freeze body in place
        if (open) {
            scrollY = window.scrollY;
            document.body.style.position   = 'fixed';
            document.body.style.top        = `-${scrollY}px`;
            document.body.style.left       = '0';
            document.body.style.right      = '0';
            document.body.style.overflow   = 'hidden';
        } else {
            document.body.style.position   = '';
            document.body.style.top        = '';
            document.body.style.left       = '';
            document.body.style.right      = '';
            document.body.style.overflow   = '';
            window.scrollTo(0, scrollY);
        }
    };

    btn.addEventListener('click', () => toggle());
    if (closeBtn) closeBtn.addEventListener('click', () => toggle(false));
    links.forEach(l => l.addEventListener('click', () => toggle(false)));
})();

/* ═══════════════════════════════════════════════════════
   5.  THREE.JS HERO SCENE
   Neural-network style floating nodes with edge lines,
   reacts to mouse movement with parallax
═══════════════════════════════════════════════════════ */
(function initHeroScene() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    /* --- Detect low-end / reduced-motion --- */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        canvas.style.display = 'none'; return;
    }

    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.hardwareConcurrency <= 2;

    /* --- Renderer --- */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.setClearColor(0x000000, 0);

    /* --- Scene + Camera --- */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 28;

    /* --- Resize handler --- */
    const onResize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    onResize();
    window.addEventListener('resize', onResize, { passive: true });

    /* ---- Particles / nodes (lighter on mobile/low-end) ---- */
    const NODE_COUNT   = (isMobile || isLowEnd) ? 40 : 80;
    const CONN_DIST    = (isMobile || isLowEnd) ? 8  : 9;   // max distance for edge lines
    const CONN_MAX     = (isMobile || isLowEnd) ? 2  : 3;   // max connections per node
    const SPREAD       = 26;

    // Geometries & materials
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
    const nodeGeo = new THREE.SphereGeometry(0.12, 8, 8);

    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xa78bfa, transparent: true, opacity: 0.35
    });
    const glowGeo = new THREE.SphereGeometry(0.32, 8, 8);

    // Edge line material
    const lineMat = new THREE.LineBasicMaterial({
        color: 0x6366f1, transparent: true, opacity: 0.18
    });

    const nodes = [];
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    // Build nodes
    for (let i = 0; i < NODE_COUNT; i++) {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * SPREAD,
            (Math.random() - 0.5) * SPREAD * 0.7,
            (Math.random() - 0.5) * 12
        );
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.008,
            (Math.random() - 0.5) * 0.008,
            0
        );

        // Core sphere
        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.copy(pos);
        nodeGroup.add(mesh);

        // Glow halo
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(pos);
        nodeGroup.add(glow);

        nodes.push({ mesh, glow, pos, vel });
    }

    // Build edges (LineSegments via BufferGeometry)
    const linePositions = new Float32Array(NODE_COUNT * CONN_MAX * 6);
    const lineGeo = new THREE.BufferGeometry();
    const posAttr  = new THREE.BufferAttribute(linePositions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', posAttr);
    const lineSegs = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSegs);

    // Scattered star particles (static background layer)
    const STAR_COUNT = (isMobile || isLowEnd) ? 80 : 200;
    const starPositions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT * 3; i++) starPositions[i] = (Math.random() - 0.5) * 60;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.06, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ---- Mouse parallax + repulsion ---- */
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    // Mouse in scene world-space (for repulsion)
    const mouse3D = new THREE.Vector3(9999, 9999, 0);
    const REPULSE_RADIUS = 6;   // world units
    const REPULSE_FORCE  = 0.04;

    window.addEventListener('mousemove', e => {
        targetX = ((e.clientX / window.innerWidth)  - 0.5) * 2;
        targetY = ((e.clientY / window.innerHeight) - 0.5) * 2;
        // Convert screen to approximate world coords (z=0 plane)
        mouse3D.x =  targetX * (SPREAD / 2);
        mouse3D.y = -targetY * (SPREAD * 0.7 / 2);
    }, { passive: true });

    /* ---- Animate ---- */
    let lineIndex = 0;
    const clock = new THREE.Clock();
    let animActive = true;

    // Pause when tab hidden
    document.addEventListener('visibilitychange', () => {
        animActive = !document.hidden;
        if (animActive) clock.start();
    });

    function animate() {
        if (!animActive) { requestAnimationFrame(animate); return; }
        requestAnimationFrame(animate);

        const t = clock.getElapsedTime();

        /* smooth mouse follow */
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;

        nodeGroup.rotation.y = currentX * 0.12;
        nodeGroup.rotation.x = -currentY * 0.08;

        /* floating drift + mouse repulsion */
        nodes.forEach(n => {
            n.pos.addScaledVector(n.vel, 1);
            // Soft boundary bounce
            if (Math.abs(n.pos.x) > SPREAD / 2) n.vel.x *= -1;
            if (Math.abs(n.pos.y) > (SPREAD * 0.7) / 2) n.vel.y *= -1;
            // Subtle oscillation on z
            n.pos.z += Math.sin(t * 0.3 + n.pos.x) * 0.003;

            // Repulsion from cursor
            const dx = n.pos.x - mouse3D.x;
            const dy = n.pos.y - mouse3D.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPULSE_RADIUS && dist > 0.01) {
                const force = (REPULSE_RADIUS - dist) / REPULSE_RADIUS * REPULSE_FORCE;
                n.pos.x += (dx / dist) * force * 6;
                n.pos.y += (dy / dist) * force * 6;
            }

            n.mesh.position.copy(n.pos);
            n.glow.position.copy(n.pos);
        });

        /* rebuild edge lines */
        lineIndex = 0;
        for (let i = 0; i < NODE_COUNT; i++) {
            let connCount = 0;
            for (let j = i + 1; j < NODE_COUNT; j++) {
                if (connCount >= CONN_MAX) break;
                const d = nodes[i].pos.distanceTo(nodes[j].pos);
                if (d < CONN_DIST) {
                    linePositions[lineIndex++] = nodes[i].pos.x;
                    linePositions[lineIndex++] = nodes[i].pos.y;
                    linePositions[lineIndex++] = nodes[i].pos.z;
                    linePositions[lineIndex++] = nodes[j].pos.x;
                    linePositions[lineIndex++] = nodes[j].pos.y;
                    linePositions[lineIndex++] = nodes[j].pos.z;
                    connCount++;
                }
            }
        }
        // Zero-out remaining positions
        for (let i = lineIndex; i < linePositions.length; i++) linePositions[i] = 0;
        posAttr.needsUpdate = true;
        lineGeo.setDrawRange(0, lineIndex / 3);

        /* subtle camera drift */
        camera.position.x = Math.sin(t * 0.07) * 1.5 + currentX * 0.8;
        camera.position.y = Math.cos(t * 0.05) * 0.8 - currentY * 0.5;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }
    animate();
})();

/* ═══════════════════════════════════════════════════════
   6.  HERO GSAP ENTRANCE (called after preloader)
═══════════════════════════════════════════════════════ */
function startHeroAnimation() {
    // Set initial hidden state via GSAP (CSS no longer hides these,
    // so content is visible if JS fails — but when JS runs we animate in)
    gsap.set(['.hero-tag', '.hero-subtitle', '.hero-desc', '.hero-actions', '.hero-socials'], {
        opacity: 0, y: 20
    });
    gsap.set('.hero-name-line', { y: 80, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to('.hero-tag',       { opacity: 1, y: 0, duration: 0.7, delay: 0.1 })
      .to('.hero-name-line', { y: 0, opacity: 1, duration: 0.9, stagger: 0.18, ease: 'power4.out' }, '-=0.3')
      .to('.hero-subtitle',  { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
      .to('.hero-desc',      { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
      .to('.hero-actions',   { opacity: 1, y: 0, duration: 0.6 }, '-=0.5')
      .to('.hero-socials',   { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
}

/* ═══════════════════════════════════════════════════════
   7.  SCROLL-TRIGGERED GSAP ANIMATIONS
═══════════════════════════════════════════════════════ */
(function initScrollAnimations() {
    // Helper: default ScrollTrigger options
    const st = (trigger, extra = {}) => ({
        scrollTrigger: { trigger, start: 'top 82%', toggleActions: 'play none none none', ...extra }
    });

    /* Generic reveal-up */
    document.querySelectorAll('[data-gsap="reveal"]').forEach(el => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
            ...st(el) });
    });

    /* Reveal from left */
    document.querySelectorAll('[data-gsap="reveal-left"]').forEach(el => {
        gsap.fromTo(el, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
            ...st(el) });
    });

    /* Reveal from right */
    document.querySelectorAll('[data-gsap="reveal-right"]').forEach(el => {
        gsap.fromTo(el, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
            ...st(el) });
    });

    /* Skill cards stagger */
    (() => {
        const cards = document.querySelectorAll('[data-gsap="skill-card"]');
        if (!cards.length) return;
        gsap.to(cards, {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: cards[0], start: 'top 80%', toggleActions: 'play none none none' }
        });
    })();

    /* Timeline items stagger */
    (() => {
        const items = document.querySelectorAll('[data-gsap="timeline"]');
        if (!items.length) return;
        items.forEach((item, i) => {
            gsap.fromTo(item,
                { opacity: 0, x: -40 },
                { opacity: 1, x: 0, duration: 0.75, ease: 'power3.out',
                    scrollTrigger: { trigger: item, start: 'top 82%' }
                }
            );
        });
    })();

    /* Featured projects */
    (() => {
        const cards = document.querySelectorAll('[data-gsap="featured"]');
        cards.forEach((card, i) => {
            gsap.fromTo(card,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
                    scrollTrigger: { trigger: card, start: 'top 80%' }
                }
            );
        });
    })();

    /* Project grid cards stagger */
    (() => {
        const cards = document.querySelectorAll('[data-gsap="project-card"]');
        if (!cards.length) return;
        gsap.to(cards, {
            opacity: 1, y: 0, duration: 0.65, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: cards[0], start: 'top 82%' }
        });
    })();

    /* Achievement cards stagger */
    (() => {
        const cards = document.querySelectorAll('[data-gsap="achievement"]');
        if (!cards.length) return;
        gsap.to(cards, {
            opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.12, ease: 'back.out(1.4)',
            scrollTrigger: { trigger: cards[0], start: 'top 82%' }
        });
    })();

    /* Stat cards */
    (() => {
        const cards = document.querySelectorAll('[data-gsap="stat"]');
        if (!cards.length) return;
        gsap.to(cards, {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: cards[0], start: 'top 82%' }
        });
    })();

    /* Parallax on hero canvas */
    gsap.to('#hero-canvas', {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

})();

/* ═══════════════════════════════════════════════════════
   8.  NUMBER COUNTERS (IntersectionObserver)
═══════════════════════════════════════════════════════ */
(function initCounters() {
    const counters = document.querySelectorAll('.counter');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            animateCounter(entry.target);
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));

    function animateCounter(el) {
        const target = parseFloat(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        const isFloat = !Number.isInteger(target);
        const duration = 2000;
        const start = performance.now();

        requestAnimationFrame(function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            const current = target * ease;
            el.textContent = (isFloat ? current.toFixed(2) : Math.round(current)) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        });
    }
})();

/* ═══════════════════════════════════════════════════════
   9.  3D TILT EFFECT (Vanilla — no library needed)
═══════════════════════════════════════════════════════ */
(function initTilt() {
    /* Skip on touch devices */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const TILT_MAX     = 12;   // degrees
    const SCALE_HOVER  = 1.02;
    const PERSPECTIVE  = 800;

    document.querySelectorAll('.tilt-card').forEach(card => {
        card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
        });

        card.addEventListener('mousemove', e => {
            const rect  = card.getBoundingClientRect();
            const cx    = rect.left + rect.width  / 2;
            const cy    = rect.top  + rect.height / 2;
            const dx    = (e.clientX - cx) / (rect.width  / 2);
            const dy    = (e.clientY - cy) / (rect.height / 2);

            const rotateY =  dx * TILT_MAX;
            const rotateX = -dy * TILT_MAX;

            card.style.transform =
                `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${SCALE_HOVER})`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease';
            card.style.transform  = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
})();

/* ═══════════════════════════════════════════════════════
   10.  PROJECT MODAL
═══════════════════════════════════════════════════════ */
(function initModal() {
    const overlay   = document.getElementById('project-modal');
    const titleEl   = document.getElementById('modal-title');
    const descEl    = document.getElementById('modal-desc');
    const techList  = document.getElementById('modal-tech');
    const closeBtn  = document.getElementById('close-modal');

    /* ——— Project data ——————————————————————————————— */
    // CUSTOMIZE: update project descriptions here
    const projectData = {
        'project-1': {
            title: '🏭 Manufacturing Floor Assistant',
            desc: `The Manufacturing Floor Assistant is a real-time multilingual communication tool designed to improve clarity and reduce miscommunication in diverse manufacturing environments.

The application captures live speech from supervisors and technicians, converts it into accurate text using Speech-to-Text, and instantly translates the output into 20+ languages to support cross-language collaboration on the shop floor.

The solution also enables better documentation and traceability by storing transcripts for audits, shift handovers, and continuous improvement initiatives.`,
            tech: ['React', 'Node.js (REST + WebSockets)', 'Google Speech-to-Text', 'Gemini LLM Translation', 'WebSockets', 'GCP', 'BigQuery', 'Cloud Storage']
        },
        'project-2': {
            title: '🤖 Autonomous GenAI Agents (Human-on-the-Loop)',
            desc: `A suite of autonomous Generative AI agents designed around real enterprise personas (demand planner, supply chain analyst). Each agent combines LLM reasoning with enterprise data signals to automate complex, high-effort workflows — while keeping humans in control through human-on-the-loop validation and escalation.

Deployed on GCP, the agents integrate with BigQuery/SQL to generate insights, recommendations, and actionable alerts. The framework supports governed execution through auditability, monitoring, and feedback loops to continuously improve quality and trust.`,
            tech: ['Google Cloud Platform (GCP)', 'Vertex AI / LLM APIs', 'Google ADK', 'Node.js', 'BigQuery', 'Cloud Functions', 'HITL Controls', 'Audit Trails']
        },
        'project-3': {
            title: '📦 Distress Inventory Companion',
            desc: `Built to help supply chain and commercial teams proactively reduce distressed sales by accelerating root-cause analysis and decision-making. Connects to enterprise inventory, demand, and supply signals to identify where and why distress is occurring.

Generates data-backed recommendations to recover value — markdown/discount strategy, transfer/redistribution, targeted promotions — and supports consistent documentation for faster approvals.`,
            tech: ['Google Cloud Platform (GCP)', 'Vertex AI / LLM APIs', 'Custom Workflow Orchestration', 'Node.js', 'BigQuery', 'Cloud Functions / Cloud Run', 'Audit Trails']
        },
        'project-4': {
            title: '📈 Demand Planning Companion',
            desc: `Designed to help planners manage large portfolios and complex forecasting scenarios where long lead times and multiple constraints make analysis slow and error-prone. The co-pilot connects to enterprise planning datasets to surface key drivers, anomalies, and risks through a natural language interface.

By reducing manual effort and making insights more accessible, the companion enables planners to work more efficiently across large portfolios while improving confidence in forecast sign-off.`,
            tech: ['Google Cloud Platform (GCP)', 'Vertex AI / LLM APIs', 'Custom Planning Workflow Orchestration', 'Node.js', 'BigQuery', 'Feedback Loop', 'Usage Metrics']
        }
    };

    const openModal = id => {
        const data = projectData[id];
        if (!data) return;
        titleEl.textContent = data.title;
        descEl.textContent  = data.desc;
        techList.innerHTML  = data.tech.map(t => `<li>${t}</li>`).join('');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    };

    const closeModal = () => {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    };

    /* Attach open triggers */
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            openModal(btn.getAttribute('data-project'));
        });
    });

    closeBtn.addEventListener('click', closeModal);

    /* Close on backdrop click */
    overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });

    /* Close on Escape */
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
})();

/* ═══════════════════════════════════════════════════════
   11.  SECTION ACTIVE LINE IN NAV  (pulse on first scroll-into-view)
═══════════════════════════════════════════════════════ */
(function initSectionRevealSound() {
    // Subtle haptic-like pulse on section titles when they enter view
    document.querySelectorAll('.section-title').forEach(title => {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    title.style.textShadow = '0 0 30px rgba(99,102,241,0.4)';
                    setTimeout(() => title.style.textShadow = '', 800);
                    io.unobserve(title);
                }
            });
        }, { threshold: 0.6 });
        io.observe(title);
    });
})();

/* ═══════════════════════════════════════════════════════
   12.  SMOOTH ANCHOR SCROLL (offset for sticky header)
═══════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
        const top  = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

/* ═══════════════════════════════════════════════════════
   13.  KEYBOARD SHORTCUT — Press "." to jump to contact
═══════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
    if (e.key === '.' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        const contact = document.getElementById('contact');
        if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    }
});

/* ═══════════════════════════════════════════════════════
   14.  TYPED TEXT EFFECT
   Cycles through roles with a typewriter animation.
   CUSTOMIZE: edit the `roles` array below.
═══════════════════════════════════════════════════════ */
(function initTypedText() {
    const el = document.getElementById('typed-text');
    if (!el) return;

    // CUSTOMIZE: add/remove/reorder roles here
    const roles = [
        'Backend Engineer',
        'Cloud Architect',
        'GenAI Builder',
        'Node.js Specialist',
        'Data Engineer',
    ];

    let roleIndex  = 0;
    let charIndex  = 0;
    let isDeleting = false;
    let isPaused   = false;

    const TYPE_SPEED   = 80;   // ms per character typed
    const DELETE_SPEED = 40;   // ms per character deleted
    const PAUSE_AFTER  = 1800; // ms to hold the full word

    function tick() {
        const current = roles[roleIndex];

        if (isPaused) {
            isPaused = false;
            isDeleting = true;
            setTimeout(tick, PAUSE_AFTER);
            return;
        }

        if (isDeleting) {
            charIndex--;
            el.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
                isDeleting = false;
                roleIndex  = (roleIndex + 1) % roles.length;
                setTimeout(tick, 400); // brief pause before next word
                return;
            }
        } else {
            charIndex++;
            el.textContent = current.slice(0, charIndex);
            if (charIndex === current.length) {
                isPaused = true;
                setTimeout(tick, PAUSE_AFTER);
                return;
            }
        }

        setTimeout(tick, isDeleting ? DELETE_SPEED : TYPE_SPEED);
    }

    // Start after hero entrance animation completes
    setTimeout(tick, 2600);
})();

/* ═══════════════════════════════════════════════════════
   15.  MAGNETIC BUTTONS
   Elements with class "magnetic" attract the cursor
   within a proximity radius.
═══════════════════════════════════════════════════════ */
(function initMagnetic() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const STRENGTH = 0.38; // 0 = no pull, 1 = full pull to center
    const RADIUS   = 90;   // px — activation zone around button

    document.querySelectorAll('.magnetic').forEach(el => {
        let animId;

        const onMove = e => {
            const rect   = el.getBoundingClientRect();
            const cx     = rect.left + rect.width  / 2;
            const cy     = rect.top  + rect.height / 2;
            const dx     = e.clientX - cx;
            const dy     = e.clientY - cy;
            const dist   = Math.sqrt(dx * dx + dy * dy);

            if (dist < RADIUS) {
                const moveX = dx * STRENGTH;
                const moveY = dy * STRENGTH;
                el.style.transform = `translate(${moveX}px, ${moveY}px)`;
            } else {
                el.style.transform = '';
            }
        };

        const onLeave = () => {
            el.style.transform = '';
        };

        document.addEventListener('mousemove', onMove, { passive: true });
        el.addEventListener('mouseleave', onLeave);
    });
})();

/* ═══════════════════════════════════════════════════════
   16.  CURSOR SPOTLIGHT
   Soft radial glow that follows the mouse, most visible
   over dark section backgrounds.
═══════════════════════════════════════════════════════ */
(function initSpotlight() {
    const spotlight = document.getElementById('cursor-spotlight');
    if (!spotlight) return;
    if (!window.matchMedia('(hover: hover)').matches) {
        spotlight.style.display = 'none';
        return;
    }

    let x = 0, y = 0, tx = 0, ty = 0;

    document.addEventListener('mousemove', e => {
        tx = e.clientX;
        ty = e.clientY;
    }, { passive: true });

    (function move() {
        x += (tx - x) * 0.08;
        y += (ty - y) * 0.08;
        spotlight.style.left = x + 'px';
        spotlight.style.top  = y + 'px';
        requestAnimationFrame(move);
    })();

    // Fade out when cursor leaves window
    document.addEventListener('mouseleave', () => spotlight.style.opacity = '0');
    document.addEventListener('mouseenter', () => spotlight.style.opacity = '1');
})();

/* ═══════════════════════════════════════════════════════
   17.  READING PROGRESS BAR
   Fills as the user scrolls from top to bottom of page.
═══════════════════════════════════════════════════════ */
(function initReadingProgress() {
    const bar = document.getElementById('reading-progress');
    if (!bar) return;

    const update = () => {
        const scrollTop    = window.scrollY;
        const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
        const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width    = pct + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
})();

/* ═══════════════════════════════════════════════════════
   18.  GLITCH EFFECT ON HERO NAME
   Randomly fires a 250ms glitch on one of the name lines
   every 3–7 seconds after the page loads.
═══════════════════════════════════════════════════════ */
(function initGlitch() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lines = document.querySelectorAll('.hero-name-line[data-glitch]');
    if (!lines.length) return;

    const GLITCH_DURATION = 280; // ms — must match CSS animation duration

    const fire = () => {
        // Pick a random line
        const line = lines[Math.floor(Math.random() * lines.length)];
        line.classList.add('glitching');
        setTimeout(() => line.classList.remove('glitching'), GLITCH_DURATION);

        // Schedule next glitch in 3–8 seconds
        setTimeout(fire, 3000 + Math.random() * 5000);
    };

    // Start after hero entrance finishes
    setTimeout(fire, 4000);
})();

/* ═══════════════════════════════════════════════════════
   19.  NAV SLIDING PILL
   A highlight pill that glides to the active nav link.
   Works on hover AND on scroll (scroll-spy driven).
═══════════════════════════════════════════════════════ */
(function initNavPill() {
    const pill     = document.getElementById('nav-pill');
    const navList  = document.getElementById('nav-list');
    const navLinks = navList ? navList.querySelectorAll('.nav-link') : [];
    if (!pill || !navLinks.length) return;

    // Only visible on desktop
    if (window.innerWidth < 768) return;

    const moveTo = (link) => {
        if (!link) return;
        const listRect = navList.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        pill.style.left  = (linkRect.left  - listRect.left)  + 'px';
        pill.style.width = linkRect.width + 'px';
        pill.classList.add('visible');
    };

    // Hover: move pill to hovered link
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => moveTo(link));
    });

    // Mouse leaves nav → move pill back to active link
    if (navList) {
        navList.addEventListener('mouseleave', () => {
            const active = navList.querySelector('.nav-link.active');
            if (active) moveTo(active); else pill.classList.remove('visible');
        });
    }

    // Scroll spy: update pill when active link changes
    // We piggyback on the MutationObserver watching class changes
    const observer = new MutationObserver(() => {
        const active = navList.querySelector('.nav-link.active');
        if (active) moveTo(active);
    });
    navLinks.forEach(link => {
        observer.observe(link, { attributes: true, attributeFilter: ['class'] });
    });

    // Initial position on first active link (if any)
    const initial = navList.querySelector('.nav-link.active');
    if (initial) moveTo(initial);
})();

/* ═══════════════════════════════════════════════════════
   20.  COPY EMAIL + TOAST
   Clicking the email contact card copies the address
   to the clipboard and shows a toast notification.
═══════════════════════════════════════════════════════ */
(function initCopyEmail() {
    const card  = document.getElementById('copy-email-card');
    const toast = document.getElementById('toast');
    const msg   = document.getElementById('toast-msg');
    if (!card || !toast) return;

    let toastTimer;

    const showToast = (text) => {
        msg.textContent = text;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
    };

    card.addEventListener('click', async e => {
        e.preventDefault();
        const email = card.getAttribute('data-email') || 'vishalsharmapks@gmail.com';

        try {
            await navigator.clipboard.writeText(email);
            showToast('Email copied to clipboard!');
        } catch {
            // Fallback: open mailto if clipboard denied
            window.location.href = `mailto:${email}`;
            showToast('Opening email client…');
        }
    });
})();
