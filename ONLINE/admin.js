const loginPanel = document.getElementById("loginPanel");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const memberStatus = document.getElementById("memberStatus");
const memberFormStatus = document.getElementById("memberFormStatus");
const contentStatus = document.getElementById("contentStatus");
const passwordStatus = document.getElementById("passwordStatus");
const memberRows = document.getElementById("memberRows");
const memberSelect = "id,full_name,email,voice_part,membership_status,joined_at,is_admin,auth_user_id,created_at";
const eventsEditor = document.getElementById("eventsEditor");
const galleryEditor = document.getElementById("galleryItemsEditor");
const heroSlidesEditor = document.getElementById("heroSlidesItemsEditor");
const musicEditor = document.getElementById("musicItemsEditor");
const leadershipEditor = document.getElementById("leadershipItemsEditor");
const logoUploadControl = document.getElementById("logoUploadControl");
const storyImageUploadControl = document.getElementById("storyImageUploadControl");
const memberDialog = document.getElementById("memberDialog");
const memberForm = document.getElementById("memberForm");
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const audioTypeByExtension = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac"
};
const defaultHomepageStats = {
    voices: 38,
    years_singing: 12,
    annual_concerts: 24,
    region: "Central"
};
const defaultStoryContent = {
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
};
const defaultMusic = [
    { title: "Adom", description: "Traditional Ghanaian hymn", duration: "3:42", audio_url: "" },
    { title: "Nyame Ye", description: "Contemporary gospel arrangement", duration: "4:18", audio_url: "" },
    { title: "Ave Verum Corpus", description: "W. A. Mozart", duration: "3:05", audio_url: "" }
];
const defaultHeroSlides = [
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
];
let client;
let currentContent;
let members = [];

function showStatus(element, message, isError) {
    element.textContent = message;
    element.classList.toggle("error", Boolean(isError));
}

function configuredClient() {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || !window.supabase) {
        throw new Error("Supabase is not configured. Check supabase-config.js and the Supabase client script.");
    }
    if (window.supabaseClient) return window.supabaseClient;
    window.supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL.trim(),
        window.SUPABASE_ANON_KEY
    );
    return window.supabaseClient;
}

function isAdmin(user) {
    return Boolean(user && user.app_metadata && user.app_metadata.role === "admin");
}

function isWebUrl(value) {
    try {
        return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
        return false;
    }
}

function localDateString() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
}

function initialsFor(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase();
}

async function memberApi(action, payload) {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error("Your session has expired. Sign in again.");
    const options = {
        method: action === "list" ? "GET" : "POST",
        headers: { Authorization: "Bearer " + data.session.access_token }
    };
    if (action !== "list") {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(payload);
    }
    const response = await fetch("/api/admin/members", options);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "The member request failed.");
    return result;
}

