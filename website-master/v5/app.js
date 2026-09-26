/* ==========================================================================
   INNOPIXEL.DK (V5) - INTERACTIVE JS CONTROLLER
   Background engines, micro-interactions, 3D tilts, filter systems, and sliders.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Core Layout & Navigation
    initHeader();
    initMobileNav();
    initScrollReveal();
    
    // Background Effects
    initBackgroundCanvas();
    
    // Interactive Elements
    initTiltCards();
    initProcessSwitcher();
    initPortfolioFilter();
    initProjectDrawer();
    
    // Technical Sandbox (on Process page)
    initSandboxCanvas();
});

/* --------------------------------------------------------------------------
   1. Header Scroll Effects & Active Navigation
   -------------------------------------------------------------------------- */
function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    // Handle scrolled background
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });

    // Automatically highlight active navigation link based on current path
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
   2. Mobile Navigation Sidebar Menu
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

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
            toggleBtn.classList.remove('open');
            navMenu.classList.remove('open');
        }
    });
}

/* --------------------------------------------------------------------------
   3. Scroll Reveal Entrance Animations (Intersection Observer)
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
                observer.unobserve(entry.target); // Trigger only once
            }
        });
    }, observerOptions);
    
    revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   4. Interactive Background Canvas (Crimson Pixel Node Network)
   -------------------------------------------------------------------------- */
