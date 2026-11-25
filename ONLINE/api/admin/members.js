const VOICE_PARTS = new Set(["Soprano", "Alto", "Tenor", "Bass", "Not sure"]);
const MEMBERSHIP_STATUSES = new Set(["Active", "Inactive"]);
const MEMBER_FIELDS = "id,full_name,email,voice_part,membership_status,joined_at,is_admin,auth_user_id,created_at";

function send(res, status, payload) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(payload));
}

function badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

async function responseBody(response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

function getSettings() {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceKey) {
        throw new Error("Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.");
    }
    return { url: url.replace(/\/+$/, ""), anonKey, serviceKey };
}

function serviceHeaders(serviceKey, extra) {
    return {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        "Content-Type": "application/json",
        ...extra
    };
}

async function serviceRequest(settings, path, options) {
    const response = await fetch(settings.url + path, {
        ...options,
        headers: serviceHeaders(settings.serviceKey, options && options.headers)
    });
    const data = await responseBody(response);
    if (!response.ok) {
        throw new Error(data && (data.message || data.msg || data.error_description) || "Supabase request failed.");
    }
    return data;
}

async function findAuthUserByEmail(settings, email) {
    const pageSize = 100;
    for (let page = 1; page <= 100; page += 1) {
        const result = await serviceRequest(
            settings,
            "/auth/v1/admin/users?page=" + page + "&per_page=" + pageSize,
            { method: "GET" }
        );
        const users = result && Array.isArray(result.users) ? result.users : [];
        const user = users.find(item => (item.email || "").toLowerCase() === email);
        if (user) return user;
        if (users.length < pageSize) return null;
    }
    throw new Error("Could not safely search all auth accounts. Contact the site administrator.");
}

async function updateAuthRole(settings, user, role) {
    const appMetadata = { ...(user.app_metadata || {}), role };
    return serviceRequest(
        settings,
        "/auth/v1/admin/users/" + encodeURIComponent(user.id),
        {
            method: "PUT",
            body: JSON.stringify({ app_metadata: appMetadata })
        }
    );
}

async function findMemberAuthUser(settings, member) {
    const result = member.auth_user_id
        ? await serviceRequest(settings, "/auth/v1/admin/users/" + encodeURIComponent(member.auth_user_id), { method: "GET" })
        : await findAuthUserByEmail(settings, member.email);
    return result && (result.user || result);
}

async function authorizeAdmin(req, settings) {
    const authorization = req.headers.authorization || "";
    const token = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!token) return { error: "Sign in with an admin account.", status: 401 };

    const response = await fetch(settings.url + "/auth/v1/user", {
        headers: {
            apikey: settings.anonKey,
            Authorization: "Bearer " + token[1]
        }
    });
    const user = await responseBody(response);
    if (!response.ok || !user || !user.id) {
        return { error: "Your session is invalid or has expired. Sign in again.", status: 401 };
    }
    if (!user.app_metadata || user.app_metadata.role !== "admin") {
        return { error: "Admin access is required.", status: 403 };
    }
    return { user };
}

async function readRequestBody(req) {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
        try {
            return JSON.parse(req.body);
        } catch {
            throw badRequest("Request body must be valid JSON.");
        }
    }
    return {};
}

function validateMember(input) {
    const fullName = typeof input.full_name === "string" ? input.full_name.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const voicePart = input.voice_part;
    const membershipStatus = input.membership_status;
    const joinedAt = input.joined_at;

    if (!fullName || fullName.length > 120) throw badRequest("Enter a name of 1–120 characters.");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw badRequest("Enter a valid email address.");
    }
    if (!VOICE_PARTS.has(voicePart)) throw badRequest("Choose a valid voice part.");
    if (!MEMBERSHIP_STATUSES.has(membershipStatus)) throw badRequest("Choose Active or Inactive status.");
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(joinedAt || "")
        ? new Date(joinedAt + "T00:00:00Z")
        : null;
    if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== joinedAt) {
        throw badRequest("Enter a valid join date.");
    }
    return {
        full_name: fullName,
        email,
        voice_part: voicePart,
        membership_status: membershipStatus,
        joined_at: joinedAt
    };
}

