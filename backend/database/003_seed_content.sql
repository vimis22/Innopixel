-- =============================================================================
-- Innopixel - migration 003: content for the website and the first administrator
--
-- Moved from the frontend (src/data/projects.ts, src/data/services.ts and the projects /
-- servicesPage sections of translations.json), so the website reads it from the database.
-- Texts are stored per language in languages (description = which text it is):
--   projects: title, intro, body (HTML), tags (JSON array)   services: title, description
--
-- The administrator Michael Lundorff Hansen gets no password here. The backend sets it at
-- startup from the configuration value InitialAdmin:Password (user secrets), see Program.cs.
-- =============================================================================

BEGIN;

-- Portfolio projects (published on the website, not part of the internal platform)
INSERT INTO technology (name) VALUES
    ('Unity'),
    ('AR Foundation'),
    ('C#'),
    ('Blender'),
    ('WebXR'),
    ('Three.js'),
    ('JavaScript'),
    ('AI Diagnostics'),
    ('WebGL'),
    ('3D Modellering'),
    ('Spatial Audio'),
    ('NFC'),
    ('3D Scanning'),
    ('Arduino'),
    ('Node.js'),
    ('Meta XR SDK'),
    ('Oculus Quest'),
    ('SynergyXR'),
    ('VR/AR'),
    ('Multi-User Meta')
ON CONFLICT (name) DO NOTHING;

-- lillebaelt-ar
WITH p AS (
    INSERT INTO projects (name, description, currentstatus, client, image_url)
    VALUES ('Naturpark Lillebælt AR App', 'An interactive underwater exploration application developed to engage school children in the marine ecosystem of the Lillebælt nature park.', 'Published', 'Naturpark Lillebælt', '/images/project_lillebaelt.png')
    RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'Naturpark Lillebælt AR App'),
        ('intro', 'da', 'En interaktiv lærings-app, der gør det muligt for havnens gæster at se et simuleret marint økosystem under vandets overflade.'),
        ('body', 'da', '<h4>Udfordringen</h4><p>At engagere børn i miljøundervisning kan være en udfordring, især når emnet befinder sig under havets overflade. Naturpark Lillebælt ønskede en innovativ løsning, som skoler, museer og besøgende kunne bruge direkte på havnekajen for at ''se'' dyrelivet i realtid.</p><h4>Løsningen</h4><p>Innopixel udviklede en specialdesignet, markørløs AR-app. Når brugere peger deres mobile enheder mod vandoverfladen, renderes et virtuelt 3D-økosystem. Elever kan interagere med hjemmehørende arter (såsom marsvin, krabber og torsk), svare på quizzer og logge observationer.</p><h4>Teknisk integration</h4><p>Udviklet med Unity og AR Foundation, optimeret til at køre med 60fps på almindelige smartphones. Indeholder rumlig 3D-lyd, der skaber en autentisk undervandsstemning.</p>'),
        ('tags', 'da', '["Augmented Reality", "EduTech", "UX Design"]'),
        ('title', 'en', 'Naturpark Lillebælt AR App'),
        ('intro', 'en', 'An interactive underwater exploration application developed to engage school children in the marine ecosystem of the Lillebælt nature park.'),
        ('body', 'en', '<h4>The Challenge</h4><p>Engaging children in environmental education can be challenging, especially when the subject is hidden beneath the ocean surface. Naturpark Lillebælt wanted an innovative solution that schools, museums, and visitors could use directly at the harbor docks to ''see'' underwater wildlife in real-time.</p><h4>The Solution</h4><p>Innopixel developed a custom markerless AR app. When users point their mobile devices toward the water surface, a virtual 3D ecosystem renders. Students can interact with native species (like porpoises, crabs, and cod), play educational quizzes, and log sightings.</p><h4>Technical Integration</h4><p>Built with Unity and AR Foundation, optimizing custom 3D low-poly models to run smoothly at 60fps on consumer devices. It includes a custom spatial sound design that makes players feel fully submerged.</p>'),
        ('tags', 'en', '["Augmented Reality", "EduTech", "UX Design"]')
    RETURNING id
), text_links AS (
    INSERT INTO projectlanguagelist (projects_id, languages_id) SELECT p.id, texts.id FROM p, texts
)
INSERT INTO technologylist (projects_id, technology_id)
SELECT p.id, t.id FROM p JOIN technology t ON t.name IN ('Unity', 'AR Foundation', 'C#', 'Blender');

