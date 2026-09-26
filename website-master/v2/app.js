/* ==========================================================================
   Innopixel v2 Scripts - Interactive Core
   ========================================================================== */

// Global Project Data Store
const PROJECTS_DATA = {
    "lillebaelt-ar": {
        title: "Naturpark Lillebælt AR",
        tag: "Augmented Reality / EduTech",
        client: "Naturpark Lillebælt",
        tech: "Unity, AR Foundation, C#, 3D Asset Creation",
        image: "../images/project_lillebaelt.png",
        desc: `
            <p>Naturpark Lillebælt AR er en banebrydende undervisningsapplikation, der bringer havmiljøet direkte ind i klasseværelset. Ved hjælp af avanceret Augmented Reality (AR) kan eleverne scanne gulvet og se en interaktiv 3D-model af Lillebælts havbund udfolde sig i realtid.</p>
            <p><strong>Formålet:</strong> At visualisere det usynlige. Havets tilstand, marsvinenes færden og udbredelsen af ålegræs er normalt skjult under overfladen. AR-oplevelsen gør det muligt for lærere at undervise i biologi og biodiversitet på en engagerende, visuel og taktil måde.</p>
            <p><strong>Teknisk løsning:</strong> Appen er udviklet i Unity med AR Foundation, hvilket sikrer fuld kompatibilitet på tværs af både iOS og Android. 3D-modellerne er optimerede til mobile enheder, så de bevarer et højt detaljeniveau uden at dræne batteriet.</p>
        `
    },
    "sensible-xr": {
        title: "Sensible - XR Turbine Maintenance",
        tag: "Extended Reality / Industri",
        client: "Sensible Solutions",
        tech: "Unity, Magic Leap 2, WebRTC, Azure Spatial Anchors",
        image: "../images/project_turbine.png",
        desc: `
            <p>I industrien kan fejl på vitale komponenter som vindmøller koste millioner i nedetid. Sensible XR er et avanceret AR-værktøj udviklet til fjernsupport og diagnosticering af komplekse mekaniske turbine-systemer.</p>
            <p><strong>Formålet:</strong> At give teknikere på stedet adgang til realtidsdata, 3D-sprængskitser og direkte assistance fra specialister i hele verden via augmented reality overlays.</p>
            <p><strong>Teknisk løsning:</strong> Ved hjælp af Magic Leap 2 headsets eller tablets, scanner systemet turbinen og tegner et sensor-layer direkte ovenpå komponenterne. Ved hjælp af WebRTC kan en fjernsupporter "tegne" i teknikerens synsfelt for at guide reparationen.</p>
        `
    },
    "veterandykkerne": {
        title: "Veterandykkerne - Havets Helte",
        tag: "3D Simulation / Kultur",
        client: "Kulturministeriet & Foreningen Veterandykkerne",
        tech: "Three.js, WebGL, Blender, HTML5 Interaction",
        image: "../images/project_dive.png",
        desc: `
            <p>Havets Helte er et digitalt formidlingsprojekt dedikeret til at bevare historien om danske veteraners risikofyldte pionerarbejde i dybhavet. Gennem en interaktiv web-oplevelse kan besøgende dykke ned i historiske arkiver og 3D-modeller af dykkerudstyr.</p>
            <p><strong>Formålet:</strong> At skabe en dragende historisk formidling for et bredt publikum, der kombinerer interviews, lydfortællinger og interaktive 3D-simulationer, som kan tilgås direkte i enhver browser uden særskilt software.</p>
            <p><strong>Teknisk løsning:</strong> Hele oplevelsen er bygget i Three.js (WebGL), hvilket giver fotorealistisk lyssætning og interaktivitet på tværs af computere og mobile enheder. 3D-scanninger af historisk dykkerudstyr er optimeret i Blender for flydende webydelse.</p>
        `
    },
    "nfc-display": {
        title: "ErhvervsTanken - NFC Display",
        tag: "Taktil 3D & NFC / Formidling",
        client: "ErhvervsTanken",
        tech: "Arduino, NFC Node Readers, WebSockets, JavaScript",
        image: "../images/project_nfc.jpg",
        desc: `
            <p>ErhvervsTanken NFC Display kombinerer det fysiske og det digitale i en innovativ udstillingsstand. Besøgende kan tage taktile 3D-printede ikoner af grønne teknologier (f.eks. en vindmølle eller en elbil) og placere dem på et centralt sensor-bord.</p>
            <p><strong>Formålet:</strong> At engagere unge i udskolingen til at udforske erhvervsuddannelser. Ved at flytte interaktionen væk fra en passiv skærm og over i fysisk berøring, stiger engagementet markant.</p>
            <p><strong>Teknisk løsning:</strong> Ikonerne har indbyggede passive NFC-chips. Pladen har sensorer forbundet til en mikrocontroller, der sender signaler via WebSockets til en lokal browser, som øjeblikkeligt afspiller en tilpasset 3D-infografik og video-case.</p>
        `
    },
    "lillebaelt-vr": {
        title: "Naturpark Lillebælt VR Game",
        tag: "Virtual Reality / EduTech",
        client: "Naturpark Lillebælt / SDU TEK",
        tech: "Unity, Meta XR SDK, Oculus Quest 2, C#",
        image: "../images/project_lillebaelt_vr.png",
        desc: `
            <p>Et pædagogisk VR-simulationsspil, der kaster elever ud på en virtuel ekspedition under Lillebælts overflade. Udrustet med undervandsscannere og biologisk prøveudstyr skal de indsamle data om havbundens tilstand.</p>
            <p><strong>Formålet:</strong> At give en følelse af nærvær og empati for havmiljøet. Eleverne oplever konsekvenserne af iltsvind og plastikforurening helt tæt på, hvilket styrker indlæringen markant sammenlignet med traditionelle bøger.</p>
            <p><strong>Teknisk løsning:</strong> Udviklet specifikt til Meta Quest 2 som en standalone VR-oplevelse. Spillet benytter fysikbaseret hånd-tracking, så eleverne kan interagere naturligt med redskaberne uden at skulle lære komplicerede controller-knapper.</p>
        `
    },
    "jelling-metaverse": {
        title: "InnovationCamp - Jelling Metaverse",
        tag: "Metaverse / Museum & Kultur",
        client: "Kongernes Jelling & Nationalmuseet",
        tech: "SynergyXR, 3D Reconstruction, Photogrammetry",
        image: "../images/project_jelling.png",
        desc: `
            <p>En fuld virtuel metaverse-udstilling skabt i samarbejde med Kongernes Jelling. Projektet genskaber de historiske runesten og vikingemonumenter i et fælles digitalt rum, hvor skoleklasser fra hele landet kan mødes virtuelt.</p>
            <p><strong>Formålet:</strong> At muliggøre digital fjernundervisning i historie, hvor klasser kan gå rundt mellem monumenterne sammen med en museumoguide, selvom de sidder 200 km væk.</p>
            <p><strong>Teknisk løsning:</strong> Vi anvendte fotogrammetrisk rekonstruktion til at scanne de fysiske runesten i ekstrem høj opløsning. Disse blev integreret i SynergyXR-platformen, hvilket gav deltagerne mulighed for at tale sammen og interagere som 3D-avatarer.</p>
        `
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation & Header setups
    initHeaderScroll();
    initMobileNav();
    
    // 2. Interactive Reactive Background Canvas (Pixel Grid)
    initPixelGridCanvas();
    
    // 3. Scroll Reveal Interactions
    initScrollReveal();
    
    // 4. Portfolio drawer (modals) & Grid Filter Engine
    initPortfolioEngine();
    
    // 5. Interactive Cost Estimator (for ydelser.html)
    initCostEstimator();
    
    // 6. Lead Capture Contact Form Validation
    initContactForm();
});

