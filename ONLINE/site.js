const defaultContent = {
    hero_heading: "Voices raised in praise.",
    hero_intro: "A community of singers sharing African choral traditions, gospel, and classical music across Ghana's Central Region.",
    logo_url: "",
    logo_alt: "Ortus Chorale Ghana logo",
    stats: {
        voices: 38,
        years_singing: 12,
        annual_concerts: 24,
        region: "Central"
    },
    story: {
        page_heading: "Rooted in community. United by song.",
        page_intro: "We bring voices together in Bawjiase to celebrate Ghanaian heritage and share the joy of choral music.",
        eyebrow: "A shared purpose",
        heading: "Faith, unity, and harmony.",
        paragraphs: [
            "Founded in BAWJIASE, Ortus Chorale Ghana brings together singers of every age and experience. We celebrate Ghanaian heritage through choral music while building friendships and uplifting communities.",
            "From sacred anthems and classical works to contemporary gospel, every performance is prepared with heart, discipline, and joy.",
            "Our rehearsals and performances are an invitation to grow in music, serve our neighbours, and find harmony in one another."
        ],
        image_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1100&q=85",
        image_alt: "Choir performing together",
        closing_heading: "Come make music with us.",
        closing_cta: "See our events"
    },
    hero_slides: [
        {
            image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1400&q=85",
            alt: "Choir performing together"
        },
        {
            image: "https://images.unsplash.com/photo-1522158637959-30385a09e0da?auto=format&fit=crop&w=1400&q=85",
            alt: "Choir members at an event"
        },
        {
            image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1400&q=85",
            alt: "Concert stage prepared for a choral performance"
        }
    ],
    events: [
        {
            date: "Sun · 6 Dec",
            time: "5 PM",
            title: "Advent Praise Night",
            description: "Our annual evening of scripture, African hymns, and stirring choral music.",
            image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=900&q=85",
            alt: "Concert stage"
        },
        {
            date: "Sat · 19 Dec",
            time: "6 PM",
            title: "Christmas by the Sea",
            description: "A festive concert with Cape Coast friends overlooking the Atlantic coast.",
            image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85",
            alt: "Live music performance"
        },
        {
            date: "Sun · 10 Jan",
            time: "4 PM",
            title: "Voices & Friends",
            description: "An intimate community concert featuring guest soloists and emerging voices.",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=85",
            alt: "Singer performing"
        }
    ],
    gallery: [
        {
            caption: "Annual concert",
            image: "https://images.unsplash.com/photo-1522158637959-30385a09e0da?auto=format&fit=crop&w=1000&q=85",
            alt: "Choir members at an event"
        },
        {
            caption: "Sunday rehearsal",
            image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85",
            alt: "Live choir performance"
        },
        {
            caption: "Community outreach",
            image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=85",
            alt: "Music gathering"
        }
    ],
    music: [
        { title: "Adom", description: "Traditional Ghanaian hymn", duration: "3:42", audio_url: "" },
        { title: "Nyame Ye", description: "Contemporary gospel arrangement", duration: "4:18", audio_url: "" },
        { title: "Ave Verum Corpus", description: "W. A. Mozart", duration: "3:05", audio_url: "" }
    ],
    leadership: []
};

const counterTimers = new WeakMap();

const shellHeader = document.getElementById("siteHeader");
const shellFooter = document.getElementById("siteFooter");
const pageName = window.location.pathname.split("/").pop() || "index.html";