-- sensible-xr
WITH p AS (
    INSERT INTO projects (name, description, currentstatus, client, image_url)
    VALUES ('XR Turbine Maintenance Guide', 'An advanced augmented reality training tool for technicians performing remote diagnostics and repair on complex offshore wind turbines.', 'Published', 'Sensible ApS', '/images/project_turbine.png')
    RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'Sensible - XR Turbinevedligeholdelse'),
        ('intro', 'da', 'Et avanceret augmented reality-træningsværktøj til teknikere, der udfører fjerndiagnostik og reparation på komplekse havvindmøller.'),
        ('body', 'da', '<h4>Udfordringen</h4><p>Vedligeholdelse af havvindmøller er forbundet med høj risiko, store omkostninger og kræver specialiserede færdigheder. Fejl under reparationer medfører dyre nedetider. Vores kunde manglede en remote assistant-guide, som teknikere kunne bære on-site.</p><h4>Løsningen</h4><p>En immersiv AR-guide bygget til Microsoft HoloLens 2. Applikationen lægger wireframe-diagrammer, live diagnostiske data og retningsanvisninger direkte oven på de fysiske gearhjul. Teknikere kan gennemgå tjeklister håndfrit via gestus- og stemmestyring.</p><h4>Teknisk integration</h4><p>Udviklet med Unity og MRTK. Integration med IoT-sensorer på vindmøllen tillader realtidsdata (omdrejningstal, temperaturer) at streame direkte ind i teknikerens synsfelt.</p>'),
        ('tags', 'da', '["Extended Reality", "Industriel Træning", "3D-simulering"]'),
        ('title', 'en', 'XR Turbine Maintenance Guide'),
        ('intro', 'en', 'An advanced augmented reality training tool for technicians performing remote diagnostics and repair on complex offshore wind turbines.'),
        ('body', 'en', '<h4>The Challenge</h4><p>Offshore wind turbine maintenance is high-risk, expensive, and requires highly specialized skills. Errors during repair operations result in costly downtime. Our client needed a remote assistant guide that technicians could wear on-site to inspect turbine elements step-by-step.</p><h4>The Solution</h4><p>An immersive AR guide built for Microsoft HoloLens 2. The application overlays wireframe schematics, live diagnostic feeds, and vector directions directly over the physical wind turbine gears. Technicians can execute inspection checklists hands-free using hand gestures and voice controls.</p><h4>Technical Integration</h4><p>Built using MRTK (Mixed Reality Toolkit) and Unity. Integration with IoT sensors on the turbine allows real-time telemetry (RPM, heat levels) to stream directly into the technician''s HUD.</p>'),
        ('tags', 'en', '["Extended Reality", "Industrial Training", "3D Simulation"]')
    RETURNING id
), text_links AS (
    INSERT INTO projectlanguagelist (projects_id, languages_id) SELECT p.id, texts.id FROM p, texts
)
INSERT INTO technologylist (projects_id, technology_id)
SELECT p.id, t.id FROM p JOIN technology t ON t.name IN ('WebXR', 'Three.js', 'JavaScript', 'AI Diagnostics');