async function getMember(settings, id) {
    const rows = await serviceRequest(
        settings,
        "/rest/v1/organization_members?id=eq." + encodeURIComponent(id) + "&select=" + MEMBER_FIELDS,
        { method: "GET" }
    );
    if (!Array.isArray(rows) || !rows[0]) {
        const error = new Error("Member record not found.");
        error.status = 404;
        throw error;
    }
    return rows[0];
}

async function setMemberAdmin(settings, req, member, makeAdmin, linkedUser) {
    let user = linkedUser === undefined ? await findMemberAuthUser(settings, member) : linkedUser;
    let invited = false;
    const previousRole = user && user.app_metadata && user.app_metadata.role;

    if (makeAdmin) {
        if (!user) {
            const origin = req.headers.origin || (process.env.VERCEL_URL && "https://" + process.env.VERCEL_URL);
            const redirect = origin ? "?redirect_to=" + encodeURIComponent(origin.replace(/\/+$/, "") + "/admin.html") : "";
            const invitation = await serviceRequest(
                settings,
                "/auth/v1/invite" + redirect,
                {
                    method: "POST",
                    body: JSON.stringify({ email: member.email, data: { full_name: member.full_name } })
                }
            );
            user = invitation && (invitation.user || invitation);
            if (!user || !user.id) throw new Error("Supabase did not return the invited user account.");
            invited = true;
        }
        const updatedUser = await updateAuthRole(settings, user, "admin");
        user = updatedUser && (updatedUser.user || updatedUser) || user;
    } else if (user) {
        await updateAuthRole(settings, user, "member");
    }

    let rows;
    try {
        rows = await serviceRequest(
            settings,
            "/rest/v1/organization_members?id=eq." + encodeURIComponent(member.id) + "&select=" + MEMBER_FIELDS,
            {
                method: "PATCH",
                headers: { Prefer: "return=representation" },
                body: JSON.stringify({ is_admin: makeAdmin, auth_user_id: makeAdmin && user ? user.id : null })
            }
        );
    } catch (error) {
        if (user) {
            try {
                await updateAuthRole(settings, user, previousRole || (member.is_admin ? "admin" : "member"));
            } catch (rollbackError) {
                console.error("Could not roll back an incomplete admin-role update:", rollbackError);
            }
        }
        throw error;
    }
    if (!Array.isArray(rows) || !rows[0]) throw new Error("The member role changed, but the member record could not be updated.");
    return { member: rows[0], invited };
}

async function ensureAnotherAdminRemains(settings, excludedMemberId) {
    const admins = await serviceRequest(
        settings,
        "/rest/v1/organization_members?select=id&is_admin=eq.true&id=neq." + encodeURIComponent(excludedMemberId),
        { method: "GET" }
    );
    if (!Array.isArray(admins) || admins.length <= 1) {
        const error = new Error("At least one member must retain admin access.");
        error.status = 409;
        throw error;
    }
}

