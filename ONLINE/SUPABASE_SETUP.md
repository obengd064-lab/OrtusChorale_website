# Staff admin setup

The site uses Supabase Auth for staff sign-in, `site_content` for homepage
text, hero slideshow, events, gallery, and patron/executive profiles,
`organization_members` for member records, and the
`site-media` Storage bucket for images and audio. Only users with the server-managed
`app_metadata.role` value `admin` can edit site content, manage members, grant
admin access, or upload files. There is no public staff sign-up.

## Configure Supabase

1. Create a Supabase project.
2. Open the project's SQL Editor and run [`supabase/schema.sql`](./supabase/schema.sql).
   Run the current file even if an earlier version was applied: this installs
   the admin-only read/add policies needed by the member directory and enables
   audio uploads in the existing media bucket. The script keeps existing
   published content and is safe to rerun.
3. In Supabase project settings, copy the Project URL and the **anon/public** key
   into `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `supabase-config.js`.
   These settings are public browser credentials; never use the service-role key.
4. In Authentication settings, turn off public sign-ups. Create the first
   administrator's account from **Authentication → Users → Add user**.
5. Bootstrap the first site administrator from the SQL Editor, replacing the
   email with that account's address:

   ```sql
   update auth.users
   set raw_app_meta_data =
       coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'staff@example.com';
   ```

   Have that administrator sign out and back in to refresh the role in their
   session. Add their member record in the dashboard and use **Grant admin**
   to link the directory record to the authenticated account.
6. In Vercel, open the project's **Settings → Environment Variables** and add
   these for the Production environment (and Preview if you test preview
   deployments):
   - `SUPABASE_URL` — the project URL
   - `SUPABASE_ANON_KEY` — the anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — the server-side service-role key, marked sensitive

   The service-role key is used only by the server-side Vercel function for member
   edits/removals and Auth role changes. Member listing and adding use
   administrator-only Supabase row-level security. Never put the service-role key
   in `supabase-config.js` or any browser code. After adding or changing variables,
   redeploy the project.
7. Deploy the site files to Vercel. Keep `index.html`, `about.html`,
   `events.html`, `music.html`, `gallery.html`, `patrons-executives.html`,
   `join.html`, `site.css`, `site.js`, `admin.html`, `admin.css`, `admin.js`,
   `api/admin/members.js`, `supabase-config.js`, and the `supabase` folder
   in the deployment. Add the production site URL to
   Supabase Auth's allowed redirect URLs for invitations and password resets.

### Emergency manual role removal

The dashboard can revoke admin access. If you need to remove the bootstrap
administrator manually, run this in Supabase's SQL Editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'role'
where email = 'staff@example.com';
```

## Using the admin page

Open `/admin.html`, sign in with an admin account, and use the sidebar to manage
member records or website content. Member records include name, email, voice
part, membership status, and join date. **Grant admin** sends an invitation if
the member does not yet have a Supabase account; after opening it, the member
can set a password from the dashboard's account security panel. Removing a
member or revoking admin access removes their site-admin role.

The publishing studio manages the homepage heading and introduction, the Our
Story page text and photo, logo, highlight statistics, crossfading hero
slideshow, events, music recordings, gallery photos, and the profiles on the
Patrons & Executives page. Add each leader's real name, position, group,
portrait, and image description; no profile is prefilled with invented
personal information. Save and publish to update the public pages. Image and
audio uploads are limited to 20 MB.
Supported images are JPEG, PNG, WebP, and GIF; supported audio is MP3, WAV,
OGG, M4A, AAC, and FLAC.

The public navigation opens a separate page for Home, Our Story, Events, Music,
Gallery, Patrons & Executives, and Join the Choir. Each page uses the animated
CV monogram preloader.