/* --------------------------------------------------------------------------
   1. Navigation & Header Sticky Effects
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const handleScroll = () => {
        if (window.scrollY > 40) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger immediately in case page is loaded scrolled down
}

function initMobileNav() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!toggle || !nav) return;
    
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggle.classList.toggle('open');
        nav.classList.toggle('open');
    });
    
    // Close when clicking nav-links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('open');
            nav.classList.remove('open');
        });
    });
    
    // Close when clicking outside the menu
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            toggle.classList.remove('open');
            nav.classList.remove('open');
        }
    });
}

/* --------------------------------------------------------------------------
   2. Interactive Reactive Background Canvas (Pixel Grid)
   -------------------------------------------------------------------------- */
function initPixelGridCanvas() {
    const canvas = document.getElementById('pixel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    
    const spacing = 40; // Spacing of pixel grid (matches CSS background grid)
    let columns = Math.ceil(width / spacing);
    let rows = Math.ceil(height / spacing);
    
    let mouse = { x: null, y: null, radius: 160 };
    
    // Reactive points array
    let pixels = [];
    
    class GridPixel {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.baseSize = 2; // small dot size
            this.currentSize = 2;
            this.alpha = 0.08; // very faint base alpha
            this.color = '255, 67, 68'; // Innopixel Red RGB
            this.targetAlpha = 0.08;
            this.active = false;
        }
        
        update() {
            if (mouse.x !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < mouse.radius) {
                    // Mouse proximity active
                    const force = (mouse.radius - dist) / mouse.radius; // 0 to 1
                    this.targetAlpha = 0.08 + force * 0.7; // Brighten up
                    this.currentSize = this.baseSize + force * 4; // Scale up to 6px
                    this.active = true;
                } else {
                    this.targetAlpha = 0.08;
                    this.currentSize = this.currentSize * 0.95; // lerp back down
                    if (this.currentSize < this.baseSize) this.currentSize = this.baseSize;
                    this.active = false;
                }
            } else {
                this.targetAlpha = 0.08;
                this.currentSize = this.baseSize;
                this.active = false;
            }
            
            // Lerp alpha for smooth fading
            this.alpha += (this.targetAlpha - this.alpha) * 0.1;
        }
        
        draw() {
            ctx.beginPath();
            // Draw as a rounded pixel
            ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
            ctx.fill();
        }
    }
    
    function buildGrid() {
        pixels = [];
        columns = Math.ceil(width / spacing);
        rows = Math.ceil(height / spacing);
        
        for (let c = 0; c <= columns; c++) {
            for (let r = 0; r <= rows; r++) {
                pixels.push(new GridPixel(c * spacing, r * spacing));
            }
        }
    }
    
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
        buildGrid();
    });
    
    // Draw connections between highly active pixels
    function drawConnections() {
        const activeNodes = pixels.filter(p => p.active && p.alpha > 0.35);
        ctx.lineWidth = 0.75;
        
        for (let i = 0; i < activeNodes.length; i++) {
            for (let j = i + 1; j < activeNodes.length; j++) {
                const n1 = activeNodes[i];
                const n2 = activeNodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Only connect adjacent grid points
                if (dist <= spacing * 1.5) {
                    const avgAlpha = (n1.alpha + n2.alpha) / 2;
                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.strokeStyle = `rgba(255, 67, 68, ${avgAlpha * 0.25})`;
                    ctx.stroke();
                }
            }
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        pixels.forEach(pixel => {
            pixel.update();
            pixel.draw();
        });
        drawConnections();
        requestAnimationFrame(animate);
    }
    
    buildGrid();
    animate();
}