if (shellHeader) {
    shellHeader.innerHTML = `
        <div class="announcement">Join us this Sunday at 5:00 PM — BAWJIASE Community Choir Service</div>
        <nav class="site-nav" aria-label="Main navigation">
            <a class="brand" href="index.html" aria-label="Ortus Chorale Ghana home">
                <span class="brand-mark" aria-hidden="true">CV</span>
                <span>ORTUS CHORALE GHANA</span>
            </a>
            <button class="menu-button" id="menuButton" type="button" aria-label="Open menu" aria-expanded="false">☰</button>
            <div class="nav-links" id="navLinks">
                <a href="index.html" data-page-link>Home</a>
                <a href="about.html" data-page-link>Our Story</a>
                <a href="events.html" data-page-link>Events</a>
                <a href="music.html" data-page-link>Music</a>
                <a href="gallery.html" data-page-link>Gallery</a>
                <a href="patrons-executives.html" data-page-link>Patrons &amp; Executives</a>
                <a class="nav-cta" href="join.html" data-page-link>Join the Choir</a>
                <a class="nav-staff" href="admin.html" hidden>Admin dashboard</a>
            </div>
        </nav>`;
    shellHeader.querySelectorAll("[data-page-link]").forEach(link => {
        if (link.getAttribute("href") === pageName) link.setAttribute("aria-current", "page");
    });

    const menuButton = shellHeader.querySelector("#menuButton");
    const navLinks = shellHeader.querySelector("#navLinks");
    const staffLink = navLinks.querySelector(".nav-staff");
    const updateStaffLink = session => {
        const isAdmin = Boolean(session && session.user
            && session.user.app_metadata && session.user.app_metadata.role === "admin");
        staffLink.hidden = !isAdmin;
        staffLink.textContent = isAdmin ? "Admin dashboard" : "Staff login";
    };
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((_event, session) => updateStaffLink(session));
        window.supabaseClient.auth.getSession().then(({ data, error }) => {
            if (error) {
                console.error("Could not check staff navigation access:", error);
                return;
            }
            updateStaffLink(data.session);
        }).catch(error => console.error("Could not check staff navigation access:", error));
    }
    menuButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.textContent = isOpen ? "×" : "☰";
    });
    navLinks.addEventListener("click", event => {
        if (event.target.closest("a")) {
            navLinks.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.textContent = "☰";
        }
    });
}

if (shellFooter) {
    shellFooter.className = "site-footer";
    shellFooter.innerHTML = `
        <div class="page-width">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">CV</span><span>ORTUS CHORALE GHANA</span></a>
                    <p>Singing with purpose, serving with love, and sharing Ghanaian choral music across the Central Region.</p>
                </div>
                <div>
                    <h2>Explore</h2>
                    <ul>
                        <li><a href="about.html">Our Story</a></li>
                        <li><a href="events.html">Events</a></li>
                        <li><a href="music.html">Music</a></li>
                        <li><a href="gallery.html">Gallery</a></li>
                        <li><a href="patrons-executives.html">Patrons &amp; Executives</a></li>
                    </ul>
                </div>
                <div>
                    <h2>Find us</h2>
                    <ul>
                        <li>BAWJIASE, Central Region, Ghana</li>
                        <li>Rehearsals: Saturdays</li>
                        <li><a href="mailto:hello@centralvoices.org">hello@centralvoices.org</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <span>© <span id="copyrightYear"></span> Ortus Chorale Ghana</span>
                <span>Made with joy in Ghana</span>
            </div>
        </div>`;
    document.getElementById("copyrightYear").textContent = String(new Date().getFullYear());
}

function safeImageUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
        const url = new URL(value.trim(), window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

function emptyMessage(container, message) {
    const text = document.createElement("p");
    text.className = "empty-message";
    text.textContent = message;
    container.replaceChildren(text);
}

function renderHeroSlides(items) {
    const host = document.getElementById("heroSlideshow");
    if (!host) return;
    const slides = items.filter(item => item && typeof item.alt === "string" && safeImageUrl(item.image));
    if (!slides.length) {
        host.replaceChildren();
        return;
    }

    const imageStack = document.createElement("div");
    imageStack.className = "hero-slides";
    const controls = document.createElement("div");
    controls.className = "slide-controls";
    controls.setAttribute("aria-label", "Choose a hero photograph");
    let activeIndex = 0;
    const figures = [];
    const dots = [];

    function activate(index) {
        activeIndex = (index + slides.length) % slides.length;
        figures.forEach((figure, figureIndex) => {
            const active = figureIndex === activeIndex;
            figure.classList.toggle("is-active", active);
            figure.setAttribute("aria-hidden", String(!active));
            dots[figureIndex].setAttribute("aria-current", String(active));
        });
    }

    slides.forEach((item, index) => {
        const figure = document.createElement("figure");
        figure.className = "hero-slide" + (index === 0 ? " is-active" : "");
        figure.setAttribute("aria-hidden", String(index !== 0));
        const image = document.createElement("img");
        image.src = safeImageUrl(item.image);
        image.alt = item.alt;
        image.loading = "eager";
        figure.append(image);
        imageStack.append(figure);
        figures.push(figure);

        const dot = document.createElement("button");
        dot.className = "slide-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", "Show photograph " + (index + 1));
        dot.setAttribute("aria-current", String(index === 0));
        dot.addEventListener("click", () => activate(index));
        controls.append(dot);
        dots.push(dot);
    });
    host.replaceChildren(imageStack, controls);

    if (slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.setInterval(() => activate(activeIndex + 1), 5600);
    }
}

function renderEvents(items) {
    const host = document.getElementById("eventGrid");
    if (!host) return;
    const validEvents = items.filter(item => item && typeof item.title === "string"
        && typeof item.description === "string" && safeImageUrl(item.image));
    if (!validEvents.length) {
        emptyMessage(host, "There are no upcoming events to display right now.");
        return;
    }
    host.replaceChildren();
    validEvents.forEach(item => {
        const article = document.createElement("article");
        article.className = "event-card reveal";
        const imageWrap = document.createElement("div");
        imageWrap.className = "event-image";
        const image = document.createElement("img");
        image.src = safeImageUrl(item.image);
        image.alt = item.alt || item.title;
        image.loading = "lazy";
        imageWrap.append(image);
        const body = document.createElement("div");
        body.className = "event-body";
        const meta = document.createElement("div");
        meta.className = "event-meta";
        meta.textContent = [item.date, item.time].filter(Boolean).join(" · ");
        const title = document.createElement("h2");
        title.textContent = item.title;
        const description = document.createElement("p");
        description.textContent = item.description;
        body.append(meta, title, description);
        article.append(imageWrap, body);
        host.append(article);
    });
    observeReveals(host.querySelectorAll(".reveal"));
}

function renderGallery(items) {
    const host = document.getElementById("galleryGrid");
    if (!host) return;
    const validItems = items.filter(item => item && typeof item.caption === "string" && safeImageUrl(item.image));
    if (!validItems.length) {
        emptyMessage(host, "Photos will be added to the gallery soon.");
        return;
    }
    host.replaceChildren();
    validItems.forEach(item => {
        const figure = document.createElement("figure");
        figure.className = "gallery-item reveal";
        const image = document.createElement("img");
        image.src = safeImageUrl(item.image);
        image.alt = item.alt || item.caption;
        image.loading = "lazy";
        const caption = document.createElement("figcaption");
        caption.className = "gallery-caption";
        caption.textContent = item.caption;
        figure.append(image, caption);
        host.append(figure);
    });
    observeReveals(host.querySelectorAll(".reveal"));
}

function renderLeadership(items) {
    const host = document.getElementById("leadershipGrid");
    if (!host) return;
    const validItems = items.filter(item => item && typeof item.name === "string"
        && typeof item.position === "string" && safeImageUrl(item.image));
    if (!validItems.length) {
        emptyMessage(host, "Our patrons and executives will be introduced here soon.");
        return;
    }
    host.replaceChildren();
    validItems.forEach(item => {
        const article = document.createElement("article");
        article.className = "leader-card reveal";
        const image = document.createElement("img");
        image.src = safeImageUrl(item.image);
        image.alt = item.alt || item.name;
        image.loading = "lazy";
        const info = document.createElement("div");
        info.className = "leader-info";
        const category = document.createElement("span");
        category.textContent = item.category === "Patron" ? "Patron" : "Executive";
        const name = document.createElement("h2");
        name.textContent = item.name;
        const position = document.createElement("p");
        position.textContent = item.position;
        info.append(category, name, position);
        article.append(image, info);
        host.append(article);
    });
    observeReveals(host.querySelectorAll(".reveal"));
}

