/* ==========================================================================
   INNOPIXEL.DK (V6) - LIGHT THEME INTERACTIVE CONTROLLER
   Pixel trails, 3D tilt effects, navigation toggles, case studies, and sandbox renderers.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Switch
    initThemeToggle();
    
    // Update logo based on initial theme
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateLogo(initialTheme);
    
    // Core Navigation & Layout
    initHeader();
    initMobileNav();
    initScrollReveal();
    
    // Background Effects
    initBackgroundCanvas();
    
    // Interactive UI
    initTiltCards();
    init3DCarousel();
    initProcessSwitcher();
    initPortfolioFilter();
    initProjectDrawer();
    
    // Technical Sandbox
    initSandboxCanvas();
});

/* --------------------------------------------------------------------------
   1. Sticky Header & Active Nav Highlighter
   -------------------------------------------------------------------------- */
function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });

    const navLinks = document.querySelectorAll('.nav-link');
    const path = window.location.pathname;
    const pageName = path.split("/").pop() || 'index.html';
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === pageName || (pageName === 'index.html' && href === 'index.html') || (pageName === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/* --------------------------------------------------------------------------
   2. Mobile Hamburger Toggle Menu
   -------------------------------------------------------------------------- */
function initMobileNav() {
    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav');
    
    if (!toggleBtn || !navMenu) return;
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBtn.classList.toggle('open');
        navMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
            toggleBtn.classList.remove('open');
            navMenu.classList.remove('open');
        }
    });
}

