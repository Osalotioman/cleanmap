-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "coverageType" TEXT NOT NULL DEFAULT 'neighborhood',
    "guidelines" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "memberCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_join_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "community_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communities_ownerId_idx" ON "communities"("ownerId");

-- CreateIndex
CREATE INDEX "communities_status_idx" ON "communities"("status");

-- CreateIndex
CREATE INDEX "community_members_userId_idx" ON "community_members"("userId");

-- CreateIndex
CREATE INDEX "community_members_communityId_idx" ON "community_members"("communityId");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_userId_communityId_key" ON "community_members"("userId", "communityId");

-- CreateIndex
CREATE INDEX "community_join_requests_userId_idx" ON "community_join_requests"("userId");

-- CreateIndex
CREATE INDEX "community_join_requests_communityId_idx" ON "community_join_requests"("communityId");

-- CreateIndex
CREATE INDEX "community_join_requests_status_idx" ON "community_join_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "community_join_requests_userId_communityId_key" ON "community_join_requests"("userId", "communityId");

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