module.exports = async function handler(req, res) {
    if (!["GET", "POST"].includes(req.method)) {
        res.setHeader("Allow", "GET, POST");
        return send(res, 405, { error: "Method not allowed." });
    }

    let settings;
    try {
        settings = getSettings();
    } catch (error) {
        console.error(error.message);
        return send(res, 503, { error: "The member service is not configured in Vercel." });
    }

    try {
        const access = await authorizeAdmin(req, settings);
        if (access.error) return send(res, access.status, { error: access.error });

        if (req.method === "GET") {
            const members = await serviceRequest(
                settings,
                "/rest/v1/organization_members?select=" + MEMBER_FIELDS + "&order=full_name.asc",
                { method: "GET" }
            );
            return send(res, 200, { members });
        }

        const body = await readRequestBody(req);
        if (body.action === "add") {
            const member = validateMember(body.member || {});
            const rows = await serviceRequest(
                settings,
                "/rest/v1/organization_members?select=" + MEMBER_FIELDS,
                {
                    method: "POST",
                    headers: { Prefer: "return=representation" },
                    body: JSON.stringify(member)
                }
            );
            return send(res, 201, { member: rows[0] });
        }

        if (body.action === "update") {
            const id = typeof body.member_id === "string" ? body.member_id : "";
            if (!/^[0-9a-f-]{36}$/i.test(id)) return send(res, 400, { error: "Invalid member ID." });
            const existing = await getMember(settings, id);
            const member = validateMember(body.member || {});
            if (existing.is_admin && member.email !== existing.email) {
                return send(res, 409, { error: "Revoke admin access before changing an admin's email address." });
            }
            const rows = await serviceRequest(
                settings,
                "/rest/v1/organization_members?id=eq." + encodeURIComponent(id) + "&select=" + MEMBER_FIELDS,
                {
                    method: "PATCH",
                    headers: { Prefer: "return=representation" },
                    body: JSON.stringify(member)
                }
            );
            return send(res, 200, { member: rows[0] });
        }

        if (body.action === "set-admin") {
            const id = typeof body.member_id === "string" ? body.member_id : "";
            if (!/^[0-9a-f-]{36}$/i.test(id) || typeof body.is_admin !== "boolean") {
                return send(res, 400, { error: "A valid member ID and admin setting are required." });
            }
            const member = await getMember(settings, id);
            const linkedUser = await findMemberAuthUser(settings, member);
            const hasAdminAccess = member.is_admin || Boolean(linkedUser && linkedUser.app_metadata
                && linkedUser.app_metadata.role === "admin");
            if (!body.is_admin && !hasAdminAccess) return send(res, 200, { member, invited: false });
            if (!body.is_admin && (member.auth_user_id === access.user.id
                || linkedUser && linkedUser.id === access.user.id
                || member.email.toLowerCase() === (access.user.email || "").toLowerCase())) {
                return send(res, 409, { error: "You cannot revoke your own admin access." });
            }
            if (!body.is_admin) await ensureAnotherAdminRemains(settings, member.id);
            const result = await setMemberAdmin(settings, req, member, body.is_admin, linkedUser);
            return send(res, 200, result);
        }

        if (body.action === "remove") {
            const id = typeof body.member_id === "string" ? body.member_id : "";
            if (!/^[0-9a-f-]{36}$/i.test(id)) return send(res, 400, { error: "Invalid member ID." });
            const member = await getMember(settings, id);
            if (member.auth_user_id === access.user.id
                || member.email.toLowerCase() === (access.user.email || "").toLowerCase()) {
                return send(res, 409, { error: "You cannot remove your own member account." });
            }
            const linkedUser = await findMemberAuthUser(settings, member);
            const hasAdminAccess = member.is_admin || Boolean(linkedUser && linkedUser.app_metadata
                && linkedUser.app_metadata.role === "admin");
            if (linkedUser && linkedUser.id === access.user.id) {
                return send(res, 409, { error: "You cannot remove your own member account." });
            }
            if (hasAdminAccess) {
                await ensureAnotherAdminRemains(settings, member.id);
                await setMemberAdmin(settings, req, member, false, linkedUser);
            }
            await serviceRequest(
                settings,
                "/rest/v1/organization_members?id=eq." + encodeURIComponent(id),
                { method: "DELETE" }
            );
            return send(res, 200, { removed: true });
        }

        return send(res, 400, { error: "Unknown member action." });
    } catch (error) {
        if (!error.status || error.status >= 500) console.error("Member API request failed:", error);
        return send(res, error.status || 500, { error: error.message || "The member request failed." });
    }
};
