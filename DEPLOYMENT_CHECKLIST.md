# BTR Directory - Deployment Checklist

## Pre-Deployment

### 1. Supabase Setup
- [ ] Create Supabase account at supabase.com
- [ ] Create new project
- [ ] Note down project URL and anon key
- [ ] Run `database/schema.sql` in SQL Editor
- [ ] (Optional) Run `database/sample-data.sql` for test data
- [ ] Verify tables are created in Table Editor

### 2. Environment Variables
- [ ] Create `.env.local` file
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Test connection by running `npm run dev`

### 3. Local Testing
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Visit http://localhost:3000
- [ ] Test homepage loads
- [ ] Test multifamily directory
- [ ] Test single family directory
- [ ] Test asset owners page
- [ ] Test operators page
- [ ] Test suppliers page
- [ ] Test newsletter signup
- [ ] Test correction form
- [ ] Test supplier submission form

## Deployment to Vercel

### 1. Git Repository
- [ ] Initialize git: `git init`
- [ ] Add remote: `git remote add origin <your-repo-url>`
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Push: `git push -u origin main`

### 2. Vercel Setup
- [ ] Go to vercel.com
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete

### 3. Post-Deployment Testing
- [ ] Visit your deployed URL
- [ ] Test all pages load correctly
- [ ] Test forms submit successfully
- [ ] Test newsletter signup
- [ ] Check mobile responsiveness
- [ ] Test all navigation links
- [ ] Verify development detail pages work
- [ ] Test filters on directory pages

## Content Population

### 1. Add Real Data
- [ ] Add asset owners via Supabase dashboard
- [ ] Add operators via Supabase dashboard
- [ ] Add suppliers via Supabase dashboard
- [ ] Add developments with proper slugs
- [ ] Link developments to asset owners
- [ ] Link developments to operators
- [ ] Add development images (URLs)
- [ ] Set featured developments (is_featured = true)

### 2. Data Quality Checks
- [ ] All slugs are URL-friendly (lowercase, hyphens)
- [ ] All published developments have is_published = true
- [ ] Featured developments appear on homepage
- [ ] All images load correctly
- [ ] All external links work
- [ ] Contact emails are valid

## SEO & Analytics (Optional)

### 1. SEO
- [ ] Add Google Search Console
- [ ] Submit sitemap
- [ ] Verify meta tags on all pages
- [ ] Check Open Graph images
- [ ] Test social media sharing

### 2. Analytics
- [ ] Add Google Analytics
- [ ] Set up conversion tracking for forms
- [ ] Track newsletter signups
- [ ] Monitor page views

## Performance (Optional)

### 1. Optimization
- [ ] Compress images
- [ ] Enable Vercel Analytics
- [ ] Check Lighthouse scores
- [ ] Test mobile performance
- [ ] Verify loading times

## Monitoring

### 1. Regular Checks
- [ ] Monitor Supabase usage
- [ ] Check form submissions weekly
- [ ] Review correction requests
- [ ] Approve supplier submissions
- [ ] Export newsletter emails monthly

## Launch Announcement

### 1. Marketing
- [ ] Prepare launch announcement
- [ ] Create social media posts
- [ ] Email industry contacts
- [ ] Share in BTR communities
- [ ] Submit to directories

## Post-Launch

### 1. Immediate Actions (First Week)
- [ ] Monitor error logs in Vercel
- [ ] Check Supabase error logs
- [ ] Respond to user feedback
- [ ] Fix any critical bugs
- [ ] Add any missing data

### 2. Ongoing Maintenance
- [ ] Weekly: Review form submissions
- [ ] Monthly: Update development statuses
- [ ] Monthly: Add new developments
- [ ] Quarterly: Review and update content
- [ ] As needed: Approve supplier submissions

## Success Metrics

Track these metrics after launch:
- [ ] Total page views
- [ ] Newsletter signups
- [ ] Form submissions
- [ ] Development detail page views
- [ ] Time on site
- [ ] Bounce rate
- [ ] Mobile vs desktop traffic

---

## Quick Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Git
git status           # Check status
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to remote

# Vercel
vercel               # Deploy to preview
vercel --prod        # Deploy to production
```

---

## Support Resources

- **README.md** - Setup instructions
- **PROJECT_SUMMARY.md** - Feature overview
- **database/schema.sql** - Database structure
- **database/sample-data.sql** - Test data

Good luck with your launch! 🚀
