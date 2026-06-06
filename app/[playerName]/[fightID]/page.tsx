import { FightBrowser } from "@/src/components/fight-browser";

type FightPageProps = {
  params: Promise<{
    playerName: string;
    fightID: string;
  }>;
};

export default async function FightPage({ params }: FightPageProps) {
  const resolved = await params;
  return (
    <FightBrowser
      initialFightId={resolved.fightID}
      initialPlayerName={decodeURIComponent(resolved.playerName)}
    />
  );
}
