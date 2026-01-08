-- CreateTable
CREATE TABLE "community_discussions" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_discussions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_claimed_issues" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "claimedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "community_claimed_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_discussions_communityId_idx" ON "community_discussions"("communityId");

-- CreateIndex
CREATE INDEX "community_discussions_userId_idx" ON "community_discussions"("userId");

-- CreateIndex
CREATE INDEX "community_discussions_createdAt_idx" ON "community_discussions"("createdAt");

-- CreateIndex
CREATE INDEX "community_claimed_issues_communityId_idx" ON "community_claimed_issues"("communityId");

-- CreateIndex
CREATE INDEX "community_claimed_issues_issueId_idx" ON "community_claimed_issues"("issueId");

-- CreateIndex
CREATE INDEX "community_claimed_issues_status_idx" ON "community_claimed_issues"("status");

-- CreateIndex
CREATE UNIQUE INDEX "community_claimed_issues_communityId_issueId_key" ON "community_claimed_issues"("communityId", "issueId");

-- AddForeignKey
ALTER TABLE "community_discussions" ADD CONSTRAINT "community_discussions_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_discussions" ADD CONSTRAINT "community_discussions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_claimed_issues" ADD CONSTRAINT "community_claimed_issues_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_claimed_issues" ADD CONSTRAINT "community_claimed_issues_claimedBy_fkey" FOREIGN KEY ("claimedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
