# Spoken English Trainer (Browser)

This is a ready-to-upload static web package for a Spoken English Trainer (Grades 1–7).
Files included:
- index.html
- style.css
- script.js
- lessons.json (full multi-grade sample)
- admin.html
- admin.js
- README.md

Instructions:
1. Create a GitHub repository and upload all files to the repository root.
2. In repo Settings → Pages, select "Deploy from branch: main / (root)".
3. After GitHub builds, your site will be available at `https://<username>.github.io/<repo>/`.

Admin panel:
- Visit `/admin.html`.
- Default admin password (client-side) is `teach123`. Change after deployment.

Notes:
- Speech Recognition works best in Chrome/Edge.
- Admin edits saved via the Admin Panel are client-side only; to persist changes for all users, update `lessons.json` in the repository.