function switchView(name, scrollTarget) {
    document.querySelectorAll("[data-view-panel]").forEach(panel => {
        panel.classList.toggle("hidden", panel.dataset.viewPanel !== name);
    });
    document.querySelectorAll(".side-link[data-view]").forEach(button => {
        const active = button.dataset.view === name
            && (scrollTarget ? button.dataset.scroll === scrollTarget : !button.dataset.scroll);
        button.classList.toggle("active", active);
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });
    const titles = {
        overview: "Overview",
        members: "Member directory",
        content: "Website content",
        brandSettings: "Brand & statistics",
        heroSlidesEditor: "Hero slideshow",
        musicEditor: "Music page",
        galleryEditor: "Media & gallery",
        leadershipEditor: "Patrons & executives",
        storyEditor: "Story page"
    };
    document.getElementById("pageTitle").textContent = titles[scrollTarget] || titles[name] || "Overview";
    adminPanel.classList.remove("sidebar-open");
    document.getElementById("menuButton").setAttribute("aria-expanded", "false");
    if (scrollTarget) {
        window.setTimeout(() => document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function createField(labelText, value, options) {
    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("label");
    const control = options.multiline ? document.createElement("textarea") : document.createElement("input");
    const id = "field-" + crypto.randomUUID();
    label.htmlFor = id;
    label.textContent = labelText;
    control.id = id;
    control.value = value || "";
    control.required = Boolean(options.required);
    control.maxLength = options.maxLength || 1000;
    if (!options.multiline) control.type = options.type || "text";
    field.append(label, control);
    return { field, control };
}

function uploadControl(item, imageField, altField) {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const label = document.createElement("label");
    label.textContent = "Upload or replace photo";
    const uploadLabel = document.createElement("label");
    uploadLabel.className = "upload-label";
    uploadLabel.textContent = "Choose image";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = Array.from(allowedImageTypes).join(",");
    uploadLabel.append(input);
    const preview = document.createElement("img");
    preview.className = "image-preview";
    preview.alt = "";
    if (isWebUrl(item.image)) preview.src = item.image;
    else preview.classList.add("hidden");

    input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;
        if (!allowedImageTypes.has(file.type) || file.size > 20 * 1024 * 1024) {
            showStatus(contentStatus, "Choose a JPEG, PNG, WebP, or GIF image up to 20 MB.", true);
            input.value = "";
            return;
        }
        input.disabled = true;
        showStatus(contentStatus, "Uploading image…", false);
        try {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
            const path = Date.now() + "-" + crypto.randomUUID() + "-" + safeName;
            const { error } = await client.storage.from("site-media").upload(path, file, {
                cacheControl: "3600",
                contentType: file.type,
                upsert: false
            });
            if (error) throw error;
            const { data } = client.storage.from("site-media").getPublicUrl(path);
            imageField.control.value = data.publicUrl;
            preview.src = data.publicUrl;
            preview.classList.remove("hidden");
            if (!altField.control.value) altField.control.value = file.name.replace(/\.[^.]+$/, "");
            showStatus(contentStatus, "Image uploaded. Save and publish to use it on the website.", false);
        } catch (error) {
            showStatus(contentStatus, "Image upload failed: " + error.message, true);
        } finally {
            input.disabled = false;
            input.value = "";
        }
    });
    wrapper.append(label, uploadLabel, preview);
    return wrapper;
}

function audioUploadControl(item, audioField) {
    const wrapper = document.createElement("div");
    wrapper.className = "field";
    const label = document.createElement("label");
    label.textContent = "Upload or replace audio file";
    const uploadLabel = document.createElement("label");
    uploadLabel.className = "upload-label";
    uploadLabel.textContent = "Choose audio";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mp3,.wav,.ogg,.m4a,.aac,.flac,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/flac";
    uploadLabel.append(input);
    const preview = document.createElement("audio");
    preview.controls = true;
    preview.preload = "none";
    preview.className = "audio-preview";
    if (isWebUrl(item.audio_url)) preview.src = item.audio_url;
    else preview.classList.add("hidden");

    input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;
        const extension = file.name.split(".").pop().toLowerCase();
        const contentType = audioTypeByExtension[extension];
        if (!contentType || file.size > 20 * 1024 * 1024) {
            showStatus(contentStatus, "Choose an MP3, WAV, OGG, M4A, AAC, or FLAC audio file up to 20 MB.", true);
            input.value = "";
            return;
        }
        input.disabled = true;
        showStatus(contentStatus, "Uploading audio…", false);
        try {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
            const path = "audio/" + Date.now() + "-" + crypto.randomUUID() + "-" + safeName;
            const { error } = await client.storage.from("site-media").upload(path, file, {
                cacheControl: "3600",
                contentType,
                upsert: false
            });
            if (error) throw error;
            const { data } = client.storage.from("site-media").getPublicUrl(path);
            audioField.control.value = data.publicUrl;
            preview.src = data.publicUrl;
            preview.classList.remove("hidden");
            showStatus(contentStatus, "Audio uploaded. Save and publish to use it on the music page.", false);
        } catch (error) {
            showStatus(contentStatus, "Audio upload failed: " + error.message, true);
        } finally {
            input.disabled = false;
            input.value = "";
        }
    });
    wrapper.append(label, uploadLabel, preview);
    return wrapper;
}

function renderEvents(items) {
    eventsEditor.replaceChildren();
    items.forEach((item, index) => {
        const card = document.createElement("section");
        card.className = "editor-item";
        const heading = document.createElement("div");
        heading.className = "item-heading";
        const title = document.createElement("h3");
        title.textContent = item.title || "New event";
        const remove = document.createElement("button");
        remove.className = "small-button danger";
        remove.type = "button";
        remove.textContent = "Remove event";
        remove.addEventListener("click", () => {
            currentContent.events = collectEventsFromEditor();
            currentContent.events.splice(index, 1);
            renderEvents(currentContent.events);
        });
        heading.append(title, remove);
        const date = createField("Date", item.date, { required: true, maxLength: 80 });
        const time = createField("Time", item.time, { required: true, maxLength: 40 });
        const name = createField("Event name", item.title, { required: true, maxLength: 120 });
        const description = createField("Description", item.description, { required: true, multiline: true, maxLength: 500 });
        const image = createField("Image URL", item.image, { required: true, maxLength: 2000 });
        const alt = createField("Image description", item.alt, { required: true, maxLength: 200 });
        card.append(heading, date.field, time.field, name.field, description.field, image.field, alt.field, uploadControl(item, image, alt));
        name.control.addEventListener("input", () => { title.textContent = name.control.value || "New event"; });
        eventsEditor.append(card);
    });
}