-- veterandykkerne
WITH p AS (
    INSERT INTO projects (name, description, currentstatus, client, image_url)
    VALUES ('Veterandykkerne - Ocean Heroes', 'A digital memorial exhibition and immersive 3D simulation documenting the perilous underwater missions of Denmark''s pioneer commercial divers.', 'Published', 'Veterandykkerne Forening & SDU', '/images/project_dive.png')
    RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'Veterandykkerne - Havets Helte'),
        ('intro', 'da', 'En digital mindeudstilling og immersiv 3D-simulering, der dokumenterer de farefulde missioner for Danmarks pioner-erhvervsdykkere.'),
        ('body', 'da', '<h4>Udfordringen</h4><p>Historien om de pionerdykkere, der lagde kabler og rørledninger i Nordsøen, er i høj grad usynlig. Organisationen Veterandykkerne ønskede at bevare denne kulturarv og uddanne offentligheden om de ekstreme forhold under historiske dyk.</p><h4>Løsningen</h4><p>Vi skabte en interaktiv museumsinstallation, der kombinerer fysiske genstande med en Virtual Reality-dykkerhjelm-simulering. Brugere kan tage en replika af en historisk dykkerhjelm på og opleve et simuleret dybhavsdyk fra 1970''erne under stærk strøm.</p><h4>Teknisk integration</h4><p>Detaljerede 3D-modeller af vintage dykkerudstyr. Renderet med lys- og partikeleffekter i WebGL og WebXR for at tillade adgang direkte fra standard-browsere samt VR-headsets.</p>'),
        ('tags', 'da', '["3D-simulering", "Kultur & Historie", "Weboplevelse"]'),
        ('title', 'en', 'Veterandykkerne - Ocean Heroes'),
        ('intro', 'en', 'A digital memorial exhibition and immersive 3D simulation documenting the perilous underwater missions of Denmark''s pioneer commercial divers.'),
        ('body', 'en', '<h4>The Challenge</h4><p>The history of pioneer divers who laid down the cables and pipelines in the North Sea is largely invisible. The Veterandykkerne organization wanted to preserve this heritage and educate the public on the physical toll and extreme conditions of historical diving.</p><h4>The Solution</h4><p>We created an interactive museum installation combining physical relics with a Virtual Reality diving helmet simulation. Users can put on a mock helmet and experience a simulated 1970s deep-sea dive, navigating through dark water, cold currents, and executing weld operations under pressure.</p><h4>Technical Integration</h4><p>Created detailed 3D models of vintage diving gear and environments. Rendered with custom lighting and particles in WebGL and WebXR to allow access from standard browsers as well as VR headsets.</p>'),
        ('tags', 'en', '["3D Simulation", "Culture & History", "Web Experience"]')
    RETURNING id
), text_links AS (
    INSERT INTO projectlanguagelist (projects_id, languages_id) SELECT p.id, texts.id FROM p, texts
)
INSERT INTO technologylist (projects_id, technology_id)
SELECT p.id, t.id FROM p JOIN technology t ON t.name IN ('Unity', 'WebGL', '3D Modellering', 'Spatial Audio');