/* --------------------------------------------------------------------------
   3. Scroll Reveal Interactions
   -------------------------------------------------------------------------- */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Once revealed, no need to track it anymore
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters viewport
    });
    
    revealElements.forEach(el => observer.observe(el));
}

/* --------------------------------------------------------------------------
   4. Portfolio Drawer (Modal) & Grid Filter Engine
   -------------------------------------------------------------------------- */
function initPortfolioEngine() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectCards = document.querySelectorAll('.portfolio-card');
    
    // --- Card Filtering (Only on projekter.html) ---
    if (filterTabs.length > 0) {
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Toggle active class on tab
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const filterValue = tab.getAttribute('data-filter');
                
                projectCards.forEach(card => {
                    const categories = card.getAttribute('data-category').split(' ');
                    if (filterValue === 'all' || categories.includes(filterValue)) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }
    
    // --- Drawer Logic (Applies to all pages with portfolio-cards) ---
    const drawer = document.getElementById('project-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const closeBtn = document.querySelector('.drawer-close');
    
    if (!drawer || !overlay) return;
    
    const openDrawer = (projectId) => {
        const data = PROJECTS_DATA[projectId];
        if (!data) return;
        
        // Show drawer and overlay
        drawer.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden'; // Lock background scroll
        
        const loader = document.getElementById('drawer-loading');
        const bodyContent = document.getElementById('drawer-body');
        
        loader.classList.remove('hidden');
        bodyContent.classList.add('hidden');
        
        // Simulate asynchronous network fetch for dynamic feel
        setTimeout(() => {
            document.getElementById('d-tag').textContent = data.tag;
            document.getElementById('d-title').textContent = data.title;
            document.getElementById('d-client').textContent = data.client;
            document.getElementById('d-tech').textContent = data.tech;
            document.getElementById('d-img').src = data.image;
            document.getElementById('d-img').alt = data.title;
            document.getElementById('d-desc').innerHTML = data.desc;
            
            loader.classList.add('hidden');
            bodyContent.classList.remove('hidden');
        }, 400); // 400ms visual buffer
    };
    
    const closeDrawer = () => {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = ''; // Restore scroll
    };
    
    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-project');
            openDrawer(id);
        });
    });
    
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    
    // ESC key close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
            closeDrawer();
        }
    });
}