function renderGallery(items) {
    galleryEditor.replaceChildren();
    items.forEach((item, index) => {
        const card = document.createElement("section");
        card.className = "editor-item";
        const heading = document.createElement("div");
        heading.className = "item-heading";
        const title = document.createElement("h3");
        title.textContent = item.caption || "New photo";
        const remove = document.createElement("button");
        remove.className = "small-button danger";
        remove.type = "button";
        remove.textContent = "Remove photo";
        remove.addEventListener("click", () => {
            currentContent.gallery = collectGalleryFromEditor();
            currentContent.gallery.splice(index, 1);
            renderGallery(currentContent.gallery);
        });
        heading.append(title, remove);
        const caption = createField("Caption", item.caption, { required: true, maxLength: 120 });
        const image = createField("Image URL", item.image, { required: true, maxLength: 2000 });
        const alt = createField("Image description", item.alt, { required: true, maxLength: 200 });
        card.append(heading, caption.field, image.field, alt.field, uploadControl(item, image, alt));
        caption.control.addEventListener("input", () => { title.textContent = caption.control.value || "New photo"; });
        galleryEditor.append(card);
    });
}

function renderHeroSlides(items) {
    heroSlidesEditor.replaceChildren();
    items.forEach((item, index) => {
        const card = document.createElement("section");
        card.className = "editor-item";
        const heading = document.createElement("div");
        heading.className = "item-heading";
        const title = document.createElement("h3");
        title.textContent = "Slide " + (index + 1);
        const remove = document.createElement("button");
        remove.className = "small-button danger";
        remove.type = "button";
        remove.textContent = "Remove slide";
        remove.addEventListener("click", () => {
            currentContent.hero_slides = collectHeroSlidesFromEditor();
            currentContent.hero_slides.splice(index, 1);
            renderHeroSlides(currentContent.hero_slides);
        });
        heading.append(title, remove);
        const image = createField("Image URL", item.image, { required: true, maxLength: 2000 });
        const alt = createField("Image description", item.alt, { required: true, maxLength: 200 });
        card.append(heading, image.field, alt.field, uploadControl(item, image, alt));
        heroSlidesEditor.append(card);
    });
}

function renderMusic(items) {
    musicEditor.replaceChildren();
    items.forEach((item, index) => {
        const card = document.createElement("section");
        card.className = "editor-item";
        const heading = document.createElement("div");
        heading.className = "item-heading";
        const title = document.createElement("h3");
        title.textContent = item.title || "New recording";
        const remove = document.createElement("button");
        remove.className = "small-button danger";
        remove.type = "button";
        remove.textContent = "Remove recording";
        remove.addEventListener("click", () => {
            currentContent.music = collectMusicFromEditor();
            currentContent.music.splice(index, 1);
            renderMusic(currentContent.music);
        });
        heading.append(title, remove);

        const name = createField("Song title", item.title, { required: true, maxLength: 120 });
        const description = createField("Composer or description", item.description, {
            required: true,
            multiline: true,
            maxLength: 300
        });
        const duration = createField("Duration (optional)", item.duration, { maxLength: 20 });
        const audio = createField("Audio file URL", item.audio_url, { maxLength: 2000 });
        card.append(heading, name.field, description.field, duration.field, audio.field, audioUploadControl(item, audio));
        name.control.addEventListener("input", () => { title.textContent = name.control.value || "New recording"; });
        musicEditor.append(card);
    });
}

function renderLeadership(items) {
    leadershipEditor.replaceChildren();
    items.forEach((item, index) => {
        const card = document.createElement("section");
        card.className = "editor-item";
        const heading = document.createElement("div");
        heading.className = "item-heading";
        const title = document.createElement("h3");
        title.textContent = item.name || "New person";
        const remove = document.createElement("button");
        remove.className = "small-button danger";
        remove.type = "button";
        remove.textContent = "Remove person";
        remove.addEventListener("click", () => {
            currentContent.leadership = collectLeadershipFromEditor();
            currentContent.leadership.splice(index, 1);
            renderLeadership(currentContent.leadership);
        });
        heading.append(title, remove);

        const name = createField("Full name", item.name, { required: true, maxLength: 120 });
        const position = createField("Position", item.position, { required: true, maxLength: 120 });
        const categoryField = document.createElement("div");
        categoryField.className = "field";
        const categoryLabel = document.createElement("label");
        const category = document.createElement("select");
        const categoryId = "leadership-category-" + index;
        categoryLabel.htmlFor = categoryId;
        categoryLabel.textContent = "Group";
        category.id = categoryId;
        category.required = true;
        ["Executive", "Patron"].forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            category.append(option);
        });
        category.value = item.category === "Patron" ? "Patron" : "Executive";
        categoryField.append(categoryLabel, category);

        const image = createField("Portrait image URL", item.image, { required: true, maxLength: 2000 });
        const alt = createField("Image description", item.alt, { required: true, maxLength: 200 });
        card.append(heading, name.field, position.field, categoryField, image.field, alt.field, uploadControl(item, image, alt));
        name.control.addEventListener("input", () => { title.textContent = name.control.value || "New person"; });
        leadershipEditor.append(card);
    });
}

