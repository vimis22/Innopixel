/* ==========================================================================
   Innopixel Interactive Scripts - Multi-Page Version
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initLanguageSwitcher();
    initThemeToggle();
    initActiveNav();
    initHeader();
    initMobileNav();
    initScrollAnimations();
    initTiltCards();
    initBackgroundCanvas();
    initSandboxCanvas();
    initProjectDrawer();
    initContactForm();
});

/* --------------------------------------------------------------------------
   00. Language Switcher (Danish / English)
   -------------------------------------------------------------------------- */
let translationsCache = null;

async function loadTranslations() {
    if (translationsCache) return translationsCache;
    try {
        const response = await fetch('translations.json');
        translationsCache = await response.json();
        return translationsCache;
    } catch (err) {
        console.error('Failed to load translations:', err);
        return null;
    }
}

function initLanguageSwitcher() {
    const langBtns = document.querySelectorAll('.lang-btn');
    if (langBtns.length === 0) return;

    const getCurrentLang = () => document.documentElement.getAttribute('lang') || localStorage.getItem('lang') || 'da';

    async function applyLanguage(lang) {
        document.documentElement.setAttribute('lang', lang);
        localStorage.setItem('lang', lang);

        langBtns.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const data = await loadTranslations();
        if (!data || !data[lang]) return;

        const langData = data[lang];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = getNestedValue(langData, key);
            if (val) el.textContent = val;
        });

        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const val = getNestedValue(langData, key);
            if (val) el.innerHTML = val;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = getNestedValue(langData, key);
            if (val) el.setAttribute('placeholder', val);
        });
    }

    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    const initialLang = getCurrentLang();
    applyLanguage(initialLang);

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetLang = btn.getAttribute('data-lang');
            applyLanguage(targetLang);
        });
    });
}

/* --------------------------------------------------------------------------
   0. Theme Switcher (Dark / Light Mode)
   -------------------------------------------------------------------------- */
function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    const getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';

    const setTheme = (theme, save = true) => {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            toggleBtn.setAttribute('aria-label', 'Skift til mørk tilstand');
            toggleBtn.setAttribute('title', 'Skift til mørk tilstand');
        } else {
            document.documentElement.removeAttribute('data-theme');
            toggleBtn.setAttribute('aria-label', 'Skift til lys tilstand');
            toggleBtn.setAttribute('title', 'Skift til lys tilstand');
        }

        document.querySelectorAll('.header .logo img').forEach(img => {
            img.src = theme === 'light' ? 'images/logo-innopixel.svg' : 'images/logo-innopixel-white-text.svg';
        });

        document.querySelectorAll('.footer .logo img').forEach(img => {
            img.src = 'images/logo-innopixel-white-text.svg';
        });

        if (save) {
            localStorage.setItem('theme', theme);
        }
        window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme } }));
    };

    const currentTheme = getTheme();
    setTheme(currentTheme, false);

    toggleBtn.addEventListener('click', () => {
        const activeTheme = getTheme();
        const newTheme = activeTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme, true);
    });

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'light' : 'dark', false);
        }
    });
}

/* --------------------------------------------------------------------------
   1. Active Navigation Highlighting
   -------------------------------------------------------------------------- */
function initActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const path = window.location.pathname;
    const page = path.split("/").pop(); // Gets filename, e.g., "ydelser.html"
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        // Handle matching for home folder path or index.html
        if (href === page || 
            (href === 'index.html' && (page === '' || page === 'index.html')) ||
            (page && page.includes(href))) {
            link.classList.add('active');
        }
    });
}

/* --------------------------------------------------------------------------
   2. Header Scroll Effect
   -------------------------------------------------------------------------- */
function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });
}

/* --------------------------------------------------------------------------
   3. Mobile Navigation
   -------------------------------------------------------------------------- */
function initMobileNav() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const nav = document.querySelector('.nav');
    const links = document.querySelectorAll('.nav-link');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle.classList.toggle('open');
        nav.classList.toggle('open');
    });

    // Close when clicking link
    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('open');
            nav.classList.remove('open');
        });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            toggle.classList.remove('open');
            nav.classList.remove('open');
        }
    });
}

