create table if not exists public.site_content (
    id boolean primary key default true check (id),
    payload jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
    on public.site_content for select
    using (true);

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
    on public.site_content for insert to authenticated
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
    on public.site_content for update to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.site_content (id, payload)
values (
    true,
    '{
        "hero_heading": "Voices raised in praise.",
        "hero_intro": "A community of singers sharing African choral traditions, gospel, and classical music across Ghana''s Central Region.",
        "logo_url": "",
        "logo_alt": "Ortus Chorale Ghana logo",
        "stats": {
            "voices": 38,
            "years_singing": 12,
            "annual_concerts": 24,
            "region": "Central"
        },
        "story": {
            "page_heading": "Rooted in community. United by song.",
            "page_intro": "We bring voices together in Bawjiase to celebrate Ghanaian heritage and share the joy of choral music.",
            "eyebrow": "A shared purpose",
            "heading": "Faith, unity, and harmony.",
            "paragraphs": [
                "Founded in BAWJIASE, Ortus Chorale Ghana brings together singers of every age and experience. We celebrate Ghanaian heritage through choral music while building friendships and uplifting communities.",
                "From sacred anthems and classical works to contemporary gospel, every performance is prepared with heart, discipline, and joy.",
                "Our rehearsals and performances are an invitation to grow in music, serve our neighbours, and find harmony in one another."
            ],
            "image_url": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1100&q=85",
            "image_alt": "Choir performing together",
            "closing_heading": "Come make music with us.",
            "closing_cta": "See our events"
        },
        "hero_slides": [
            {
                "image": "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1400&q=85",
                "alt": "Choir performing together"
            },
            {
                "image": "https://images.unsplash.com/photo-1522158637959-30385a09e0da?auto=format&fit=crop&w=1400&q=85",
                "alt": "Choir members at an event"
            },
            {
                "image": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1400&q=85",
                "alt": "Concert stage prepared for a choral performance"
            }
        ],
        "events": [
            {
                "date": "Sun · 6 Dec",
                "time": "5 PM",
                "title": "Advent Praise Night",
                "description": "Our annual evening of scripture, African hymns, and stirring choral music.",
                "image": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=85",
                "alt": "Concert stage"
            },
            {
                "date": "Sat · 19 Dec",
                "time": "6 PM",
                "title": "Christmas by the Sea",
                "description": "A festive concert with Cape Coast friends overlooking the Atlantic coast.",
                "image": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=85",
                "alt": "Live music performance"
            },
            {
                "date": "Sun · 10 Jan",
                "time": "4 PM",
                "title": "Voices & Friends",
                "description": "An intimate community concert featuring guest soloists and emerging voices.",
                "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=85",
                "alt": "Singer performing"
            }
        ],
        "gallery": [
            {
                "caption": "Annual concert",
                "image": "https://images.unsplash.com/photo-1522158637959-30385a09e0da?auto=format&fit=crop&w=1000&q=85",
                "alt": "Choir members at an event"
            },
            {
                "caption": "Sunday rehearsal",
                "image": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=700&q=85",
                "alt": "Live choir performance"
            },
            {
                "caption": "Community outreach",
                "image": "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=700&q=85",
                "alt": "Music gathering"
            }
        ],
        "music": [
            {
                "title": "Adom",
                "description": "Traditional Ghanaian hymn",
                "duration": "3:42",
                "audio_url": ""
            },
            {
                "title": "Nyame Ye",
                "description": "Contemporary gospel arrangement",
                "duration": "4:18",
                "audio_url": ""
            },
            {
                "title": "Ave Verum Corpus",
                "description": "W. A. Mozart",
                "duration": "3:05",
                "audio_url": ""
            }
        ],
        "leadership": []
    }'::jsonb
)
on conflict (id) do nothing;

create table if not exists public.organization_members (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null unique,
    voice_part text not null check (voice_part in ('Soprano', 'Alto', 'Tenor', 'Bass', 'Not sure')),
    membership_status text not null default 'Active' check (membership_status in ('Active', 'Inactive')),
    joined_at date not null default current_date,
    auth_user_id uuid references auth.users (id) on delete set null,
    is_admin boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.organization_members enable row level security;
revoke all on public.organization_members from anon, authenticated;
grant all on public.organization_members to service_role;
grant select on public.organization_members to authenticated;
grant insert (full_name, email, voice_part, membership_status, joined_at)
    on public.organization_members to authenticated;

drop policy if exists "Admins can manage organization members" on public.organization_members;
drop policy if exists "Admins can read organization members" on public.organization_members;
drop policy if exists "Admins can add organization members" on public.organization_members;
create policy "Admins can read organization members"
    on public.organization_members for select to authenticated
    using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admins can add organization members"
    on public.organization_members for insert to authenticated
    with check (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        and is_admin = false
        and auth_user_id is null
    );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'site-media',
    'site-media',
    true,
    20971520,
    array[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac', 'audio/flac'
    ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site media" on storage.objects;
create policy "Public can view site media"
    on storage.objects for select
    using (bucket_id = 'site-media');

drop policy if exists "Admins can upload site media" on storage.objects;
create policy "Admins can upload site media"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'site-media'
        and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

drop policy if exists "Admins can update site media" on storage.objects;
create policy "Admins can update site media"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'site-media'
        and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
    with check (
        bucket_id = 'site-media'
        and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

drop policy if exists "Admins can delete site media" on storage.objects;
create policy "Admins can delete site media"
    on storage.objects for delete to authenticated
    using (
        bucket_id = 'site-media'
        and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );
