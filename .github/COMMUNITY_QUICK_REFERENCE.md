# Community Features - Quick Reference

## 🎯 What's New

All community features backend is **complete and ready for frontend integration**.

---

## 📊 Summary of Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **Membership** |
| PATCH | `/api/community/join-request/:id` | Approve/reject join request |
| DELETE | `/api/community/join-request/:id` | Cancel own join request |
| GET | `/api/community/:id` | Get community details + members |
| POST | `/api/community/:id/leave` | Leave community |
| **Moderators** |
| POST | `/api/community/:id/moderators` | Promote member to moderator |
| DELETE | `/api/community/:id/moderators/:userId` | Demote moderator to member |
| **Issues** |
| POST | `/api/community/:id/claim-issue` | Claim waste issue |
| DELETE | `/api/community/:id/claim-issue/:issueId` | Unclaim issue |
| GET | `/api/community/:id/issues` | Get active + completed issues |
| PATCH | `/api/community/:id/issues/:issueId` | Mark issue as completed |
| **Discussions** |
| GET | `/api/community/:id/discussions` | Get discussion messages |
| POST | `/api/community/:id/discussions` | Post new message |

---

## 🔐 Key Constraints

### Moderators
- **Min:** 2 per community
- **Max:** 5 per community
- Only owner can promote/demote
- Endpoints return proper error codes (409 Conflict when limits violated)

### Issues
- Each issue can be claimed by only one community
- Three status states: `active`, `completed`, `cancelled`
- Active and completed issues separated in response

### Discussions
- Members-only access
- Max 5000 characters per message
- Paginated (default 50, max 100)

---

## 💡 Usage Patterns

### Approve/Reject Join Request
```typescript
const response = await fetch(`/api/community/join-request/${requestId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'approve' }) // or 'reject'
});
```

### Add/Remove Moderators
```typescript
// Promote to moderator
const res = await fetch(`/api/community/${communityId}/moderators`, {
  method: 'POST',
  body: JSON.stringify({ userId })
});

// Demote from moderator
const res = await fetch(`/api/community/${communityId}/moderators/${userId}`, {
  method: 'DELETE'
});
```

### Claim & Complete Issues
```typescript
// Claim issue
await fetch(`/api/community/${communityId}/claim-issue`, {
  method: 'POST',
  body: JSON.stringify({ issueId })
});

// Mark complete
await fetch(`/api/community/${communityId}/issues/${issueId}`, {
  method: 'PATCH'
});

// Unclaim
await fetch(`/api/community/${communityId}/claim-issue/${issueId}`, {
  method: 'DELETE'
});
```

### Get Issues (Active + Completed Separated)
```typescript
const res = await fetch(`/api/community/${communityId}/issues`);
const { activeIssues, completedIssues, pagination } = await res.json();

// Shows all active issues + all completed issues
// UI can separate them with a divider as requested
```

### Post Discussion
```typescript
await fetch(`/api/community/${communityId}/discussions`, {
  method: 'POST',
  body: JSON.stringify({ message: "Let's meet Saturday!" })
});
```

---

## 🛠️ Database Models

### CommunityDiscussion
- `id`, `communityId`, `userId`, `message`
- `createdAt`, `updatedAt`
- Indexed by communityId, userId, createdAt

### CommunityClaimedIssue
- `id`, `communityId`, `issueId`, `claimedBy`
- `status`: 'active' | 'completed' | 'cancelled'
- `claimedAt`, `completedAt`
- Unique constraint: (communityId, issueId)

---

## 🚦 Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business logic violation (e.g., mod limit) |
| 500 | Server Error | Unexpected error |

---

## 📋 UI Integration Map

| Page | Feature | Endpoint(s) |
|------|---------|-----------|
| `/requests` | Approve/reject requests | PATCH join-request/:id |
| `/overview` | View details, leave community | GET :id, POST :id/leave |
| `/issues` | Claim, complete, unclaim issues | POST/PATCH/DELETE claim-issue, GET issues |
| `/discussions` | Post/view messages | GET/POST discussions |

---

## ✨ Notes for Frontend

1. **Issues Page Layout:**
   - Active issues at top
   - Separator line or section break
   - Completed issues below
   - Use the separated response to structure UI

2. **Moderator UI:**
   - Hide moderator buttons if user is not owner
   - Show visual feedback when hitting mod limits
   - Use 409 error code to show "Maximum moderators reached"

3. **Discussions:**
   - Chat UI not yet created, use above endpoints
   - Implement pagination for performance
   - Consider infinite scroll or load-more button

4. **Access Control:**
   - Check user role from community details endpoint
   - Hide claim-issue button for non-moderators
   - Hide moderator management for non-owners

---

## 🐛 Debugging Tips

- All endpoints return `{ success: boolean, data: {...}, error: "..." }`
- Check status codes and error messages for debugging
- Issues endpoint returns both active + completed (not separate calls)
- Moderator constraints enforced with proper 409 responses
- Database migration already applied ✅