function collectHeroSlidesFromEditor() {
    return Array.from(heroSlidesEditor.querySelectorAll(".editor-item"), card => {
        const controls = card.querySelectorAll(".field input");
        return { image: controls[0].value.trim(), alt: controls[1].value.trim() };
    });
}

function collectLeadershipFromEditor() {
    return Array.from(leadershipEditor.querySelectorAll(".editor-item"), card => {
        const controls = card.querySelectorAll(".field input, .field select");
        return {
            name: controls[0].value.trim(),
            position: controls[1].value.trim(),
            category: controls[2].value,
            image: controls[3].value.trim(),
            alt: controls[4].value.trim()
        };
    });
}

function collectMusicFromEditor() {
    return Array.from(musicEditor.querySelectorAll(".editor-item"), card => {
        const controls = card.querySelectorAll(".field > input, .field > textarea");
        return {
            title: controls[0].value.trim(),
            description: controls[1].value.trim(),
            duration: controls[2].value.trim(),
            audio_url: controls[3].value.trim()
        };
    });
}

function collectEventsFromEditor() {
    return Array.from(eventsEditor.querySelectorAll(".editor-item"), card => {
        const controls = card.querySelectorAll(".field input, .field textarea");
        return {
            date: controls[0].value.trim(),
            time: controls[1].value.trim(),
            title: controls[2].value.trim(),
            description: controls[3].value.trim(),
            image: controls[4].value.trim(),
            alt: controls[5].value.trim()
        };
    });
}

function collectGalleryFromEditor() {
    return Array.from(galleryEditor.querySelectorAll(".editor-item"), card => {
        const controls = card.querySelectorAll(".field input, .field textarea");
        return {
            caption: controls[0].value.trim(),
            image: controls[1].value.trim(),
            alt: controls[2].value.trim()
        };
    });
}

function renderMembers() {
    const query = document.getElementById("memberSearch").value.trim().toLowerCase();
    const filtered = members.filter(member =>
        [member.full_name, member.email, member.voice_part, member.membership_status]
            .some(value => String(value).toLowerCase().includes(query))
    );
    memberRows.replaceChildren();
    document.getElementById("memberCountLabel").textContent =
        members.length + (members.length === 1 ? " member" : " members");
    document.getElementById("totalMembers").textContent = String(members.length);
    document.getElementById("activeMembers").textContent =
        String(members.filter(member => member.membership_status === "Active").length);
    document.getElementById("adminMembers").textContent =
        String(members.filter(member => member.is_admin).length);

    if (!filtered.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 6;
        cell.className = "empty-state";
        cell.textContent = query ? "No members match that search." : "No members have been added yet.";
        row.append(cell);
        memberRows.append(row);
    } else {
        filtered.forEach(member => memberRows.append(createMemberRow(member)));
    }
    renderRecentMembers();
}

function createMemberRow(member) {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const memberCell = document.createElement("div");
    memberCell.className = "member-cell";
    const avatar = document.createElement("span");
    avatar.className = "member-initial";
    avatar.textContent = initialsFor(member.full_name);
    const identity = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = member.full_name;
    const email = document.createElement("small");
    email.textContent = member.email;
    identity.append(name, email);
    memberCell.append(avatar, identity);
    nameCell.append(memberCell);

    const voice = document.createElement("td");
    voice.textContent = member.voice_part;
    const status = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = "badge" + (member.membership_status === "Inactive" ? " inactive" : "");
    statusBadge.textContent = member.membership_status;
    status.append(statusBadge);
    const joined = document.createElement("td");
    joined.textContent = new Date(member.joined_at + "T00:00:00").toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric"
    });
    const access = document.createElement("td");
    const accessBadge = document.createElement("span");
    accessBadge.className = "badge" + (member.is_admin ? " admin" : "");
    accessBadge.textContent = member.is_admin ? "Site admin" : "Member";
    access.append(accessBadge);

    const actions = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "row-actions";
    const edit = document.createElement("button");
    edit.className = "small-button";
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openMemberDialog(member));
    const role = document.createElement("button");
    role.className = "small-button";
    role.type = "button";
    role.textContent = member.is_admin ? "Revoke admin" : "Grant admin";
    role.addEventListener("click", () => changeAdminRole(member, !member.is_admin, role));
    const remove = document.createElement("button");
    remove.className = "small-button danger";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeMember(member, remove));
    actionWrap.append(edit, role, remove);
    actions.append(actionWrap);
    row.append(nameCell, voice, status, joined, access, actions);
    return row;
}

