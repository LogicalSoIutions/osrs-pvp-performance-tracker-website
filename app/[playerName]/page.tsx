import { FightBrowser } from "@/src/components/fight-browser";

type PlayerPageProps = {
  params: Promise<{
    playerName: string;
  }>;
};

export default async function PlayerPage({ params }: PlayerPageProps) {
  const resolved = await params;
  return (
    <FightBrowser
      initialPlayerName={decodeURIComponent(resolved.playerName)}
    />
  );
}
