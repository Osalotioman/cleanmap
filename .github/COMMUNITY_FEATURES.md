# Community Features Implementation Guide

## 📋 Overview

This document outlines all community features implemented for the CleanMap waste management application. These features enable volunteer communities to organize cleanup efforts, manage memberships, and track waste issues they're actively working on.

---

## 🏗️ Architecture

### Database Schema Updates

Three new models were added to the Prisma schema:

#### 1. **CommunityDiscussion**
Stores community discussion messages for coordination and planning.

```prisma
model CommunityDiscussion {
  id          String    @id @default(uuid())
  communityId String
  userId      String
  message     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  community   Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([communityId])
  @@index([userId])
  @@index([createdAt])
  @@map("community_discussions")
}
```

#### 2. **CommunityClaimedIssue**
Links waste reports/issues to communities that are actively working on them.

```prisma
model CommunityClaimedIssue {
  id          String    @id @default(uuid())
  communityId String
  issueId     String    // External ID from reporting system
  claimedBy   String    // Moderator who claimed it
  status      String    @default("active") // "active", "completed", "cancelled"
  claimedAt   DateTime  @default(now())
  completedAt DateTime?

  community      Community @relation(fields: [communityId], references: [id], onDelete: Cascade)
  claimedByUser  User      @relation("ClaimedIssuesAsModerator", fields: [claimedBy], references: [id], onDelete: Cascade)

  @@unique([communityId, issueId])
  @@index([communityId])
  @@index([issueId])
  @@index([status])
  @@map("community_claimed_issues")
}
```

#### 3. **Moderator Constraints**
- **Minimum Moderators:** 2 per community
- **Maximum Moderators:** 5 per community
- Handles edge cases for small communities (2-3 members) and larger ones

---

## 📡 API Endpoints

### Join Request Management

#### Approve/Reject Join Request
**PATCH** `/api/community/join-request/:id`

Moderators or community owners approve or reject pending join requests.

```json
Request Body:
{
  "action": "approve" | "reject"
}

Success Response (200):
{
  "success": true,
  "data": {
    "message": "Join request approved and user added to community",
    "joinRequest": {
      "id": "uuid",
      "userId": "...",
      "communityId": "...",
      "status": "approved",
      "requestedAt": "...",
      "respondedAt": "..."
    }
  }
}
```

#### Cancel Join Request
**DELETE** `/api/community/join-request/:id`

Users can cancel their own pending join requests.

---

### Community Membership

#### Get Community Details
**GET** `/api/community/:id`

Fetches complete community information including member list, roles, and owner info.

```json
Success Response (200):
{
  "success": true,
  "data": {
    "community": {
      "id": "uuid",
      "name": "Downtown Cleanup Initiative",
      "description": "...",
      "location": "Downtown, City Center",
      "coverageType": "neighborhood",
      "memberCount": 5,
      "status": "active",
      "owner": {
        "id": "...",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "id": "uuid",
          "userId": "...",
          "role": "owner|moderator|member",
          "joinedAt": "...",
          "user": {...}
        }
      ]
    },
    "userRole": "member|moderator|owner|null",
    "isMember": true|false
  }
}
```

#### Leave Community
**POST** `/api/community/:id/leave`

Members can leave a community (owner cannot leave without transferring ownership).

```json
Success Response (200):
{
  "success": true,
  "data": {
    "message": "You have left the community"
  }
}
```

---

### Moderator Management

#### Add Moderator
**POST** `/api/community/:id/moderators`

Owner promotes a member to moderator. Fails if max moderators (5) is reached.

```json
Request Body:
{
  "userId": "user-uuid"
}

Success Response (200):
{
  "success": true,
  "data": {
    "message": "User promoted to moderator",
    "member": {
      "id": "uuid",
      "role": "moderator",
      "user": {...}
    }
  }
}
```

#### Remove Moderator
**DELETE** `/api/community/:id/moderators/:userId`

Owner demotes a moderator back to member. Fails if minimum moderators (2) would be violated.

```json
Success Response (200):
{
  "success": true,
  "data": {
    "message": "User demoted from moderator"
  }
}
```

---

### Issue Claiming & Tracking

#### Claim Issue
**POST** `/api/community/:id/claim-issue`

Moderators claim waste reports to indicate their community is working on them.