-- nfc-display
WITH p AS (
    INSERT INTO projects (name, description, currentstatus, client, image_url)
    VALUES ('ErhvervsTanken NFC Exhibition', 'A tangible exhibition table utilizing NFC hardware and 3D printing to guide teenagers through green transition career opportunities.', 'Published', 'ErhvervsTanken & Dansk Metal', '/images/project_nfc.jpg')
    RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'ErhvervsTanken NFC-udstilling'),
        ('intro', 'da', 'Et fysisk oplevelsesbord med NFC-sensorer og 3D-printede brikker, der guider unge igennem erhvervsuddannelsernes grønne omstilling.'),
        ('body', 'da', '<h4>Udfordringen</h4><p>Uddannelsesmesser er ofte fyldt med flade skærme og foldere, der ikke fanger de unges opmærksomhed. ErhvervsTanken ønskede et fysisk, taktilt spil, der vækker nysgerrighed om grøn energi på erhvervsskolerne.</p><h4>Løsningen</h4><p>Innopixel designede og byggede et smart-bord i træ med indbyggede NFC-sensorer og lysspor. Besøgende placerer 3D-printede brikker (fx vindmøllevinge, solcelle, brintrør) i hullerne. Bordet aflæser NFC-brikken og starter en projection mapping-visning af effekten.</p><h4>Teknisk integration</h4><p>Arduino og Raspberry Pi mikrokontrollere behandler sensorinput og kommunikerer med en Node.js-backend, der driver projektions- og lysstyringen.</p>'),
        ('tags', 'da', '["Taktile Medier", "NFC Hardware", "Interaktiv Installation"]'),
        ('title', 'en', 'ErhvervsTanken NFC Exhibition'),
        ('intro', 'en', 'A tangible exhibition table utilizing NFC hardware and 3D printing to guide teenagers through green transition career opportunities.'),
        ('body', 'en', '<h4>The Challenge</h4><p>Youth career exhibitions are often filled with flat screens and pamphlets that fail to hold teenagers'' interest. ErhvervsTanken wanted a physical, tactile game that would spark curiosity about vocational schools in green energy.</p><h4>The Solution</h4><p>Innopixel designed and built a wooden smart table embedded with NFC sensors and glowing light tracks. Visitors pick up custom 3D-printed tokens representing different energy resources (wind blade, solar panel, hydrogen pipe) and slot them into sockets. The table reads the NFC tags and starts a projection-mapped visual showcasing how those energy choices affect a local town.</p><h4>Technical Integration</h4><p>Arduino/Raspberry Pi microcontrollers process sensor inputs, communicating with a custom front-end built in Node.js and HTML5 Canvas that drives the ultra-short-throw projector feed.</p>'),
        ('tags', 'en', '["Tangible Media", "NFC Hardware", "Interactive Installation"]')
    RETURNING id
), text_links AS (
    INSERT INTO projectlanguagelist (projects_id, languages_id) SELECT p.id, texts.id FROM p, texts
)
INSERT INTO technologylist (projects_id, technology_id)
SELECT p.id, t.id FROM p JOIN technology t ON t.name IN ('NFC', '3D Scanning', 'Arduino', 'Node.js');

-- lillebaelt-vr
WITH p AS (
    INSERT INTO projects (name, description, currentstatus, client, image_url)
    VALUES ('Lillebælt VR Ecosystem Game', 'A classroom-focused VR simulator where students take on the role of marine biologists restoring a depleted harbor ecosystem.', 'Published', 'Naturpark Lillebælt', '/images/project_lillebaelt_vr.png')
    RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'Lillebælt VR Økosystemspil'),
        ('intro', 'da', 'En klasserumsfokuseret VR-simulator, hvor elever agerer havbiologer og genopretter et nedbrudt fjordmiljø.'),
        ('body', 'da', '<h4>Udfordringen</h4><p>At forstå havmiljøet kræver, at man ser effekterne af forurening og iltsvind i stor skala. Traditionelle lærebøger mangler immersionen til at skabe følelsesmæssigt engagement i naturbevarelse.</p><h4>Løsningen</h4><p>Et læringsspil i VR, hvor spillere dykker ned i Lillebælt. Udrustet med scanningsværktøjer fjerner de affald, planter ålegræs, etablerer stenrev og ser livet vende tilbage. Spillet komprimerer 10 års miljøudvikling til 15 minutter.</p><h4>Teknisk integration</h4><p>Optimeret til standalone VR-headsets (Meta Quest 2/3) med Unitys Universal Render Pipeline (URP). Bruger rumlig lyd og partikeleffekter to simulere autentiske undervandsmiljøer.</p>'),
        ('tags', 'da', '["Virtual Reality", "EduTech", "Gamificering"]'),
        ('title', 'en', 'Lillebælt VR Ecosystem Game'),
        ('intro', 'en', 'A classroom-focused VR simulator where students take on the role of marine biologists restoring a depleted harbor ecosystem.'),
        ('body', 'en', '<h4>The Challenge</h4><p>Understanding marine conservation requires seeing the macro-effects of human waste and agricultural runoff. Traditional classroom textbooks lack the immersion to drive emotional engagement with underwater conservation.</p><h4>The Solution</h4><p>An educational VR game where players dive into Lillebælt. Armed with a scanning tool, they identify pollutants, plant eelgrass meadows, build stone reefs, and watch marine life return. The simulation covers a 10-year span compressed into a 15-minute experience.</p><h4>Technical Integration</h4><p>Optimized for standalone VR headsets (Meta Quest 2/3) using Unity''s Universal Render Pipeline (URP). It leverages active spatial audio and highly optimized water physics to simulate real underwater environments.</p>'),
        ('tags', 'en', '["Virtual Reality", "EduTech", "Gamification"]')
    RETURNING id
), text_links AS (
    INSERT INTO projectlanguagelist (projects_id, languages_id) SELECT p.id, texts.id FROM p, texts
)
INSERT INTO technologylist (projects_id, technology_id)
SELECT p.id, t.id FROM p JOIN technology t ON t.name IN ('Unity', 'Meta XR SDK', 'Blender', 'Oculus Quest');

