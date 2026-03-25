# Phase 0 Quick Reference Card

## Quick Setup Commands

1. **Link Vercel Project**
   ```bash
   vercel link --yes
   ```

2. **Deploy to Production**
   ```bash
   vercel --prod
   ```

3. **Run Quality Gates**
   ```bash
   npm run typecheck && npm run lint && npm run build 
   ```

## Essential Steps

1. [ ] Update .env.local with Supabase credentials
2. [ ] Set environment vars in Vercel dashboard
3. [ ] Test sync between iOS and Supabase
4. [ ] Verify database schema in Supabase
5. [ ] Run all quality gates

## Success Checklist

- [ ] Local dev server runs without errors
- [ ] Supabase connection established
- [ ] Sync functions work in both directions
- [ ] Production build successful
- [ ] Vercel deployment live and functional

## Common Issues & Solutions

**Problem:** Build failing?
**Solution:** Check .env vars, run `npm install`

**Problem:** Sync not working?
**Solution:** Verify Supabase API key permissions, check RLS policies

**Problem:** Deployment errors in Vercel?
**Solution:** Ensure environment variables match local setup