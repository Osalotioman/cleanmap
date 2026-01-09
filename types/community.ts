/**
 * Community Types
 * 
 * Type definitions for community-related data structures
 * 
 * @module types/community
 */

/**
 * Community coverage types
 */
export type CoveragType = 'neighborhood' | 'district' | 'city';

/**
 * Community member roles
 */
export type CommunityMemberRole = 'owner' | 'moderator' | 'member';

/**
 * Community status
 */
export type CommunityStatus = 'active' | 'inactive' | 'archived';

/**
 * Join request status
 */
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Claimed issue status
 */
export type ClaimedIssueStatus = 'active' | 'completed' | 'cancelled';

/**
 * Discussion message
 */
export interface CommunityDiscussionMessage {
  id: string;
  communityId: string;
  userId: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

/**
 * Community claimed issue (waste report)
 */
export interface CommunityClaimedIssue {
  id: string;
  communityId: string;
  issueId: string;
  claimedBy: string;
  status: ClaimedIssueStatus;
  claimedAt: Date;
  completedAt?: Date;
  claimedByUser?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

/**
 * Request body for creating a community
 */
export interface CreateCommunityRequest {
  name: string;
  description?: string;
  location: string;
  coverageType?: CoveragType;
  guidelines?: string;
  imageUrl?: string;
}

/**
 * Community data with member info
 */
export interface CommunityWithMembers {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  location: string;
  coverageType: CoveragType;
  guidelines?: string;
  imageUrl?: string;
  status: CommunityStatus;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  members?: CommunityMember[];
}

/**
 * Community member data
 */
export interface CommunityMember {
  id: string;
  userId: string;
  communityId: string;
  role: CommunityMemberRole;
  joinedAt: Date;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

/**
 * Community join request data
 */
export interface CommunityJoinRequest {
  id: string;
  userId: string;
  communityId: string;
  status: JoinRequestStatus;
  message?: string;
  requestedAt: Date;
  respondedAt?: Date;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

/**
 * Response for community creation
 */
export interface CreateCommunityResponse {
  community: CommunityWithMembers;
  membership: CommunityMember;
}

/**
 * Community with user's membership status
 */
export interface CommunityWithStatus extends CommunityWithMembers {
  userMembership?: CommunityMember | null;
  userJoinRequest?: CommunityJoinRequest | null;
  isMember: boolean;
  hasJoinRequest: boolean;
  joinRequestStatus?: JoinRequestStatus;
}

/**
 * Request body for joining a community
 */
export interface JoinCommunityRequest {
  communityId: string;
  message?: string;
}

/**
 * Response for join request
 */
export interface JoinRequestResponse {
  joinRequest: CommunityJoinRequest;
}

/**
 * Moderator constraints
 */
export const MODERATOR_CONSTRAINTS = {
  MIN: 2,
  MAX: 5,
} as const;

/**
 * Request body for responding to join requests
 */
export interface RespondToJoinRequestBody {
  action: 'approve' | 'reject';
}

/**
 * Request body for adding/removing moderators
 */
export interface AddModeratorBody {
  userId: string;
}

/**
 * Request body for claiming an issue
 */
export interface ClaimIssueBody {
  issueId: string;
}

/**
 * Request body for posting a discussion
 */
export interface PostDiscussionBody {
  message: string;
}