/* --------------------------------------------------------------------------
   4. Scroll Entrance Animations
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
    const animElements = document.querySelectorAll('.animate-on-scroll');
    if (animElements.length === 0) return;

    // Scroll Entrance Observer
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.15 });

    animElements.forEach(el => animObserver.observe(el));
}

/* --------------------------------------------------------------------------
   5. 3D Card Hover Effects (Tilt)
   -------------------------------------------------------------------------- */
function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    if (cards.length === 0) return;
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left; 
            const y = e.clientY - rect.top;  
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt angle based on cursor offset from card center
            const tiltX = (centerY - y) / centerY * 8; // Max 8 degrees tilt
            const tiltY = (x - centerX) / centerX * 8;
            
            card.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-5px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

/* --------------------------------------------------------------------------
   6. Interactive Background Canvas (Pixel Network)
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
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initParticles();
    });
    
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.size = Math.random() * 2 + 1; // 1 to 3px
            this.baseColor = Math.random() > 0.5 ? 'rgba(255, 125, 0, ' : 'rgba(255, 67, 68, ';
            this.alpha = Math.random() * 0.4 + 0.1; // 0.1 to 0.5
        }
        
        update() {
            // Edge bounce/wrap
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
            
            // Mouse proximity repulsion
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    // Displace particle away from cursor
                    this.x += Math.cos(angle) * force * 1.5;
                    this.y += Math.sin(angle) * force * 1.5;
                }
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const effectiveAlpha = isLight ? Math.min(this.alpha + 0.2, 0.75) : this.alpha;
            ctx.fillStyle = this.baseColor + effectiveAlpha + ')';
            ctx.fill();
        }
    }
    
    function initParticles() {
        particles = [];
        // Scale particle count by screen resolution
        const count = Math.floor((width * height) / 10000);
        const clampedCount = Math.min(Math.max(count, 40), 120);
        for (let i = 0; i < clampedCount; i++) {
            particles.push(new Particle());
        }
    }
    
    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Draw connecting lines if particles are close
                if (dist < 130) {
                    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
                    const maxOpacity = isLight ? 0.3 : 0.15;
                    const opacity = (1 - dist / 130) * maxOpacity;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(255, 67, 68, ${opacity})`;
                    ctx.lineWidth = isLight ? 0.75 : 0.5;
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
        drawLines();
        requestAnimationFrame(animate);
    }
    
    initParticles();
    animate();
}

/* --------------------------------------------------------------------------
   7. Interactive Sandbox Canvas (Spring Grid)
   -------------------------------------------------------------------------- */