function initBackgroundCanvas() {
    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    let mouse = { x: null, y: null, radius: 160 };
    
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

    // Particle representation
    class PixelParticle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 3 + 1; // 1 to 4px (square pixels)
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.baseAlpha = Math.random() * 0.4 + 0.15;
            this.alpha = this.baseAlpha;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off boundary walls
            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;

            // React to mouse proximity
            if (mouse.x != null && mouse.y != null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    // Push particles away slightly
                    let force = (mouse.radius - distance) / mouse.radius;
                    let angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * force * 1.5;
                    this.y += Math.sin(angle) * force * 1.5;
                    this.alpha = Math.min(1.0, this.baseAlpha + force * 0.5);
                } else {
                    if (this.alpha > this.baseAlpha) {
                        this.alpha -= 0.01;
                    }
                }
            } else {
                if (this.alpha > this.baseAlpha) {
                    this.alpha -= 0.01;
                }
            }
        }

        draw() {
            ctx.fillStyle = `rgba(255, 42, 95, ${this.alpha})`;
            // Render as square "pixels" to align with Innopixel identity
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    // Setup network nodes (approx 65 particles for desktop, 30 for mobile)
    const particleCount = Math.floor((width * height) / 22000);
    const count = Math.min(110, Math.max(25, particleCount));
    
    for (let i = 0; i < count; i++) {
        particles.push(new PixelParticle());
    }

    // Connect particles near each other
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 115) {
                    let alpha = (1 - (distance / 115)) * 0.15;
                    ctx.strokeStyle = `rgba(225, 29, 72, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation Loop
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
   5. 3D Tilt Hover Effect
   -------------------------------------------------------------------------- */
function initTiltCards() {
    const tiltCards = document.querySelectorAll('.tilt-card, .service-card');
    if (tiltCards.length === 0) return;
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position inside card
            const y = e.clientY - rect.top;  // y position inside card
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Maximum tilt angle of 6 degrees
            const tiltX = ((centerY - y) / centerY) * 6;
            const tiltY = ((x - centerX) / centerX) * 6;
            
            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

/* --------------------------------------------------------------------------
   6. Process Interactive Tab Switcher
   -------------------------------------------------------------------------- */
function initProcessSwitcher() {
    const btns = document.querySelectorAll('.process-step-btn');
    const cards = document.querySelectorAll('.process-display-card');
    
    if (btns.length === 0 || cards.length === 0) return;
    
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStep = btn.getAttribute('data-step');
            
            // Deactivate all buttons
            btns.forEach(b => b.classList.remove('active'));
            // Activate clicked button
            btn.classList.add('active');
            
            // Fade out current card and fade in target card
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
   7. Portfolio Categorization & Filter Controls
   -------------------------------------------------------------------------- */
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    if (filterBtns.length === 0 || projectCards.length === 0) return;
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active style from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-filter');
            
            projectCards.forEach(card => {
                const projectCat = card.getAttribute('data-category');
                
                if (category === 'all' || projectCat.includes(category)) {
                    card.style.display = 'flex';
                    // Trigger a tiny animation re-trigger
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
        });
    });
}

/* --------------------------------------------------------------------------
   8. Selected Project Drawer & Backdrop Logic
   -------------------------------------------------------------------------- */
// Mock project details database
const projectDetails = {
    'lillebaelt-ar': {
        title: 'Naturpark Lillebælt AR App',
        tags: ['Augmented Reality', 'EduTech', 'UX Design'],
        image: '../images/project_lillebaelt.png',
        intro: 'An interactive underwater exploration application developed to engage school children in the marine ecosystem of the Lillebælt nature park.',
        body: `
            <h4>The Challenge</h4>
            <p>Engaging children in environmental education can be challenging, especially when the subject is hidden beneath the ocean surface. Naturpark Lillebælt wanted an innovative solution that schools, museums, and visitors could use directly at the harbor docks to "see" underwater wildlife in real-time.</p>
            
            <h4>The Solution</h4>
            <p>Innopixel developed a custom markerless AR app. When users point their mobile devices toward the water surface, a virtual 3D ecosystem renders. Students can interact with native species (like porpoises, crabs, and cod), play educational quizzes, and log sightings.</p>
            
            <h4>Technical Integration</h4>
            <p>Built with Unity and AR Foundation, optimizing custom 3D low-poly models to run smoothly at 60fps on consumer devices. It includes a custom spatial sound design that makes players feel fully submerged.</p>
        `
    },
    'sensible-xr': {
        title: 'XR Turbine Maintenance Guide',
        tags: ['Extended Reality', 'Industrial Training', '3D Simulation'],
        image: '../images/project_turbine.png',
        intro: 'An advanced augmented reality training tool for technicians performing remote diagnostics and repair on complex offshore wind turbines.',
        body: `
            <h4>The Challenge</h4>
            <p>Offshore wind turbine maintenance is high-risk, expensive, and requires highly specialized skills. Errors during repair operations result in costly downtime. Our client needed a remote assistant guide that technicians could wear on-site to inspect turbine elements step-by-step.</p>
            
            <h4>The Solution</h4>
            <p>An immersive AR guide built for Microsoft HoloLens 2. The application overlays wireframe schematics, live diagnostic feeds, and vector directions directly over the physical wind turbine gears. Technicians can execute inspection checklists hands-free using hand gestures and voice controls.</p>
            
            <h4>Technical Integration</h4>
            <p>Built using MRTK (Mixed Reality Toolkit) and Unity. Integration with IoT sensors on the turbine allows real-time telemetry (RPM, heat levels) to stream directly into the technician's HUD.</p>
        `
    },
    'veterandykkerne': {
        title: 'Veterandykkerne - Havets Helte',
        tags: ['3D Simulation', 'Culture & History', 'Web Experience'],
        image: '../images/project_dive.png',
        intro: 'A digital memorial exhibition and immersive 3D simulation documenting the perilous underwater missions of Denmark\'s pioneer commercial divers.',
        body: `
            <h4>The Challenge</h4>
            <p>The history of pioneer divers who laid down the cables and pipelines in the North Sea is largely invisible. The Veterandykkerne organization wanted to preserve this heritage and educate the public on the physical toll and extreme conditions of historical diving.</p>
            
            <h4>The Solution</h4>
            <p>We created an interactive museum installation combining physical relics with a Virtual Reality diving helmet simulation. Users can put on a mock helmet and experience a simulated 1970s deep-sea dive, navigating through dark water, cold currents, and executing weld operations under pressure.</p>
            
            <h4>Technical Integration</h4>
            <p>Created detailed 3D models of vintage diving gear and environments. Rendered with custom lighting and particles in WebGL and WebXR to allow access from standard browsers as well as VR headsets.</p>
        `
    },
    'nfc-display': {
        title: 'ErhvervsTanken NFC Exhibition',
        tags: ['Taktil Media', 'NFC Hardware', 'Interactive Installation'],
        image: '../images/project_nfc.jpg',
        intro: 'A tangible exhibition table utilizing NFC hardware and 3D printing to guide teenagers through green transition career opportunities.',
        body: `
            <h4>The Challenge</h4>
            <p>Youth career exhibitions are often filled with flat screens and pamphlets that fail to hold teenagers' interest. ErhvervsTanken wanted a physical, tactile game that would spark curiosity about vocational schools in green energy.</p>
            
            <h4>The Solution</h4>
            <p>Innopixel designed and built a wooden smart table embedded with NFC sensors and glowing light tracks. Visitors pick up custom 3D-printed tokens representing different energy resources (wind blade, solar panel, hydrogen pipe) and slot them into sockets. The table reads the NFC tags and starts a projection-mapped visual showcasing how those energy choices affect a local town.</p>
            
            <h4>Technical Integration</h4>
            <p>Arduino/Raspberry Pi microcontrollers process sensor inputs, communicating with a custom front-end built in Node.js and HTML5 Canvas that drives the ultra-short-throw projector feed.</p>
        `
    },
    'lillebaelt-vr': {
        title: 'Lillebælt VR Ecosystem Game',
        tags: ['Virtual Reality', 'EduTech', 'Gamification'],
        image: '../images/project_lillebaelt_vr.png',
        intro: 'A classroom-focused VR simulator where students take on the role of marine biologists restoring a depleted harbor ecosystem.',
        body: `
            <h4>The Challenge</h4>
            <p>Understanding marine conservation requires seeing the macro-effects of human waste and agricultural runoff. Traditional classroom textbooks lack the immersion to drive emotional engagement with underwater conservation.</p>
            
            <h4>The Solution</h4>
            <p>An educational VR game where players dive into Lillebælt. Armed with a scanning tool, they identify pollutants, plant eelgrass meadows, build stone reefs, and watch marine life return. The simulation covers a 10-year span compressed into a 15-minute experience.</p>
            
            <h4>Technical Integration</h4>
            <p>Optimized for standalone VR headsets (Meta Quest 2/3) using Unity's Universal Render Pipeline (URP). It leverages active spatial audio and highly optimized water physics to simulate real underwater environments.</p>
        `
    },
    'jelling-metaverse': {
        title: 'Kongernes Jelling Metaverse Exhibit',
        tags: ['Metaverse', 'SynergyXR', 'Museum Exhibition'],
        image: '../images/project_jelling.png',
        intro: 'A collaborative virtual museum gallery designed for Kongernes Jelling, bringing Viking monuments to global classrooms in the metaverse.',
        body: `
            <h4>The Challenge</h4>
            <p>The Jelling runic stones and royal mounds are UNESCO heritage sites in Denmark. Due to distance and scale, many schools can never visit them physically. The museum wanted to create a collaborative virtual exhibition where guides could host digital school tours.</p>
            
            <h4>The Solution</h4>
            <p>We designed a custom virtual metaverse pavilion. Using SynergyXR, we imported high-fidelity photogrammetry scans of the Jelling mounds, runic stones, and archaeological finds. Museum educators can meet up with classes from around the world inside this virtual space as avatars, giving live, interactive presentations.</p>
            
            <h4>Technical Integration</h4>
            <p>Photogrammetry cleaning of large-scale scans, texturing, and rendering optimizations for cross-platform access across WebGL, HoloLens, PC VR, and mobile tablets.</p>
        `
    }
};

function initProjectDrawer() {
    const projectCards = document.querySelectorAll('.project-card');
    
    // Create elements dynamically if they don't exist
    let drawer = document.querySelector('.project-drawer');
    let backdrop = document.querySelector('.drawer-backdrop');
    
    if (projectCards.length === 0) return;
    
    if (!drawer) {
        drawer = document.createElement('div');
        drawer.className = 'project-drawer';
        drawer.innerHTML = `
            <button class="drawer-close" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
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

    function openDrawer(projectId) {
        const data = projectDetails[projectId];
        if (!data) return;

        // Render content
        let tagsHtml = data.tags.map(tag => `<span class="tech-tag">${tag}</span>`).join('');
        
        // Correct image path for root or subdirectory files
        // If we are currently inside v5/ page, images are at ../images
        drawerContent.innerHTML = `
            <div class="drawer-header">
                <div class="drawer-tags">${tagsHtml}</div>
                <h2>${data.title}</h2>
            </div>
            <img src="${data.image}" alt="${data.title}">
            <div class="drawer-body">
                <p class="section-desc" style="font-size:1.15rem; margin-bottom:2rem;"><strong>${data.intro}</strong></p>
                ${data.body}
            </div>
        `;

        drawer.classList.add('open');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop body scrolling
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        backdrop.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.getAttribute('data-project');
            openDrawer(projectId);
        });
    });

    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
}