-- jelling-metaverse
WITH p AS (
    INSERT INTO projects (name, description, currentstatus, client, image_url)
    VALUES ('Kongernes Jelling Metaverse Exhibit', 'A collaborative virtual museum gallery designed for Kongernes Jelling, bringing Viking monuments to global classrooms in the metaverse.', 'Published', 'Kongernes Jelling (Nationalmuseet)', '/images/project_jelling.png')
    RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'InnovationCamp 2022 - Jelling'),
        ('intro', 'da', 'Et virtuelt museumsgalleri designet til Kongernes Jelling, der bringer monumenterne direkte ind i globale klasserum.'),
        ('body', 'da', '<h4>Udfordringen</h4><p>Jellingstenene og gravhøjene er på UNESCOs verdensarvsliste. På grund af geografi og rejseomkostninger kan mange klasser aldrig besøge monumenterne fysisk. Museet manglede et virtuelt udstillingsrum til guidede skoleture.</p><h4>Løsningen</h4><p>Vi designede en virtuel metaverse-pavillon. Ved hjælp af SynergyXR importerede vi detaljerede fotogrammetrisk-scannede 3D-modeller af runestenene og højene. Museumsformidlere kan mødes med klasser som avatarer og give live rundvisninger.</p><h4>Teknisk integration</h4><p>Fotogrammetrisk databehandling og optimering af store 3D-scanninger til cross-platform adgang på WebGL, HoloLens, PC VR og tablets.</p>'),
        ('tags', 'da', '["Metaverse", "SynergyXR", "Museumsudstilling"]'),
        ('title', 'en', 'Kongernes Jelling Metaverse Exhibit'),
        ('intro', 'en', 'A collaborative virtual museum gallery designed for Kongernes Jelling, bringing Viking monuments to global classrooms in the metaverse.'),
        ('body', 'en', '<h4>The Challenge</h4><p>The Jelling runic stones and royal mounds are UNESCO heritage sites in Denmark. Due to distance and scale, many schools can never visit them physically. The museum wanted to create a collaborative virtual exhibition where guides could host digital school tours.</p><h4>The Solution</h4><p>We designed a custom virtual metaverse pavilion. Using SynergyXR, we imported high-fidelity photogrammetry scans of the Jelling mounds, runic stones, and archaeological finds. Museum educators can meet up with classes from around the world inside this virtual space as avatars, giving live, interactive presentations.</p><h4>Technical Integration</h4><p>Photogrammetry cleaning of large-scale scans, texturing, and rendering optimizations for cross-platform access across WebGL, HoloLens, PC VR, and mobile tablets.</p>'),
        ('tags', 'en', '["Metaverse", "SynergyXR", "Museum Exhibition"]')
    RETURNING id
), text_links AS (
    INSERT INTO projectlanguagelist (projects_id, languages_id) SELECT p.id, texts.id FROM p, texts
)
INSERT INTO technologylist (projects_id, technology_id)
SELECT p.id, t.id FROM p JOIN technology t ON t.name IN ('SynergyXR', 'Unity', 'VR/AR', 'Multi-User Meta');

