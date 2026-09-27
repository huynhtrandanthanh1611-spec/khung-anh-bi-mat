import GameEditor from "@/components/teacher/GameEditor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <GameEditor id={(await params).id} />;
}