/* --------------------------------------------------------------------------
   9. Interactive Code Sandbox Engine (on Process Page)
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

    let angleX = 0.005;
    let angleY = 0.008;
    let angleZ = 0.003;
    
    // Wireframe points of a 3D Sphere/Mesh representing 3D/VR capabilities
    let points = [];
    const numPoints = 80;
    const sphereRadius = Math.min(width, height) * 0.35;
    
    // Generate spherical coordinates
    for (let i = 0; i < numPoints; i++) {
        let lat = Math.acos((Math.random() * 2) - 1);
        let lon = Math.random() * 2 * Math.PI;
        
        let x = sphereRadius * Math.sin(lat) * Math.cos(lon);
        let y = sphereRadius * Math.sin(lat) * Math.sin(lon);
        let z = sphereRadius * Math.cos(lat);
        
        points.push({ x, y, z });
    }

    // Rotate point in 3D Space
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

    // Animation Loop
    function drawSandbox() {
        ctx.fillStyle = '#07070a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid coordinates in background
        ctx.strokeStyle = 'rgba(255, 42, 95, 0.02)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 30) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }
        for (let i = 0; i < height; i += 30) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        }

        ctx.save();
        ctx.translate(width / 2, height / 2);
        
        // Rotate and project points
        let projected = [];
        points.forEach(p => {
            let rotated = rotateX(p, angleX);
            rotated = rotateY(rotated, angleY);
            rotated = rotateZ(rotated, angleZ);
            
            // Perspective Projection
            let distance = 300;
            let fov = 400;
            let scale = fov / (fov + rotated.z);
            let projX = rotated.x * scale;
            let projY = rotated.y * scale;
            
            projected.push({ x: projX, y: projY, z: rotated.z, size: scale * 2 });
            
            // Update points back in main array
            p.x = rotated.x;
            p.y = rotated.y;
            p.z = rotated.z;
        });

        // Draw connections/wireframe
        for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
                let dx = projected[i].x - projected[j].x;
                let dy = projected[i].y - projected[j].y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 75) {
                    let alpha = (1 - (dist / 75)) * 0.15;
                    ctx.strokeStyle = `rgba(255, 42, 95, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(projected[i].x, projected[i].y);
                    ctx.lineTo(projected[j].x, projected[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw nodes
        projected.forEach(p => {
            let opacity = (p.z + sphereRadius) / (sphereRadius * 2) * 0.6 + 0.2;
            ctx.fillStyle = `rgba(255, 42, 95, ${opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            if (p.z < -sphereRadius + 30) {
                // Glow core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
        
        // Oscillate angles
        angleX += 0.001;
        angleY += 0.0015;
        
        requestAnimationFrame(drawSandbox);
    }
    
    drawSandbox();
}