-- Services (website). iconidentifier tells the frontend which icon to show.
-- vr
WITH s AS (
    INSERT INTO services (projectdescription, iconidentifier) VALUES ('Interactive 3D worlds created for Quest, Pico, and PC VR. Ideal for complex training, safety simulations, and virtual museum exhibits.', 'vr') RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'Virtual Reality (VR)'),
        ('description', 'da', 'Interaktive 3D-verdener skabt til Quest, Pico og PC VR. Ideelt til kompleks træning, sikkerhedssimuleringer og virtuelle museumsudstillinger.'),
        ('title', 'en', 'Virtual Reality (VR)'),
        ('description', 'en', 'Interactive 3D worlds created for Quest, Pico, and PC VR. Ideal for complex training, safety simulations, and virtual museum exhibits.')
    RETURNING id
)
INSERT INTO languagelist (services_id, languages_id) SELECT s.id, texts.id FROM s, texts;

-- ar
WITH s AS (
    INSERT INTO services (projectdescription, iconidentifier) VALUES ('Digital layers superimposed on the real world via smartphones, tablets, or AR glasses. Perfect for outdoor learning paths, harbor exhibits, and product visualizers.', 'ar') RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'Augmented Reality (AR)'),
        ('description', 'da', 'Digitale lag oven på den virkelige verden via smartphones, tablets eller AR-briller. Perfekt til udendørs læringsruter, havneudstillinger og produktvisualiseringer.'),
        ('title', 'en', 'Augmented Reality (AR)'),
        ('description', 'en', 'Digital layers superimposed on the real world via smartphones, tablets, or AR glasses. Perfect for outdoor learning paths, harbor exhibits, and product visualizers.')
    RETURNING id
)
INSERT INTO languagelist (services_id, languages_id) SELECT s.id, texts.id FROM s, texts;

-- modeling
WITH s AS (
    INSERT INTO services (projectdescription, iconidentifier) VALUES ('Craftsmanship down to the smallest pixel. We create high-fidelity 3D assets, realistic low-poly environments, and smooth technical animations.', 'modeling') RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', '3D-Modellering & Animation'),
        ('description', 'da', 'Digitalt håndværk ned til mindste pixel. Vi producerer high-fidelity 3D-assets, realistiske low-poly miljøer og tekniske animationssekvenser.'),
        ('title', 'en', '3D Modeling & Animation'),
        ('description', 'en', 'Craftsmanship down to the smallest pixel. We create high-fidelity 3D assets, realistic low-poly environments, and smooth technical animations.')
    RETURNING id
)
INSERT INTO languagelist (services_id, languages_id) SELECT s.id, texts.id FROM s, texts;

-- web
WITH s AS (
    INSERT INTO services (projectdescription, iconidentifier) VALUES ('The future of the web in 3D. We build lightning-fast WebGL and WebXR applications that run directly in standard browsers without installation.', 'web') RETURNING id
), texts AS (
    INSERT INTO languages (description, languagetype, text) VALUES
        ('title', 'da', 'Interaktive Web-oplevelser'),
        ('description', 'da', 'Fremtidens web i 3D. Vi bygger lynsnarre WebGL- og WebXR-applikationer, der kører direkte i standard-browsere uden installation.'),
        ('title', 'en', 'Interactive Web Experiences'),
        ('description', 'en', 'The future of the web in 3D. We build lightning-fast WebGL and WebXR applications that run directly in standard browsers without installation.')
    RETURNING id
)
INSERT INTO languagelist (services_id, languages_id) SELECT s.id, texts.id FROM s, texts;

-- The first administrator of Innopixel Studio
WITH n AS (
    INSERT INTO name (firstname, middlename, lastname) VALUES ('Michael', 'Lundorff', 'Hansen') RETURNING id
), u AS (
    INSERT INTO "user" (email, name_id) SELECT 'michael@innopixel.dk', n.id FROM n RETURNING id
), e AS (
    INSERT INTO employee (id, title, department) SELECT u.id, 'Producer & partner', 'Ledelse' FROM u RETURNING id
)
INSERT INTO admin (id) SELECT e.id FROM e;

COMMIT;