function renderRecentMembers() {
    const list = document.getElementById("recentMembers");
    list.replaceChildren();
    const recent = [...members]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 4);
    if (!recent.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Add your first member to start the directory.";
        list.append(empty);
        return;
    }
    recent.forEach(member => {
        const item = document.createElement("div");
        item.className = "recent-item";
        const avatar = document.createElement("span");
        avatar.className = "recent-avatar";
        avatar.textContent = initialsFor(member.full_name);
        const identity = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = member.full_name;
        const detail = document.createElement("small");
        detail.textContent = member.voice_part + " · " + member.membership_status;
        identity.append(name, detail);
        const date = document.createElement("time");
        date.className = "recent-date";
        date.dateTime = member.created_at;
        date.textContent = new Date(member.created_at).toLocaleDateString(undefined, {
            month: "short", day: "numeric"
        });
        item.append(avatar, identity, date);
        list.append(item);
    });
}

async function loadMembers() {
    showStatus(memberStatus, "Loading member records…", false);
    const { data, error } = await client
        .from("organization_members")
        .select(memberSelect)
        .order("full_name", { ascending: true });
    if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
            throw new Error("The organization_members table is missing. Run the current supabase/schema.sql in the Supabase SQL Editor.");
        }
        if (error.code === "42501") {
            throw new Error("Supabase denied member access. Run the current supabase/schema.sql to apply the admin-only member policies.");
        }
        throw error;
    }
    if (!Array.isArray(data)) throw new Error("Supabase returned an invalid member list.");
    members = data;
    renderMembers();
    showStatus(memberStatus, "", false);
}

async function loadContent() {
    showStatus(contentStatus, "Loading website content…", false);
    const { data, error } = await client.from("site_content").select("payload").eq("id", true).single();
    if (error) throw error;
    const content = data && data.payload;
    if (!content || !Array.isArray(content.events) || !Array.isArray(content.gallery)) {
        throw new Error("The saved content is missing its events or gallery. Check the Supabase schema setup.");
    }
    currentContent = structuredClone(content);
    const savedStory = currentContent.story && typeof currentContent.story === "object"
        && !Array.isArray(currentContent.story) ? currentContent.story : {};
    currentContent.story = { ...defaultStoryContent, ...savedStory };
    ["page_heading", "page_intro", "eyebrow", "heading", "image_url", "image_alt", "closing_heading", "closing_cta"]
        .forEach(key => {
            if (typeof currentContent.story[key] !== "string" || !currentContent.story[key].trim()) {
                currentContent.story[key] = defaultStoryContent[key];
            }
        });
    currentContent.story.paragraphs = Array.isArray(savedStory.paragraphs)
        ? defaultStoryContent.paragraphs.map((paragraph, index) =>
            typeof savedStory.paragraphs[index] === "string" && savedStory.paragraphs[index].trim()
                ? savedStory.paragraphs[index]
                : paragraph)
        : [...defaultStoryContent.paragraphs];
    if (!Array.isArray(currentContent.hero_slides)) currentContent.hero_slides = structuredClone(defaultHeroSlides);
    if (!Array.isArray(currentContent.music)) currentContent.music = structuredClone(defaultMusic);
    if (!Array.isArray(currentContent.leadership)) currentContent.leadership = [];
    if (!currentContent.stats || typeof currentContent.stats !== "object" || Array.isArray(currentContent.stats)) {
        currentContent.stats = {};
    }
    currentContent.stats = { ...defaultHomepageStats, ...currentContent.stats };
    ["voices", "years_singing", "annual_concerts"].forEach(key => {
        if (!Number.isSafeInteger(Number(currentContent.stats[key])) || Number(currentContent.stats[key]) < 0) {
            currentContent.stats[key] = defaultHomepageStats[key];
        }
    });
    if (typeof currentContent.stats.region !== "string" || !currentContent.stats.region.trim()) {
        currentContent.stats.region = defaultHomepageStats.region;
    }
    currentContent.logo_url = typeof currentContent.logo_url === "string" ? currentContent.logo_url : "";
    currentContent.logo_alt = typeof currentContent.logo_alt === "string" && currentContent.logo_alt.trim()
        ? currentContent.logo_alt
        : "Ortus Chorale Ghana logo";
    document.getElementById("heroHeading").value = content.hero_heading || "";
    document.getElementById("heroIntro").value = content.hero_intro || "";
    document.getElementById("storyPageHeadingInput").value = currentContent.story.page_heading;
    document.getElementById("storyPageIntroInput").value = currentContent.story.page_intro;
    document.getElementById("storyEyebrowInput").value = currentContent.story.eyebrow;
    document.getElementById("storyHeadingInput").value = currentContent.story.heading;
    document.getElementById("storyParagraph1Input").value = currentContent.story.paragraphs[0];
    document.getElementById("storyParagraph2Input").value = currentContent.story.paragraphs[1];
    document.getElementById("storyParagraph3Input").value = currentContent.story.paragraphs[2];
    document.getElementById("storyImageUrlInput").value = currentContent.story.image_url;
    document.getElementById("storyImageAltInput").value = currentContent.story.image_alt;
    document.getElementById("storyClosingHeadingInput").value = currentContent.story.closing_heading;
    document.getElementById("storyClosingCtaInput").value = currentContent.story.closing_cta;
    document.getElementById("logoUrl").value = currentContent.logo_url;
    document.getElementById("logoAlt").value = currentContent.logo_alt;
    document.getElementById("voicesCount").value = currentContent.stats.voices;
    document.getElementById("yearsSinging").value = currentContent.stats.years_singing;
    document.getElementById("annualConcerts").value = currentContent.stats.annual_concerts;
    document.getElementById("choirRegion").value = currentContent.stats.region;
    logoUploadControl.replaceChildren(uploadControl(
        { image: currentContent.logo_url },
        { control: document.getElementById("logoUrl") },
        { control: document.getElementById("logoAlt") }
    ));
    storyImageUploadControl.replaceChildren(uploadControl(
        { image: currentContent.story.image_url },
        { control: document.getElementById("storyImageUrlInput") },
        { control: document.getElementById("storyImageAltInput") }
    ));
    renderHeroSlides(currentContent.hero_slides);
    renderEvents(currentContent.events);
    renderMusic(currentContent.music);
    renderGallery(currentContent.gallery);
    renderLeadership(currentContent.leadership);
    showStatus(contentStatus, "", false);
}