```json
Request Body:
{
  "issueId": "issue-uuid"
}

Success Response (201):
{
  "success": true,
  "data": {
    "message": "Issue claimed successfully",
    "claimedIssue": {
      "id": "uuid",
      "communityId": "...",
      "issueId": "...",
      "claimedBy": "...",
      "status": "active",
      "claimedAt": "..."
    }
  }
}
```

#### Get Community Issues
**GET** `/api/community/:id/issues`

Fetches issues being worked on by the community, separated into active and completed.

Query Parameters:
- `status`: Filter by 'active', 'completed', or 'cancelled'
- `limit`: Max results (default: 50, max: 100)
- `offset`: Pagination offset

```json
Success Response (200):
{
  "success": true,
  "data": {
    "activeIssues": [
      {
        "id": "uuid",
        "issueId": "...",
        "status": "active",
        "claimedAt": "...",
        "claimedByUser": {...}
      }
    ],
    "completedIssues": [
      {
        "id": "uuid",
        "issueId": "...",
        "status": "completed",
        "claimedAt": "...",
        "completedAt": "...",
        "claimedByUser": {...}
      }
    ],
    "pagination": {
      "total": 15,
      "activeCount": 5,
      "completedCount": 10
    }
  }
}
```

#### Mark Issue as Completed
**PATCH** `/api/community/:id/issues/:issueId`

Moderators mark claimed issues as completed when cleanup is done.

```json
Success Response (200):
{
  "success": true,
  "data": {
    "message": "Issue marked as completed",
    "issue": {
      "id": "uuid",
      "status": "completed",
      "completedAt": "..."
    }
  }
}
```

#### Unclaim Issue
**DELETE** `/api/community/:id/claim-issue/:issueId`

Moderators can cancel their claim on an issue (marks as 'cancelled' for audit).

```json
Success Response (200):
{
  "success": true,
  "data": {
    "message": "Issue claim cancelled"
  }
}
```

---

### Community Discussions

#### Get Discussion Messages
**GET** `/api/community/:id/discussions`

Fetches community discussion messages for coordination. Only members can access.

Query Parameters:
- `limit`: Max results (default: 50, max: 100)
- `offset`: Pagination offset

```json
Success Response (200):
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "communityId": "...",
        "userId": "...",
        "message": "Let's organize a cleanup next Saturday!",
        "createdAt": "...",
        "updatedAt": "...",
        "user": {
          "id": "...",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "total": 150,
      "hasMore": true
    }
  }
}
```

#### Post Discussion Message
**POST** `/api/community/:id/discussions`

Members post messages to community discussion. Only community members can post.

```json
Request Body:
{
  "message": "Let's organize a cleanup next Saturday!"
}

Validation:
- Message cannot be empty
- Maximum 5000 characters
- User must be community member

Success Response (201):
{
  "success": true,
  "data": {
    "message": "Discussion posted successfully",
    "discussion": {...}
  }
}
```

---

## 🔐 Access Control & Permissions

| Action | Owner | Moderator | Member | Non-Member |
|--------|-------|-----------|--------|------------|
| Approve/Reject Requests | ✅ | ✅ | ❌ | ❌ |
| Add Moderator | ✅ | ❌ | ❌ | ❌ |
| Remove Moderator | ✅ | ❌ | ❌ | ❌ |
| Claim Issue | ✅ | ✅ | ❌ | ❌ |
| Complete Issue | ✅ | ✅ | ❌ | ❌ |
| Unclaim Issue | ✅ | ✅ | ❌ | ❌ |
| Post Discussion | ✅ | ✅ | ✅ | ❌ |
| Read Discussion | ✅ | ✅ | ✅ | ❌* |
| Leave Community | ✅* | ✅ | ✅ | ❌ |

*Owner cannot leave without transferring ownership
*Non-members can read if community is public (phase 2)

---

## 🎯 Feature Constraints

### Moderator Requirements
- **Minimum:** 2 moderators per community (enforced at demotion)
- **Maximum:** 5 moderators per community (enforced at promotion)
- **Edge Cases Handled:**
  - Small communities (2-3 members): Can still operate with just 2 moderators
  - Growing communities: Can have up to 5 moderators for better governance
  - Prevents demoting below minimum count

### Issue Claiming
- Communities can claim multiple issues simultaneously
- Each issue can only be claimed by one community at a time (unique constraint)
- Claiming can be reactivated if previously cancelled
- Issues track who claimed them and when