/* --------------------------------------------------------------------------
   3. Scroll Reveal Transitions (Intersection Observer)
   -------------------------------------------------------------------------- */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (revealElements.length === 0) return;
    
    const observerOptions = {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   4. Background Canvas (Light Grey Pixel Nodes with Crimson Hover Trail)
   -------------------------------------------------------------------------- */
function initBackgroundCanvas() {
    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let mouse = { x: null, y: null, radius: 150 };
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });
    
    window.addEventListener('resize', () => {
        width = (canvas.width = window.innerWidth);
        height = (canvas.height = window.innerHeight);
    });

    class LightParticle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 3 + 1; // 1 to 4px squares
            this.speedX = (Math.random() - 0.5) * 0.35;
            this.speedY = (Math.random() - 0.5) * 0.35;
            this.baseAlpha = Math.random() * 0.2 + 0.1;
            this.alpha = this.baseAlpha;
            this.colorMode = 'grey'; // 'grey', 'red', 'orange'
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;

            if (mouse.x != null && mouse.y != null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    let force = (mouse.radius - distance) / mouse.radius;
                    let angle = Math.atan2(dy, dx);
                    
                    // Gentle push
                    this.x += Math.cos(angle) * force * 1.2;
                    this.y += Math.sin(angle) * force * 1.2;
                    this.alpha = Math.min(0.85, this.baseAlpha + force * 0.6);
                    
                    // Transition to branding colors under the mouse
                    this.colorMode = Math.random() > 0.45 ? 'red' : 'orange';
                } else {
                    this.alpha = Math.max(this.baseAlpha, this.alpha - 0.015);
                    if (this.alpha === this.baseAlpha) this.colorMode = 'grey';
                }
            } else {
                this.alpha = Math.max(this.baseAlpha, this.alpha - 0.015);
                if (this.alpha === this.baseAlpha) this.colorMode = 'grey';
            }
        }

        draw() {
            if (this.colorMode === 'red') {
                ctx.fillStyle = `rgba(225, 29, 72, ${this.alpha})`;
            } else if (this.colorMode === 'orange') {
                ctx.fillStyle = `rgba(249, 115, 22, ${this.alpha})`;
            } else {
                ctx.fillStyle = `rgba(100, 116, 139, ${this.alpha})`; // Slate grey
            }
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    const particleCount = Math.floor((width * height) / 24000);
    const count = Math.min(100, Math.max(20, particleCount));
    
    for (let i = 0; i < count; i++) {
        particles.push(new LightParticle());
    }

    function drawConnections() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const lineRgb = isDark ? '248, 250, 252' : '15, 23, 42';
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 110) {
                    let alpha = (1 - (distance / 110)) * 0.06;
                    ctx.strokeStyle = `rgba(${lineRgb}, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawConnections();
        requestAnimationFrame(animate);
    }
    
    animate();
}

/* --------------------------------------------------------------------------
   5. 3D Card Hover Tilt Physics
   -------------------------------------------------------------------------- */
function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card, .service-card');
    if (cards.length === 0) return;
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const tiltX = ((centerY - y) / centerY) * 5; // Max 5 degrees
            const tiltY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

/* --------------------------------------------------------------------------
   6. Process Switcher / Slider
   -------------------------------------------------------------------------- */
function initProcessSwitcher() {
    const btns = document.querySelectorAll('.process-step-btn');
    const cards = document.querySelectorAll('.process-display-card');
    
    if (btns.length === 0 || cards.length === 0) return;
    
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStep = btn.getAttribute('data-step');
            
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            cards.forEach(card => {
                if (card.getAttribute('data-step') === targetStep) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        });
    });
}

/* --------------------------------------------------------------------------
   7. Portfolio Filtration
   -------------------------------------------------------------------------- */
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const euToggle = document.getElementById('eu-toggle');
    
    if (projectCards.length === 0) return;
    
    let activeCategory = 'all';
    let euOnly = false;
    
    function applyFilters() {
        projectCards.forEach(card => {
            const projectCat = card.getAttribute('data-category') || '';
            const isEuFunded = card.getAttribute('data-eu-funded') === 'true';
            
            const matchesCategory = (activeCategory === 'all' || projectCat.includes(activeCategory));
            const matchesEu = (!euOnly || isEuFunded);
            
            if (matchesCategory && matchesEu) {
                card.style.display = 'flex';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0) scale(1)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px) scale(0.95)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    }
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                activeCategory = btn.getAttribute('data-filter');
                applyFilters();
            });
        });
    }
    
    if (euToggle) {
        euToggle.addEventListener('change', () => {
            euOnly = euToggle.checked;
            applyFilters();
        });
    }
}

/* --------------------------------------------------------------------------
   8. Selected Project Drawer & Backdrop Logic (Light Theme Styled)
   -------------------------------------------------------------------------- */
function initProjectDrawer() {
    const projectCards = document.querySelectorAll('.project-card');
    
    let drawer = document.querySelector('.project-drawer');
    let backdrop = document.querySelector('.drawer-backdrop');
    
    if (projectCards.length === 0) return;
    
    if (!drawer) {
        drawer = document.createElement('div');
        drawer.className = 'project-drawer';
        drawer.innerHTML = `
            <button class="drawer-close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="drawer-content"></div>
        `;
        document.body.appendChild(drawer);
    }
    
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'drawer-backdrop';
        document.body.appendChild(backdrop);
    }

    const drawerContent = drawer.querySelector('.drawer-content');
    const closeBtn = drawer.querySelector('.drawer-close');
    
    let translationsCache = null;

    async function loadTranslations() {
        if (translationsCache) return translationsCache;
        const isDanish = window.location.pathname.includes('/da/');
        const relativePath = isDanish ? '../translations.json' : 'translations.json';
        try {
            const response = await fetch(relativePath);
            translationsCache = await response.json();
            return translationsCache;
        } catch (err) {
            console.error('Failed to load translations:', err);
            return null;
        }
    }

    async function openDrawer(projectId) {
        const dataSet = await loadTranslations();
        if (!dataSet) return;

        const isDanish = window.location.pathname.includes('/da/');
        const lang = isDanish ? 'da' : 'en';
        const project = dataSet[lang]?.projects?.[projectId];
        if (!project) return;

        let tagsHtml = project.tags.map(tag => `<span class="theme-tag">${tag}</span>`).join('');
        
        let imgPath = project.image;
        if (isDanish) {
            imgPath = imgPath.replace('../images/', '../../images/');
        }
        
        drawerContent.innerHTML = `
            <div class="drawer-header">
                <div class="drawer-tags">${tagsHtml}</div>
                <h2>${project.title}</h2>
            </div>
            <img src="${imgPath}" alt="${project.title}">
            <div class="drawer-body">
                <p class="section-desc" style="font-size:1.1rem; margin-bottom:2rem; color:var(--text-primary);"><strong>${project.intro}</strong></p>
                ${project.body}
            </div>
        `;

        drawer.classList.add('open');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        backdrop.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.getAttribute('data-project');
            window.location.href = `projects/${projectId}.html`;
        });
    });

    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
}

/* --------------------------------------------------------------------------
   9. WebGL Technical Sandbox Engine (Light Theme Wireframe)
   -------------------------------------------------------------------------- */
function initSandboxCanvas() {
    const canvas = document.getElementById('sandbox-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight || 350);
    
    window.addEventListener('resize', () => {
        if (!canvas.parentElement) return;
        width = (canvas.width = canvas.parentElement.clientWidth);
        height = (canvas.height = canvas.parentElement.clientHeight || 350);
    });

    const speedX = 0.0015;
    const speedY = 0.0022;
    const speedZ = 0.0008;
    
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const dragSensitivity = 0.004;
    
    let points = [];
    const numPoints = 75;
    const sphereRadius = Math.min(width, height) * 0.35;
    
    for (let i = 0; i < numPoints; i++) {
        let lat = Math.acos((Math.random() * 2) - 1);
        let lon = Math.random() * 2 * Math.PI;
        
        let x = sphereRadius * Math.sin(lat) * Math.cos(lon);
        let y = sphereRadius * Math.sin(lat) * Math.sin(lon);
        let z = sphereRadius * Math.cos(lat);
        
        points.push({ x, y, z });
    }

    function rotateX(point, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let y = point.y * cos - point.z * sin;
        let z = point.y * sin + point.z * cos;
        return { x: point.x, y, z };
    }

    function rotateY(point, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let x = point.x * cos + point.z * sin;
        let z = -point.x * sin + point.z * cos;
        return { x, y: point.y, z };
    }

    function rotateZ(point, angle) {
        let cos = Math.cos(angle);
        let sin = Math.sin(angle);
        let x = point.x * cos - point.y * sin;
        let y = point.x * sin + point.y * cos;
        return { x, y, z: point.z };
    }

    function drawSandbox() {
        ctx.fillStyle = '#ffffff'; // White canvas preview to match light theme
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid lines in light grey
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.025)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 30) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }
        for (let i = 0; i < height; i += 30) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        }

        ctx.save();
        ctx.translate(width / 2, height / 2);
        
        let projected = [];
        points.forEach(p => {
            let rotated = p;
            if (!isDragging) {
                rotated = rotateX(p, speedX);
                rotated = rotateY(rotated, speedY);
                rotated = rotateZ(rotated, speedZ);
            }
            
            let distance = 300;
            let fov = 400;
            let scale = fov / (fov + rotated.z);
            let projX = rotated.x * scale;
            let projY = rotated.y * scale;
            
            projected.push({ x: projX, y: projY, z: rotated.z, size: scale * 1.8 });
            
            p.x = rotated.x;
            p.y = rotated.y;
            p.z = rotated.z;
        });

        // Draw connecting lines in Crimson Red (Light Opacity)
        for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
                let dx = projected[i].x - projected[j].x;
                let dy = projected[i].y - projected[j].y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 70) {
                    let alpha = (1 - (dist / 70)) * 0.22;
                    ctx.strokeStyle = `rgba(225, 29, 72, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(projected[i].x, projected[i].y);
                    ctx.lineTo(projected[j].x, projected[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes in Crimson Red
        projected.forEach(p => {
            let opacity = (p.z + sphereRadius) / (sphereRadius * 2) * 0.5 + 0.3;
            ctx.fillStyle = `rgba(225, 29, 72, ${opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw bright white core for nodes near the front
            if (p.z < -sphereRadius + 40) {
                ctx.fillStyle = '#f97316'; // Sunset orange core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
        
        requestAnimationFrame(drawSandbox);
    }
    
    // Interactive mouse drag and touch rotation bindings
    canvas.style.cursor = 'grab';
    
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        let deltaX = e.clientX - previousMousePosition.x;
        let deltaY = e.clientY - previousMousePosition.y;
        
        points.forEach(p => {
            // Horizontal drag rotates around Y axis (flipped axis), vertical drag around X axis
            let rotated = rotateY(p, -deltaX * dragSensitivity);
            rotated = rotateX(rotated, deltaY * dragSensitivity);
            
            p.x = rotated.x;
            p.y = rotated.y;
            p.z = rotated.z;
        });

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            canvas.style.cursor = 'grab';
        }
    });

    // Touch Support for Mobile
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        
        let deltaX = e.touches[0].clientX - previousMousePosition.x;
        let deltaY = e.touches[0].clientY - previousMousePosition.y;
        
        points.forEach(p => {
            let rotated = rotateY(p, -deltaX * dragSensitivity);
            rotated = rotateX(rotated, deltaY * dragSensitivity);
            
            p.x = rotated.x;
            p.y = rotated.y;
            p.z = rotated.z;
        });

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    drawSandbox();
}

/* --------------------------------------------------------------------------
   9. Theme Toggle Switch
   -------------------------------------------------------------------------- */
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateLogo(newTheme);
    });
}

/* --------------------------------------------------------------------------
   10. CSS 3D Partners Carousel (GPU-accelerated Cylindrical Spin & Drag Physics)
   -------------------------------------------------------------------------- */
function init3DCarousel() {
    const container = document.querySelector('.carousel-3d-container');
    const track = document.querySelector('.carousel-3d-track');
    if (!container || !track) return;
    
    // Directory folder path: images/logos/
    const PARTNER_LOGOS = [
        { name: "3D College", file: "3d-college.png" },
        { name: "AM Tooling", file: "amtoolinglogo.svg" },
        { name: "Clobotics", file: "clobotics-logo-dark.png" },
        { name: "DVC", file: "dvc-Logo.webp" },
        { name: "Egeskov", file: "egeskov.svg" },
        { name: "Esbjerg Havn", file: "esbjerg havn.svg" },
        { name: "Fayard", file: "fayard-logo.png" },
        { name: "Kongernes Jelling", file: "kongernes-jelling-da.svg" },
        { name: "KUI", file: "KUI logo mørkt.svg" },
        { name: "K–G-lava", file: "K–G-lava_800px.webp" },
        { name: "Logo", file: "Logo-svg.svg" },
        { name: "Wacky Studio", file: "logo-wacky-studio.svg" },
        { name: "Naturpark Lillebælt", file: "Naturpark-Lillebªlt_logo_u-payoff_CMYK-1.png" },
        { name: "Nordjyllands Fonden", file: "NF logo white.svg" },
        { name: "Nordjyllands Fonden Color", file: "Nordjyllands_Fonden_logo_rgb_88pxh_18385634e6.png" },
        { name: "SynergyXR", file: "synergyxr.svg" }
    ];

    // Ensure we have at least 15 cards for a seamless circular visual representation
    const TARGET_CARD_COUNT = 15;
    let finalLogos = [...PARTNER_LOGOS];
    while (finalLogos.length < TARGET_CARD_COUNT) {
        finalLogos = finalLogos.concat(PARTNER_LOGOS);
    }
    // Limit to target count
    if (finalLogos.length > TARGET_CARD_COUNT) {
        finalLogos = finalLogos.slice(0, TARGET_CARD_COUNT);
    }

    const cardCount = finalLogos.length;
    const cardWidth = 162; // px (35% scaled-up card size)
    const angleStep = 360 / cardCount;
    // Calculate radius dynamically to keep spacing at exactly 10% of card width
    // R = (1.1 * W) / (2 * sin(180 / N))
    const spacingMultiplier = 1.1; // card width + 10% spacing gap
    const radius = Math.round((spacingMultiplier * cardWidth) / (2 * Math.sin(Math.PI / cardCount)));

    // Set CSS custom property dynamically on the track/container
    container.style.setProperty('--carousel-radius', `${radius}px`);

    // Clean out and build the cards dynamically
    track.innerHTML = '';
    
    const isLocalFileProtocol = window.location.protocol === 'file:';

    finalLogos.forEach((logo, index) => {
        const angle = index * angleStep;
        
        // Create card container
        const card = document.createElement('div');
        card.className = 'carousel-3d-card';
        card.title = logo.name;
        // Position card dynamically in 3D cylinder orbit
        card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
        card.dataset.angle = angle;

        // Create 3D block faces
        const faceBack = document.createElement('div');
        faceBack.className = 'carousel-3d-card-face carousel-3d-card-back';
        
        const faceTop = document.createElement('div');
        faceTop.className = 'carousel-3d-card-face carousel-3d-card-top';
        
        const faceBottom = document.createElement('div');
        faceBottom.className = 'carousel-3d-card-face carousel-3d-card-bottom';
        
        const faceLeft = document.createElement('div');
        faceLeft.className = 'carousel-3d-card-face carousel-3d-card-left';
        
        const faceRight = document.createElement('div');
        faceRight.className = 'carousel-3d-card-face carousel-3d-card-right';
        
        const faceFront = document.createElement('div');
        faceFront.className = 'carousel-3d-card-face carousel-3d-card-front';

        // Create inner wrapper
        const inner = document.createElement('div');
        inner.className = 'carousel-3d-card-inner';

        // Load logo with prefix check for subdirectories (like /da/)
        const pathPrefix = window.location.pathname.includes('/da/') ? '../' : '';
        const logoPath = `${pathPrefix}images/logos/${logo.file}`;
        
        if (isLocalFileProtocol || !logo.file.endsWith('.svg')) {
            // CORS-safe standard image tag fallback for local files (file://) or raster formats
            const img = document.createElement('img');
            img.src = logoPath;
            img.className = 'partner-svg';
            img.alt = logo.name;
            inner.appendChild(img);
        } else {
            // Dynamic fetch-and-inject to enable theme-adaptive CSS properties (like currentColor)
            fetch(logoPath)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load logo asset');
                    return response.text();
                })
                .then(svgText => {
                    inner.innerHTML = svgText;
                    const svgElement = inner.querySelector('svg');
                    if (svgElement) {
                        svgElement.classList.add('partner-svg');
                    }
                })
                .catch(() => {
                    // Fail-safe image tag fallback
                    inner.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = logoPath;
                    img.className = 'partner-svg';
                    img.alt = logo.name;
                    inner.appendChild(img);
                });
        }

        faceFront.appendChild(inner);
        
        card.appendChild(faceBack);
        card.appendChild(faceTop);
        card.appendChild(faceBottom);
        card.appendChild(faceLeft);
        card.appendChild(faceRight);

        // Create 12 corner strips (3 per corner) to round the 3D block
        // Card dimensions: W = 162, H = 60, Corner radius = 6. Card center is (81, 30).
        const corners = [
            { name: 'tl', cx: -75, cy: -24, startAngle: 180 },
            { name: 'tr', cx: 75,  cy: -24, startAngle: 270 },
            { name: 'br', cx: 75,  cy: 24,  startAngle: 0 },
            { name: 'bl', cx: -75, cy: 24,  startAngle: 90 }
        ];

        corners.forEach(corner => {
            for (let i = 0; i < 3; i++) {
                // Angle of this segment (centered at 15, 45, 75 degrees into the 90deg corner arc)
                const segmentAngle = corner.startAngle + 15 + i * 30;
                const rad = (segmentAngle * Math.PI) / 180;
                
                // Calculate position on the arc relative to card center
                const x = corner.cx + 6 * Math.cos(rad);
                const y = corner.cy + 6 * Math.sin(rad);
                
                // Create a wrapper to separate translation and Z-rotation from local Y-rotation
                const wrapper = document.createElement('div');
                wrapper.className = 'carousel-3d-card-face carousel-3d-card-corner-wrapper';
                wrapper.style.transform = `translateX(${x.toFixed(2)}px) translateY(${y.toFixed(2)}px) rotateZ(${segmentAngle}deg)`;
                
                const strip = document.createElement('div');
                strip.className = `carousel-3d-card-corner-strip carousel-3d-card-corner-${corner.name}`;
                strip.style.transform = 'rotateY(90deg)';
                
                wrapper.appendChild(strip);
                card.appendChild(wrapper);
            }
        });

        card.appendChild(faceFront);
        
        track.appendChild(card);
    });

    let rotationAngle = 0;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    let autoSpinSpeed = -0.15; // degrees per frame
    let dragVelocity = 0;
    let animFrameId = null;
    
    function updateRotation() {
        if (!isDragging) {
            rotationAngle += autoSpinSpeed + dragVelocity;
            dragVelocity *= 0.95; // apply friction to drag inertia
        }
        track.style.transform = `rotateX(-15deg) rotateY(${rotationAngle}deg)`;
        
        // Hide and fade cards based on Y rotation relative to the front
        const cards = track.querySelectorAll('.carousel-3d-card');
        cards.forEach((card) => {
            const angle = parseFloat(card.dataset.angle);
            const cardRelativeAngle = (angle + rotationAngle) % 360;
            const rad = (cardRelativeAngle * Math.PI) / 180;
            const cosVal = Math.cos(rad);
            
            if (cosVal <= 0) {
                // Back half of cylinder: hide card and set opacity to 0
                card.style.visibility = 'hidden';
                card.style.setProperty('--card-opacity', '0');
            } else {
                card.style.visibility = 'visible';
                
                // Fade transition range:
                // Full visibility at cosVal >= 0.3 (~72.5 degrees)
                // Smooth linear fade-out from cosVal = 0.3 down to 0.0 (90 degrees)
                let opacity = 1.0;
                if (cosVal < 0.3) {
                    opacity = cosVal / 0.3;
                }
                card.style.setProperty('--card-opacity', opacity.toFixed(3));
            }
        });
        
        animFrameId = requestAnimationFrame(updateRotation);
    }
    
    // Mouse Interaction
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        dragVelocity = 0;
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        currentX = e.clientX;
        const deltaX = currentX - startX;
        startX = currentX;
        rotationAngle += deltaX * 0.25; // 0.25 deg rotation per px drag
        dragVelocity = deltaX * 0.25;
    });
    
    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Touch Interaction
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        dragVelocity = 0;
    }, { passive: true });
    
    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        startX = currentX;
        rotationAngle += deltaX * 0.25;
        dragVelocity = deltaX * 0.25;
    }, { passive: true });
    
    container.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    // Hover Interaction: Pause Auto-spin
    container.addEventListener('mouseenter', () => {
        autoSpinSpeed = 0;
    });
    container.addEventListener('mouseleave', () => {
        autoSpinSpeed = -0.15;
    });
    
    updateRotation();
}

/* --------------------------------------------------------------------------
   11. Dynamic Logo Switcher (Light vs. Dark Theme Logos)
   -------------------------------------------------------------------------- */
function updateLogo(theme) {
    const logoImgs = document.querySelectorAll('.logo-img');
    logoImgs.forEach(logoImg => {
        const src = logoImg.getAttribute('src');
        if (!src) return;
        
        const prefix = src.includes('../../') ? '../../' : '../';
        if (theme === 'dark') {
            logoImg.src = prefix + 'images/logo-innopixel-white-text.svg';
        } else {
            logoImg.src = prefix + 'images/logo-innopixel.svg';
        }
    });
}