function renderMusic(items) {
    const host = document.getElementById("musicList");
    if (!host) return;
    const validTracks = items.filter(item => item && typeof item.title === "string"
        && typeof item.description === "string");
    if (!validTracks.length) {
        emptyMessage(host, "Music recordings will be added soon.");
        return;
    }
    host.replaceChildren();
    validTracks.forEach(item => {
        const row = document.createElement("article");
        row.className = "music-track reveal";
        const details = document.createElement("div");
        details.className = "track-name";
        const title = document.createElement("strong");
        title.textContent = item.title;
        const description = document.createElement("span");
        description.textContent = item.description;
        details.append(title, description);
        const audioUrl = safeImageUrl(item.audio_url);
        if (audioUrl) {
            const audio = document.createElement("audio");
            audio.controls = true;
            audio.preload = "none";
            audio.setAttribute("aria-label", "Play " + item.title);
            audio.src = audioUrl;
            row.append(details, audio);
        } else {
            const unavailable = document.createElement("span");
            unavailable.className = "track-unavailable";
            unavailable.textContent = "Recording coming soon";
            row.append(details, unavailable);
        }
        if (item.duration) {
            const duration = document.createElement("span");
            duration.className = "track-duration";
            duration.textContent = item.duration;
            row.append(duration);
        }
        host.append(row);
    });
    observeReveals(host.querySelectorAll(".reveal"));
}

function renderLogo(content) {
    const logoUrl = safeImageUrl(content.logo_url);
    const preloader = document.getElementById("sitePreloader");
    if (preloader && typeof content.logo_alt === "string" && content.logo_alt.trim()) {
        preloader.setAttribute("aria-label", "Loading " + content.logo_alt.trim());
    }
    document.querySelectorAll(".brand-mark, .loader-emblem").forEach(mark => {
        mark.replaceChildren();
        if (!logoUrl) {
            mark.textContent = "CV";
            return;
        }
        const image = document.createElement("img");
        image.className = "brand-logo-image";
        image.src = logoUrl;
        image.alt = "";
        mark.append(image);
    });
}

function animateStat(element, value) {
    const target = Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
    window.clearInterval(counterTimers.get(element));
    element.dataset.count = String(target);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.textContent = String(target);
        return;
    }
    let current = 0;
    element.textContent = "0";
    const timer = window.setInterval(() => {
        current += Math.max(1, Math.ceil(target / 30));
        if (current >= target) {
            current = target;
            window.clearInterval(timer);
        }
        element.textContent = String(current);
    }, 35);
    counterTimers.set(element, timer);
}

function renderHomepageStats(stats) {
    const values = {
        voices: stats && stats.voices,
        years_singing: stats && stats.years_singing,
        annual_concerts: stats && stats.annual_concerts
    };
    document.querySelectorAll("[data-stat]").forEach(element => {
        const key = element.dataset.stat;
        if (key === "region") {
            element.textContent = typeof (stats && stats.region) === "string" && stats.region.trim()
                ? stats.region.trim()
                : defaultContent.stats.region;
        } else if (Object.prototype.hasOwnProperty.call(values, key)) {
            animateStat(element, Number.isSafeInteger(Number(values[key])) && Number(values[key]) >= 0
                ? Number(values[key])
                : defaultContent.stats[key]);
        }
    });
}