function openMemberDialog(member) {
    memberForm.reset();
    showStatus(memberFormStatus, "", false);
    document.getElementById("memberId").value = member ? member.id : "";
    document.getElementById("memberDialogTitle").textContent = member ? "Edit member" : "Add a member";
    document.getElementById("memberName").value = member ? member.full_name : "";
    document.getElementById("memberEmail").value = member ? member.email : "";
    document.getElementById("memberVoice").value = member ? member.voice_part : "Not sure";
    document.getElementById("memberStatusSelect").value = member ? member.membership_status : "Active";
    document.getElementById("memberJoined").value = member ? member.joined_at : localDateString();
    memberDialog.showModal();
}

async function changeAdminRole(member, isAdminValue, button) {
    const action = isAdminValue ? "grant site-admin access to" : "revoke site-admin access for";
    if (!window.confirm("Are you sure you want to " + action + " " + member.full_name + "?")) return;
    button.disabled = true;
    showStatus(memberStatus, isAdminValue ? "Updating access and sending an invitation if needed…" : "Revoking admin access…", false);
    try {
        const result = await memberApi("change", {
            action: "set-admin",
            member_id: member.id,
            is_admin: isAdminValue
        });
        const message = result.invited
            ? "Admin access granted. An invitation was sent to " + member.email + "."
            : (isAdminValue ? "Admin access granted." : "Admin access revoked.");
        await loadMembers();
        showStatus(memberStatus, message, false);
    } catch (error) {
        showStatus(memberStatus, error.message, true);
    } finally {
        button.disabled = false;
    }
}

async function removeMember(member, button) {
    if (!window.confirm("Remove " + member.full_name + " from the organization directory?" +
        (member.is_admin ? " Their admin access will also be revoked." : ""))) return;
    button.disabled = true;
    showStatus(memberStatus, "Removing member…", false);
    try {
        await memberApi("remove", { action: "remove", member_id: member.id });
        await loadMembers();
        showStatus(memberStatus, member.full_name + " was removed from the directory.", false);
    } catch (error) {
        showStatus(memberStatus, error.message, true);
    } finally {
        button.disabled = false;
    }
}

async function acceptUser(user) {
    if (!isAdmin(user)) {
        await client.auth.signOut();
        loginPanel.classList.remove("hidden");
        adminPanel.classList.add("hidden");
        showStatus(loginStatus, "This account does not have site-admin access.", true);
        return;
    }
    loginPanel.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    document.getElementById("userEmail").textContent = user.email || "Administrator";
    document.getElementById("userInitials").textContent = initialsFor(user.email || "CV");
    switchView("overview");
    await Promise.allSettled([
        loadMembers().catch(error => showStatus(memberStatus, "Could not load member records: " + error.message, true)),
        loadContent().catch(error => showStatus(contentStatus, "Could not load website content: " + error.message, true))
    ]);
}

document.querySelectorAll(".side-link[data-view]").forEach(button => {
    button.addEventListener("click", () => switchView(button.dataset.view, button.dataset.scroll));
});
document.querySelectorAll("[data-go-view]").forEach(button => {
    button.addEventListener("click", () => switchView(button.dataset.goView));
});

document.getElementById("menuButton").addEventListener("click", event => {
    const isOpen = adminPanel.classList.toggle("sidebar-open");
    event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});
