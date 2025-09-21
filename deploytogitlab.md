## Deploy to GitLab Pages

This repo includes a `.gitlab-ci.yml` that builds the app and publishes it to **GitLab Pages**.

1. Create a new project on GitLab and push this repo.
2. Make sure **Pages** is enabled for your project (Settings → Pages).
3. Pipelines will:
   - **build** on every branch and for MRs (artifact in `dist/`)
   - **deploy to Pages** from the default branch (`main` by default)

The pipeline sets `VITE_BASE=$CI_PAGES_URL/` so Vite generates correct absolute asset URLs (e.g., `https://<group>.gitlab.io/<project>/`).  
Your site will be available at that address once the **pages** job completes.

> If you deploy under a custom domain, you can override `VITE_BASE` in CI/CD Variables (Project → Settings → CI/CD → Variables).