function initSandboxCanvas() {
    const canvas = document.getElementById('sandbox-canvas');
    if (!canvas) return;
    const wrapper = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    let mouse = { x: null, y: null, prevX: null, prevY: null, isMoving: false, radius: 90 };
    let mode = 'attract'; // 'attract' or 'repel'
    
    // Physics constants
    const friction = 0.85;
    const springStrength = 0.08;
    
    function resize() {
        width = canvas.width = wrapper.clientWidth;
        height = canvas.height = wrapper.clientHeight;
        initGrid();
    }
    
    class GridParticle {
        constructor(homeX, homeY) {
            this.x = homeX;
            this.y = homeY;
            this.homeX = homeX;
            this.homeY = homeY;
            this.vx = 0;
            this.vy = 0;
            // Characteristic Innopixel gradient colors based on coordinates
            const colorRatio = (homeX / width) + (homeY / height) / 2;
            if (colorRatio < 0.4) {
                this.color = '#ff7d00'; // Orange
            } else if (colorRatio < 0.75) {
                this.color = '#ff4344'; // Red
            } else {
                this.color = '#ff007f'; // Magenta
            }
            this.size = 3.5; 
        }
        
        update() {
            // 1. Return spring force (pulls back to base position)
            const springForceX = (this.homeX - this.x) * springStrength;
            const springForceY = (this.homeY - this.y) * springStrength;
            
            this.vx += springForceX;
            this.vy += springForceY;
            
            // 2. Mouse interactions
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius; // 0 to 1
                    const angle = Math.atan2(dy, dx);
                    
                    if (mode === 'repel') {
                        this.vx += Math.cos(angle) * force * 3;
                        this.vy += Math.sin(angle) * force * 3;
                    } else if (mode === 'attract') {
                        this.vx -= Math.cos(angle) * force * 3;
                        this.vy -= Math.sin(angle) * force * 3;
                    }
                }
            }
            
            // 3. Friction & Movement
            this.vx *= friction;
            this.vy *= friction;
            this.x += this.vx;
            this.y += this.vy;
        }
        
        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
    }
    
    function initGrid() {
        particles = [];
        const spacing = 18;
        const cols = Math.floor(width / spacing);
        const rows = Math.floor(height / spacing);
        const marginX = (width - (cols * spacing)) / 2 + spacing/2;
        const marginY = (height - (rows * spacing)) / 2 + spacing/2;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = marginX + c * spacing;
                const y = marginY + r * spacing;
                particles.push(new GridParticle(x, y));
            }
        }
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    wrapper.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    
    wrapper.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });
    
    wrapper.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        particles.forEach(p => {
            const dx = p.x - clickX;
            const dy = p.y - clickY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 120) {
                const angle = Math.atan2(dy, dx);
                const explosionForce = (120 - dist) / 6;
                p.vx += Math.cos(angle) * explosionForce;
                p.vy += Math.sin(angle) * explosionForce;
            }
        });
    });
    
    // Control Buttons
    const buttons = document.querySelectorAll('.btn-control[data-mode]');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.getAttribute('data-mode');
        });
    });
    
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            particles.forEach(p => {
                p.x = Math.random() * width;
                p.y = Math.random() * height;
                p.vx = (Math.random() - 0.5) * 10;
                p.vy = (Math.random() - 0.5) * 10;
            });
        });
    }
    
    window.addEventListener('resize', resize);
    resize();
    animate();
}

/* --------------------------------------------------------------------------
   8. Project Detail Drawer Logic
   -------------------------------------------------------------------------- */