adminPanel.addEventListener("click", event => {
    if (event.target === adminPanel && adminPanel.classList.contains("sidebar-open")) {
        adminPanel.classList.remove("sidebar-open");
        document.getElementById("menuButton").setAttribute("aria-expanded", "false");
    }
});

document.getElementById("signOutButton").addEventListener("click", async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) {
        showStatus(memberStatus, "Could not sign out: " + error.message, true);
        return;
    }
    adminPanel.classList.add("hidden");
    loginPanel.classList.remove("hidden");
    loginForm.reset();
    showStatus(loginStatus, "You have signed out.", false);
});

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) return;
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    showStatus(loginStatus, "Signing in…", false);
    try {
        const { data, error } = await client.auth.signInWithPassword({
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value
        });
        if (error) throw error;
        await acceptUser(data.user);
    } catch (error) {
        showStatus(loginStatus, error.message, true);
    } finally {
        button.disabled = false;
    }
});

document.getElementById("resetPasswordButton").addEventListener("click", async () => {
    if (!client) return;
    const email = document.getElementById("email").value.trim();
    if (!email) {
        showStatus(loginStatus, "Enter your email address first, then choose Forgot password.", true);
        document.getElementById("email").focus();
        return;
    }
    showStatus(loginStatus, "Sending a password reset email…", false);
    try {
        const { error } = await client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/admin.html"
        });
        if (error) throw error;
        showStatus(loginStatus, "If that account exists, a password reset link is on its way.", false);
    } catch (error) {
        showStatus(loginStatus, error.message, true);
    }
});

document.getElementById("passwordForm").addEventListener("submit", async event => {
    event.preventDefault();
    const password = document.getElementById("newPassword").value;
    const confirmation = document.getElementById("confirmPassword").value;
    if (password.length < 8) {
        showStatus(passwordStatus, "Use a password with at least 8 characters.", true);
        return;
    }
    if (password !== confirmation) {
        showStatus(passwordStatus, "The passwords do not match.", true);
        return;
    }
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    showStatus(passwordStatus, "Updating password…", false);
    try {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        event.currentTarget.reset();
        showStatus(passwordStatus, "Password updated.", false);
    } catch (error) {
        showStatus(passwordStatus, "Could not update password: " + error.message, true);
    } finally {
        button.disabled = false;
    }
});

document.getElementById("addMemberButton").addEventListener("click", () => openMemberDialog(null));
document.getElementById("closeMemberDialog").addEventListener("click", () => memberDialog.close());
document.getElementById("cancelMemberDialog").addEventListener("click", () => memberDialog.close());
memberDialog.addEventListener("click", event => {
    if (event.target === memberDialog) memberDialog.close();
});
memberForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("saveMemberButton");
    button.disabled = true;
    showStatus(memberFormStatus, "Saving member…", false);
    const id = document.getElementById("memberId").value;
    const member = {
        full_name: document.getElementById("memberName").value,
        email: document.getElementById("memberEmail").value,
        voice_part: document.getElementById("memberVoice").value,
        membership_status: document.getElementById("memberStatusSelect").value,
        joined_at: document.getElementById("memberJoined").value
    };
    try {
        if (id) {
            await memberApi("save", { action: "update", member_id: id, member });
        } else {
            const { error } = await client
                .from("organization_members")
                .insert(member);
            if (error) throw error;
        }
        memberDialog.close();
        await loadMembers();
        showStatus(memberStatus, id ? "Member details updated." : "Member added to the directory.", false);
    } catch (error) {
        showStatus(memberFormStatus, error.message, true);
    } finally {
        button.disabled = false;
    }
});

document.getElementById("memberSearch").addEventListener("input", renderMembers);