function renderPublishedContent(content) {
    const heading = document.getElementById("heroHeading");
    const intro = document.getElementById("heroIntro");
    if (heading) heading.textContent = content.hero_heading || defaultContent.hero_heading;
    if (intro) intro.textContent = content.hero_intro || defaultContent.hero_intro;
    const story = content.story && typeof content.story === "object" && !Array.isArray(content.story)
        ? { ...defaultContent.story, ...content.story }
        : defaultContent.story;
    const storyText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    storyText("storyPageHeading", story.page_heading || defaultContent.story.page_heading);
    storyText("storyPageIntro", story.page_intro || defaultContent.story.page_intro);
    storyText("storyEyebrow", story.eyebrow || defaultContent.story.eyebrow);
    storyText("storyHeading", story.heading || defaultContent.story.heading);
    storyText("storyParagraph1", Array.isArray(story.paragraphs) && typeof story.paragraphs[0] === "string"
        ? story.paragraphs[0] : defaultContent.story.paragraphs[0]);
    storyText("storyParagraph2", Array.isArray(story.paragraphs) && typeof story.paragraphs[1] === "string"
        ? story.paragraphs[1] : defaultContent.story.paragraphs[1]);
    storyText("storyParagraph3", Array.isArray(story.paragraphs) && typeof story.paragraphs[2] === "string"
        ? story.paragraphs[2] : defaultContent.story.paragraphs[2]);
    storyText("storyClosingHeading", story.closing_heading || defaultContent.story.closing_heading);
    storyText("storyClosingCta", story.closing_cta || defaultContent.story.closing_cta);
    const storyImage = document.getElementById("storyImage");
    if (storyImage) {
        storyImage.src = safeImageUrl(story.image_url) || defaultContent.story.image_url;
        storyImage.alt = story.image_alt || defaultContent.story.image_alt;
    }
    renderLogo(content);
    renderHomepageStats(content.stats || defaultContent.stats);
    renderHeroSlides(Array.isArray(content.hero_slides) ? content.hero_slides : defaultContent.hero_slides);
    renderEvents(Array.isArray(content.events) ? content.events : defaultContent.events);
    renderGallery(Array.isArray(content.gallery) ? content.gallery : defaultContent.gallery);
    renderMusic(Array.isArray(content.music) ? content.music : defaultContent.music);
    renderLeadership(Array.isArray(content.leadership) ? content.leadership : []);
}

async function loadPublishedContent() {
    const configUrl = typeof window.SUPABASE_URL === "string" ? window.SUPABASE_URL.trim() : "";
    const configKey = window.SUPABASE_ANON_KEY;
    renderPublishedContent(defaultContent);
    if (!configUrl && !configKey) return;
    if (!configUrl || !configKey || !window.supabase) {
        console.error("Site content integration is not configured. Check supabase-config.js and the Supabase client script.");
        return;
    }

    try {
        const client = window.supabaseClient || window.supabase.createClient(configUrl, configKey);
        const { data, error } = await client
            .from("site_content")
            .select("payload")
            .eq("id", true)
            .single();
        if (error) throw error;
        if (!data || !data.payload || typeof data.payload !== "object") {
            throw new Error("Published site content has an invalid format.");
        }
        renderPublishedContent({ ...defaultContent, ...data.payload });
    } catch (error) {
        console.error("Could not load published site content:", error);
    }
}

function observeReveals(items) {
    if (!("IntersectionObserver" in window)) {
        items.forEach(item => item.classList.add("visible"));
        return;
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    items.forEach(item => observer.observe(item));
}

document.querySelectorAll(".reveal").forEach(item => observeReveals([item]));

loadPublishedContent();
const preloader = document.getElementById("sitePreloader");
function hidePreloader() {
    if (preloader) preloader.classList.add("is-hidden");
}
window.setTimeout(hidePreloader, 350);

const joinForm = document.getElementById("joinForm");
if (joinForm) {
    joinForm.addEventListener("submit", event => {
        event.preventDefault();
        document.getElementById("joinStatus").textContent =
            "This form is not connected to email yet. Please contact hello@centralvoices.org to apply.";
        joinForm.reset();
    });
}