const PROJECT_DATA = {
    'lillebaelt-ar': {
        title: 'Naturpark Lillebælt AR',
        tag: 'Augmented Reality / EduTech',
        client: 'Naturpark Lillebælt',
        tech: 'Unity, AR Foundation, C#, Blender',
        img: 'images/project_lillebaelt.png',
        desc: `
            <p>Naturpark Lillebælt AR er en pædagogisk læringsapplikation skabt til at bringe havmiljøet tættere på skoleklasser og kystens gæster. Projektet blev til ud fra et ønske om at skabe øget bevidsthed om bæredygtighed og maritimt dyreliv i det lokale bælte.</p>
            <p>Gennem interaktive Augmented Reality-oplevelser kan eleverne scanne fysiske poster opstillet langs kysten for at åbne en virtuel undervandsverden. Her kan de observere marsvin, tangskove, torsk og krabber i detaljerede 3D-modeller, samt lytte til marsvinesang og bølgesvulp.</p>
            <p>Appen indeholder desuden gamificerede elementer såsom naturfaglige quizzer, viden-missioner og en digital samlebog, som sikrer højt engagement og fastholdelse. Projektet er et stærkt eksempel på, hvordan legende digital teknologi og fysisk naturformidling kan smelte sammen.</p>
        `
    },
    'sensible-xr': {
        title: 'Sensible - XR Turbine Maintenance',
        tag: 'Extended Reality / Industri',
        client: 'Sensible ApS',
        tech: 'WebXR, Three.js, JavaScript, AI Diagnostics',
        img: 'images/project_turbine.png',
        desc: `
            <p>Dette projekt løser en af offshore-vindmølleindustriens største logistiske og økonomiske udfordringer: fjernvedligeholdelse og oplæring af serviceteknikere. I samarbejde med partnere udviklede vi en letvægts WebXR-løsning, der kører direkte i browseren på AR-headsets.</p>
            <p>Gennem platformen kan en tekniker foran vindmøllens gearhus få projekteret et 3D-hologram ("røntgensyn") af de indre mekaniske dele direkte over den fysiske turbine. Sensorer indsamler driftsdata (olie-temperaturer, vibrationsniveauer, omdrejningshastighed) og viser dem i realtid som advarselsindikatorer i teknikerens synsfelt.</p>
            <p>I kritiske situationer kan teknikeren oprette et tovejs videoopkald til en specialist på land. Specialisten kan se præcis det samme som teknikeren og tegne 3D-pile eller markere specifikke bolte i rummet, hvilket reducerer fejl og sparer kostbare transportudgifter.</p>
        `
    },
    'veterandykkerne': {
        title: 'Veterandykkerne - Havets Helte',
        tag: '3D Simulation / Kultur',
        client: 'Veterandykkerne Forening & SDU',
        tech: 'Unity, WebGL, 3D Modellering, Spatial Audio',
        img: 'images/project_dive.png',
        desc: `
            <p>Veterandykkerne - Havets Helte er en interaktiv 3D WebGL-oplevelse, der formidler de farlige og historiske missioner, som professionelle dykkere har udført for det danske forsvar og samfund gennem årtier.</p>
            <p>Spilleren kastes ned i en stemningsfuld digital dybhavssimulator i 3D, hvor man som dykker skal udforske historiske vrag, rydde gamle miner fra anden verdenskrig eller reparere undersøiske kabler. Hvert scenarie er baseret på sande historier og er udviklet i tæt samarbejde med veteranerne selv.</p>
            <p>Undervejs kan spilleren interagere med dykkerudstyr og aktivere lydfiler, hvor veteranerne deler personlige beretninger. Projektet demonstrerer, hvordan immersiv teknologi, WebGL-tilgængelighed og dyb narrativ formidling kan bruges til at bevare kulturarv og skabe empati hos yngre generationer.</p>
        `
    },
    'nfc-display': {
        title: 'ErhvervsTanken - NFC Display',
        tag: 'Taktil 3D & NFC / Formidling',
        client: 'ErhvervsTanken & Dansk Metal',
        tech: 'NFC, 3D Scanning, Arduino, Node.js',
        img: 'images/project_nfc.jpg',
        desc: `
            <p>Dette interaktive NFC-baserede udstillingssystem blev udviklet til at formidle erhvervsuddannelsernes rolle i den grønne omstilling og industrien. Udstillingen inviterer gæster til at røre, løfte og placere fysiske elementer på et specialbygget bord.</p>
            <p>Bordet indeholder integrerede NFC-læsere og er forbundet med en stor TV-skærm. Besøgende kan placere 3D-scannede, 3D-printede og flot håndmalede figurer af rigtige lærlinge på specifikke zoner. Dette udløser lærlingenes personlige videohistorier om deres arbejde i stål- og værktøjsproduktionen.</p>
            <p>Installationen viser, hvordan kombinationen af taktil fysisk leg, 3D-scanning af rigtige mennesker og digital historiefortælling kan fange de besøgendes opmærksomhed på en markant dybere måde end traditionelle touchskærme.</p>
        `
    },
    'lillebaelt-vr': {
        title: 'Naturpark Lillebælt VR Game',
        tag: 'Virtual Reality / EduTech',
        client: 'Naturpark Lillebælt',
        tech: 'Unity, Meta XR SDK, Blender, Oculus Quest',
        img: 'images/project_lillebaelt_vr.png',
        desc: `
            <p>Naturpark Lillebælt VR er et pædagogisk simulationsspil i Virtual Reality, der giver skoleklasser en unik mulighed for at dykke under bæltets overflade uden at blive våde. Formålet er at undervise unge i havbiologi og havbundenes bevarelse.</p>
            <p>Spilleren ifører sig et VR-headset og udfører en række praktiske miljømissioner på havbunden. Man skal blandt andet plante nye ålegræsskove for at binde CO2, rydde tabte fiskenet ("spøgelsesnet"), der fanger fisk unødigt, samt identificere og beskytte de sarte marine arter, der lever i Lillebælt.</p>
            <p>Spillet udnytter virtual realitys evne til at skabe dyb følelsesmæssig forbindelse og ejerskab over naturen. Det bruges aktivt i undervisningen i natur/teknologi-fagene i de omkringliggende kommuner.</p>
        `
    },
    'jelling-metaverse': {
        title: 'InnovationCamp 2022 - Jelling',
        tag: 'Metaverse / Museum & Kultur',
        client: 'Kongernes Jelling (Nationalmuseet)',
        tech: 'SynergyXR, Unity, VR/AR, Multi-User Meta',
        img: 'images/project_jelling.png',
        desc: `
            <p>Under InnovationCamp 2022 samarbejdede over 100 3D-designstuderende sammen med det berømte vikingemuseum Kongernes Jelling for at teste metaversets grænser inden for moderne historisk formidling.</p>
            <p>Ved hjælp af SynergyXR-platformen skabte de studerende ti forskellige virtuelle rum, hvor museets gæster kan interagere med historiske genstande, rekonstruerede vikingehuse og monumenter. Brugerne kan f.eks. gå rundt om en gigantisk holografisk 3D-runesten, udforske vikingernes gravhøje og samarbejde i fælles virtuelle klasseværelser.</p>
            <p>Projektet demonstrerer, hvordan museer kan anvende metaverset til at engagere et yngre publikum på distancen, samt hvordan virtuelle rum kan bruges som et stærkt værktøj til curriculum-baseret læring og fjernundervisning.</p>
        `
    }
};

