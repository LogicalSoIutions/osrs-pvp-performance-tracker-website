import { FightBrowser } from "@/src/components/fight-browser";

type CatchAllPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const resolved = await params;
  const [playerName, fightID] = resolved.slug ?? [];

  return (
    <FightBrowser
      initialFightId={fightID ?? null}
      initialPlayerName={playerName ? decodeURIComponent(playerName) : null}
    />
  );
}