document.getElementById("addEventButton").addEventListener("click", () => {
    currentContent.events = collectEventsFromEditor();
    currentContent.events.push({ date: "", time: "", title: "", description: "", image: "", alt: "" });
    renderEvents(currentContent.events);
});
document.getElementById("addHeroSlideButton").addEventListener("click", () => {
    currentContent.hero_slides = collectHeroSlidesFromEditor();
    currentContent.hero_slides.push({ image: "", alt: "" });
    renderHeroSlides(currentContent.hero_slides);
});
document.getElementById("addMusicButton").addEventListener("click", () => {
    currentContent.music = collectMusicFromEditor();
    currentContent.music.push({ title: "", description: "", duration: "", audio_url: "" });
    renderMusic(currentContent.music);
});
document.getElementById("addGalleryButton").addEventListener("click", () => {
    currentContent.gallery = collectGalleryFromEditor();
    currentContent.gallery.push({ caption: "", image: "", alt: "" });
    renderGallery(currentContent.gallery);
});
document.getElementById("addLeaderButton").addEventListener("click", () => {
    currentContent.leadership = collectLeadershipFromEditor();
    currentContent.leadership.push({ name: "", position: "", category: "Executive", image: "", alt: "" });
    renderLeadership(currentContent.leadership);
});
document.getElementById("contentForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!client || !currentContent) return;
    const button = document.getElementById("saveButton");
    button.disabled = true;
    showStatus(contentStatus, "Saving changes…", false);
    try {
        const heroSlides = collectHeroSlidesFromEditor();
        const events = collectEventsFromEditor();
        const music = collectMusicFromEditor();
        const gallery = collectGalleryFromEditor();
        const leadership = collectLeadershipFromEditor();
        const payload = {
            ...currentContent,
            hero_heading: document.getElementById("heroHeading").value.trim(),
            hero_intro: document.getElementById("heroIntro").value.trim(),
            story: {
                page_heading: document.getElementById("storyPageHeadingInput").value.trim(),
                page_intro: document.getElementById("storyPageIntroInput").value.trim(),
                eyebrow: document.getElementById("storyEyebrowInput").value.trim(),
                heading: document.getElementById("storyHeadingInput").value.trim(),
                paragraphs: [
                    document.getElementById("storyParagraph1Input").value.trim(),
                    document.getElementById("storyParagraph2Input").value.trim(),
                    document.getElementById("storyParagraph3Input").value.trim()
                ],
                image_url: document.getElementById("storyImageUrlInput").value.trim(),
                image_alt: document.getElementById("storyImageAltInput").value.trim(),
                closing_heading: document.getElementById("storyClosingHeadingInput").value.trim(),
                closing_cta: document.getElementById("storyClosingCtaInput").value.trim()
            },
            logo_url: document.getElementById("logoUrl").value.trim(),
            logo_alt: document.getElementById("logoAlt").value.trim() || "Ortus Chorale Ghana logo",
            stats: {
                voices: Number(document.getElementById("voicesCount").value),
                years_singing: Number(document.getElementById("yearsSinging").value),
                annual_concerts: Number(document.getElementById("annualConcerts").value),
                region: document.getElementById("choirRegion").value.trim()
            },
            hero_slides: heroSlides,
            events,
            music,
            gallery,
            leadership
        };
        if (!payload.hero_heading || !payload.hero_intro) {
            throw new Error("Enter a homepage heading and introduction.");
        }
        if (!payload.story.page_heading || !payload.story.page_intro || !payload.story.eyebrow
            || !payload.story.heading || payload.story.paragraphs.some(paragraph => !paragraph)
            || !payload.story.closing_heading || !payload.story.closing_cta
            || !isWebUrl(payload.story.image_url) || !payload.story.image_alt) {
            throw new Error("Complete the story page text and provide a valid story image with its description.");
        }
        if (payload.logo_url && !isWebUrl(payload.logo_url)) {
            throw new Error("Enter a valid HTTP(S) logo URL or upload a logo image.");
        }
        if (!payload.stats.region || ["voices", "years_singing", "annual_concerts"].some(key =>
            !Number.isSafeInteger(payload.stats[key]) || payload.stats[key] < 0 || payload.stats[key] > 99999)) {
            throw new Error("Enter whole, non-negative homepage statistics and a region.");
        }
        if (!payload.hero_slides.length || payload.hero_slides.some(item => !item.alt || !isWebUrl(item.image))) {
            throw new Error("Add at least one slideshow image with a valid HTTP(S) URL and image description.");
        }
        if (payload.events.some(item => !item.title || !item.description || !isWebUrl(item.image))) {
            throw new Error("Every event needs a title, description, and valid HTTP(S) image URL.");
        }
        if (payload.gallery.some(item => !item.caption || !isWebUrl(item.image))) {
            throw new Error("Every gallery photo needs a caption and valid HTTP(S) image URL.");
        }
        if (payload.music.some(item => !item.title || !item.description
            || (item.audio_url && !isWebUrl(item.audio_url)))) {
            throw new Error("Every music entry needs a title and description, and any audio URL must use HTTP(S).");
        }
        if (payload.leadership.some(item => !item.name || !item.position
            || !["Executive", "Patron"].includes(item.category) || !item.alt || !isWebUrl(item.image))) {
            throw new Error("Every patron or executive needs a name, position, group, valid portrait URL, and image description.");
        }
        const { error } = await client.from("site_content").upsert(
            { id: true, payload, updated_at: new Date().toISOString() },
            { onConflict: "id" }
        );
        if (error) throw error;
        currentContent = payload;
        showStatus(contentStatus, "Changes saved and published.", false);
    } catch (error) {
        showStatus(contentStatus, "Could not save changes: " + error.message, true);
    } finally {
        button.disabled = false;
    }
});

async function startAdmin() {
    try {
        client = configuredClient();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (data.session) await acceptUser(data.session.user);
    } catch (error) {
        showStatus(loginStatus, error.message, true);
    }
}

startAdmin();