/* --------------------------------------------------------------------------
   5. Interactive Cost Estimator (for ydelser.html)
   -------------------------------------------------------------------------- */
function initCostEstimator() {
    const scaleSlider = document.getElementById('estimator-scale');
    const typeButtons = document.querySelectorAll('.estimator-option-btn');
    
    if (!scaleSlider || typeButtons.length === 0) return;
    
    const scaleLabels = ["Simpelt Koncept / Prototype", "Avanceret Løsning / Fuld Version", "Enterprise Integration / Skalerbar"];
    const durationEstimates = ["3 - 5 uger", "6 - 12 uger", "12 - 20+ uger"];
    
    const typeBaseCosts = {
        "vr": 85000,       // DKK base cost for VR Simulation
        "ar": 60000,       // DKK base cost for AR Application
        "3d": 35000,       // DKK base cost for 3D Modelling & Animation
        "360": 25000       // DKK base cost for 360 Video Production
    };
    
    let currentScale = parseInt(scaleSlider.value); // 1, 2, 3
    let currentType = "vr"; // Default active type
    
    // Find default active type from buttons
    typeButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            currentType = btn.getAttribute('data-type');
        }
    });
    
    const updateCalculation = () => {
        // Multiplier based on scale (1x, 2.2x, 4.5x)
        const scaleMultipliers = [1.0, 2.2, 4.5];
        const multiplier = scaleMultipliers[currentScale - 1];
        
        const baseCost = typeBaseCosts[currentType] || 50000;
        const totalCost = Math.round(baseCost * multiplier);
        
        // Format cost as DKK currency (f.eks. "132.000 DKK")
        const formattedCost = new Intl.NumberFormat('da-DK', {
            style: 'currency',
            currency: 'DKK',
            maximumFractionDigits: 0
        }).format(totalCost);
        
        // Update values in DOM
        document.getElementById('slider-value-label').textContent = scaleLabels[currentScale - 1];
        document.getElementById('calc-price').textContent = formattedCost;
        document.getElementById('calc-duration').textContent = durationEstimates[currentScale - 1];
    };
    
    // Slider event
    scaleSlider.addEventListener('input', (e) => {
        currentScale = parseInt(e.target.value);
        updateCalculation();
    });
    
    // Type button click events
    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.getAttribute('data-type');
            updateCalculation();
        });
    });
    
    // Run initial calculation
    updateCalculation();
}

/* --------------------------------------------------------------------------
   6. Contact Form Validation
   -------------------------------------------------------------------------- */
function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;
    
    const feedback = document.getElementById('form-feedback');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Basic inputs check
        const name = form.querySelector('#name').value.trim();
        const email = form.querySelector('#email').value.trim();
        const msg = form.querySelector('#message').value.trim();
        
        if (!name || !email || !msg) {
            alert('Venligst udfyld alle påkrævede felter.');
            return;
        }
        
        // Validation check for Email pattern
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Ugyldig e-mail-adresse. Venligst indtast en rigtig e-mail.');
            return;
        }
        
        // UI Feedback: Loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Sender besked...`;
        
        // Mock async request
        setTimeout(() => {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            
            // Show Success feedback
            feedback.className = "form-feedback success";
            feedback.textContent = "Tak for din besked! Vi vender tilbage inden for 24 timer.";
            feedback.style.display = "block";
            
            // Reset form
            form.reset();
            
            // Trigger floating label reset by resetting focus
            form.querySelectorAll('.form-input').forEach(input => {
                input.dispatchEvent(new Event('blur'));
            });
            
            // Clear feedback after 6 seconds
            setTimeout(() => {
                feedback.style.display = "none";
            }, 6000);
            
        }, 1500);
    });
}
