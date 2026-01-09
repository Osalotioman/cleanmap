import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CommunityIndex({ params }: Props) {
  const { slug } = await params
  redirect(`/volunteer/my-communities/${slug}/discussions`)
}