function initProjectDrawer() {
    const drawer = document.getElementById('project-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = document.querySelector('.drawer-close');
    const projectCards = document.querySelectorAll('.project-card');
    
    if (!drawer || !overlay || !closeBtn || projectCards.length === 0) return;
    
    const dTag = document.getElementById('d-tag');
    const dTitle = document.getElementById('d-title');
    const dImg = document.getElementById('d-img');
    const dClient = document.getElementById('d-client');
    const dTech = document.getElementById('d-tech');
    const dDesc = document.getElementById('d-desc');
    
    const loading = document.getElementById('drawer-loading');
    const body = document.getElementById('drawer-body');

    async function openDrawer(projectId) {
        drawer.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden'; 
        
        loading.classList.remove('hidden');
        body.classList.add('hidden');

        const lang = document.documentElement.getAttribute('lang') || localStorage.getItem('lang') || 'da';
        const dataSet = await loadTranslations();
        const localizedProject = dataSet && dataSet[lang] && dataSet[lang].projects && dataSet[lang].projects[projectId];
        const fallbackData = PROJECT_DATA[projectId];

        if (localizedProject || fallbackData) {
            setTimeout(() => {
                const title = localizedProject ? localizedProject.title : fallbackData.title;
                const img = localizedProject ? localizedProject.image : fallbackData.img;
                const tag = localizedProject ? (Array.isArray(localizedProject.tags) ? localizedProject.tags.join(' / ') : localizedProject.tags) : fallbackData.tag;
                const client = localizedProject ? (Array.isArray(localizedProject.tags) ? localizedProject.tags.join(', ') : localizedProject.tags) : fallbackData.client;
                const tech = fallbackData ? fallbackData.tech : (localizedProject && Array.isArray(localizedProject.tags) ? localizedProject.tags.join(', ') : '');
                const desc = localizedProject ? `<p><strong>${localizedProject.intro}</strong></p>${localizedProject.body}` : fallbackData.desc;

                if (dTag) dTag.textContent = tag;
                if (dTitle) dTitle.textContent = title;
                if (dImg) {
                    dImg.src = img;
                    dImg.alt = title;
                }
                if (dClient) dClient.textContent = client;
                if (dTech) dTech.textContent = tech;
                if (dDesc) dDesc.innerHTML = desc;

                loading.classList.add('hidden');
                body.classList.remove('hidden');
            }, 250);
        }
    }

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const projectId = card.getAttribute('data-project');
            openDrawer(projectId);
        });
    });

    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
            closeDrawer();
        }
    });
}

/* --------------------------------------------------------------------------
   9. Contact Form Management
   -------------------------------------------------------------------------- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    const successMsg = document.getElementById('form-success');
    const successResetBtn = document.getElementById('btn-success-reset');
    
    if (!form || !successMsg) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;display:inline-block;margin:0;"></span>';
        
        setTimeout(() => {
            form.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            form.classList.add('hidden');
            successMsg.classList.remove('hidden');
        }, 1200);
    });
    
    if (successResetBtn) {
        successResetBtn.addEventListener('click', () => {
            successMsg.classList.add('hidden');
            form.classList.remove('hidden');
        });
    }
}