### Discussion System
- Members-only (non-members cannot see messages)
- Messages are immutable after creation (no delete, for audit trail)
- Ordered by creation date (newest first)
- Paginated for performance

---

## 🔄 Workflow Examples

### Example 1: New Community Approval Flow
1. User sends join request via `POST /api/community/join-request`
2. Moderator/owner receives request
3. Moderator calls `PATCH /api/community/join-request/:id` with `action: "approve"`
4. System creates `CommunityMember` with role "member"
5. Member count increments

### Example 2: Claiming & Completing an Issue
1. Issue is reported by resident
2. Moderator claims it via `POST /api/community/:id/claim-issue`
3. Issue moves to community's active issues list
4. Community works on cleanup
5. Moderator calls `PATCH /api/community/:id/issues/:issueId` to mark completed
6. Issue moves to completed list, `completedAt` timestamp recorded

### Example 3: Moderator Promotion with Constraints
1. Community grows to 4 members
2. Owner wants to promote 3rd member to moderator
3. Owner calls `POST /api/community/:id/moderators` with userId
4. System checks: 2 moderators exist, can add 1 more (< 5) ✅
5. User promoted successfully
6. Owner tries to promote another user (would be 4 moderators)
7. System checks: 4 < 5 ✅ - promotion succeeds
8. Owner tries to promote 5th member
9. System checks: 5 = MAX (5) ❌ - fails with 409 Conflict

---

## 📝 Type Definitions

All TypeScript types are defined in `types/community.ts`:

```typescript
// Status types
export type ClaimedIssueStatus = 'active' | 'completed' | 'cancelled';

// Moderator constraints
export const MODERATOR_CONSTRAINTS = {
  MIN: 2,
  MAX: 5,
} as const;

// Request/Response types
export interface ClaimIssueBody { issueId: string; }
export interface PostDiscussionBody { message: string; }
export interface RespondToJoinRequestBody { action: 'approve' | 'reject'; }
export interface AddModeratorBody { userId: string; }
export interface CommunityDiscussionMessage { /* ... */ }
export interface CommunityClaimedIssue { /* ... */ }
```

---

## 🚀 Integration with UI Pages

The backend is designed to support these existing UI pages:

### `/volunteer/my-communities/[slug]/requests`
- Shows pending join requests
- **Uses:** `PATCH /api/community/join-request/:id` to approve/reject

### `/volunteer/my-communities/[slug]/overview`
- Shows community details and member count
- **Uses:** `GET /api/community/:id` for details
- **Uses:** `POST /api/community/:id/leave` for leaving

### `/volunteer/my-communities/[slug]/issues`
- **Active Issues Tab:** `GET /api/community/:id/issues?status=active`
- **Completed Issues Tab:** `GET /api/community/:id/issues?status=completed`
- **Uses:** `POST /api/community/:id/claim-issue` to claim new issues
- **Uses:** `PATCH /api/community/:id/issues/:issueId` to mark complete
- **Uses:** `DELETE /api/community/:id/claim-issue/:issueId` to unclaim

### `/volunteer/my-communities/[slug]/discussions`
- **Uses:** `GET /api/community/:id/discussions` for messages
- **Uses:** `POST /api/community/:id/discussions` to post new messages
- Note: UI not yet created; these endpoints are ready for implementation

---

## 🔄 Migration Info

Database migration applied:
```
prisma/migrations/20260107065758_add/migration.sql
```

Migration includes:
- `community_discussions` table
- `community_claimed_issues` table
- Proper indexes and relationships
- Unique constraints on composite keys

---

## ✅ Testing Checklist

- [ ] Create community with 1 member (owner)
- [ ] Owner tries to add 1st moderator (should fail - needs 2)
- [ ] Add 2nd member and promote to moderator
- [ ] Promote 3rd member to moderator (should succeed)
- [ ] Promote members until 5 moderators (should fail on 6th)
- [ ] Demote moderator back to member (should succeed)
- [ ] Demote until 2 moderators remain (should fail on next demotion)
- [ ] Claim an issue as moderator
- [ ] Complete the issue (should move to completed)
- [ ] Post discussion message as member
- [ ] Non-member cannot access discussion
- [ ] Owner cannot leave community
- [ ] Member can leave community

---

## 📚 Related Documentation

- [Copilot Instructions](../.github/copilot-instructions.md)
- [Authentication Setup](../.github/AUTH_SETUP.md)
- [Project Overview](../PROJECT.md)

