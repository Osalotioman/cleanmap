import Link from "next/link"
import { notFound } from "next/navigation"
import { communities } from "@/lib/mock-communities"
import { mockUser } from "@/lib/mock-user"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function CommunityLayout({ children, params }: Props) {
  const { slug } = await params
  const community = communities.find((c) => c.slug === slug)

  if (!community) notFound()
  if (!mockUser.joinedCommunities.includes(slug)) notFound()

  const isModerator =
    mockUser.moderatedCommunities.includes(slug)

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{community.name}</h1>
        <p className="text-sm text-muted-foreground">
          {community.location}
        </p>
      </div>

      <Tabs>
        <TabsList>
          <TabsTrigger asChild value="discussion">
            <Link href={`/volunteer/my-communities/${slug}/discussions`}>
              Discussion
            </Link>
          </TabsTrigger>

          <TabsTrigger asChild value="issues">
            <Link href={`/volunteer/my-communities/${slug}/issues`}>
              Issues
            </Link>
          </TabsTrigger>

          {isModerator && (
            <TabsTrigger asChild value="requests">
              <Link href={`/volunteer/my-communities/${slug}/requests`}>
                Requests
              </Link>
            </TabsTrigger>
          )}

          <TabsTrigger asChild value="overview">
            <Link href={`/volunteer/my-communities/${slug}/overview`}>
              Overview
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </main>
  )
}
