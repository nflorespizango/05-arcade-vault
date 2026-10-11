import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GamePlayer } from "@/components/game-player";
import { GAMES } from "@/lib/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default function JugarPage(props: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<div className="av-player"></div>}>
      <Player params={props.params} />
    </Suspense>
  );
}

async function Player({ params }: { params: PageProps<"/juegos/[id]/jugar">["params"] }) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  return <GamePlayer gameId={game.id} title={game.title} />;
}
