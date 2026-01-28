# Admin Verification System Guide

## Overview

The admin verification system allows you to systematically review and verify development data, ensuring accuracy and building trust with users.

## Setup Instructions

### 1. Run Database Migration

First, add the verification columns to your Supabase database:

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/migrations/add_verification_columns.sql`
4. Run the migration

This adds the following columns to the `developments` table:
- `verified` (boolean) - Whether the development has been verified
- `verified_at` (timestamp) - When the development was last verified
- `verification_notes` (text) - Optional notes from the verification process
- `flagged_for_review` (boolean) - Whether the development needs additional review

### 2. Set Admin Password (Optional)

The default admin password is `btr2025admin`. To change it:

1. Create or update `.env.local` file in the project root
2. Add: `NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password_here`
3. Restart your development server

### 3. Access the Admin Interface

Navigate to: `https://yourdomain.com/admin/verify`

Enter the admin password to access the verification interface.

## Using the Verification Interface

### Overview

The interface shows:
- **Progress bar**: Tracks overall verification progress
- **Filters**: Filter by verification status, region, type, or search by name
- **Split view**: Development data on left, website preview on right
- **Action buttons**: Verify, save, skip, flag, and navigate between developments

### Keyboard Shortcuts

- **V** - Verify & Next (marks as verified, saves changes, moves to next)
- **S** - Skip to Next (moves to next without verifying)
- **P** - Previous (go back to previous development)
- **ESC** - Cancel editing

### Workflow

1. **Review Development Data**
   - Check all fields for accuracy
   - Edit any incorrect information inline
   - Verify the website URL loads correctly in the preview

2. **Check Website**
   - Use the iframe preview to view the actual website
   - Click "Open in New Tab" for a full-screen view
   - Verify the information matches what's shown

3. **Take Action**
   - **Verify & Next (V)**: Data is correct, mark as verified and move to next
   - **Save Changes**: Save your edits without marking as verified
   - **Skip to Next (S)**: Move to next development without changes
   - **Flag for Review**: Mark problematic developments for later review

### Features

#### Autosave
- Changes are automatically saved every 5 seconds
- Manual save button available for immediate saves
- Save status indicator shows: "Saved" / "Saving..." / "Unsaved changes"

#### Filters
- **All / Unverified / Verified**: Focus on what needs attention
- **Region**: Filter by UK region
- **Type**: Filter by Multifamily or Single Family
- **Search**: Find specific developments by name

#### Inline Editing
- Click any field to edit
- Changes are tracked in real-time
- Unsaved changes are highlighted

#### Verification Notes
- Add optional notes during verification
- Useful for documenting issues or observations
- Notes are saved with the development

## Frontend Display

### Development Cards
Verified developments show a small badge at the bottom:
- ✓ "Verified today" (for developments verified today)
- ✓ "Verified 3 days ago" (for recent verifications)
- ✓ "Verified Jan 2025" (for older verifications)

### Development Detail Pages
Verification status appears next to the status badge at the top:
- Green checkmark icon with verification date
- Builds trust by showing data freshness

## Best Practices

### Verification Process
1. **Start with unverified**: Use "Unverified" filter to see what needs attention
2. **Verify 20-30 per session**: Keep sessions manageable
3. **Flag uncertain data**: Use "Flag for Review" rather than guessing
4. **Add notes**: Document any issues or questions

### Data Quality
- **Check website**: Always verify the website loads correctly
- **Verify units**: Ensure unit counts match the website
- **Confirm status**: Make sure operational status is current
- **Update regions**: Add regions for Single Family developments if missing

### Efficiency Tips
- Use keyboard shortcuts (V, S, P) for speed
- Keep website preview visible to cross-reference
- Use filters to focus on specific types or regions
- Let autosave handle small edits, use manual save for major changes

## Troubleshooting

### "No developments found"
- Check your filters - you may have filtered out all results
- Try resetting filters to "All"

### Website preview not loading
- Some websites block iframe embedding
- Use "Open in New Tab" button instead
- If website doesn't exist, leave URL blank or update it

### Changes not saving
- Check your internet connection
- Look for error messages in browser console
- Ensure you have proper Supabase permissions

### Can't access admin page
- Verify admin password is correct
- Check `.env.local` if you set a custom password
- Clear browser cache and try again

## Verification Statistics

Track your progress:
- Total developments: ~614
- Verification goal: 100% of published developments
- Suggested pace: 20-30 verifications per session
- Re-verification: Every 90 days for stale data

## Data Freshness

The system tracks verification age:
- **Green** (0-30 days): Recently verified, fresh data
- **Yellow** (31-90 days): Due for re-verification
- **Red** (90+ days): Stale data, priority for re-verification

## Security Notes

- Admin password is stored in environment variable
- Session is stored in browser sessionStorage
- Logging out clears the session
- Always log out when finished
- Use a strong admin password in production

## Support

For issues or questions:
- Check browser console for errors
- Verify Supabase connection is working
- Ensure all database columns are added via migration
- Contact development team if problems persist
