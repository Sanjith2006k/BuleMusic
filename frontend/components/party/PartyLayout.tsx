"use client";

import { useState } from "react";
import BackgroundGlow from "../common/BackgroundGlow";
import Container from "../ui/Container";
import PartyHeader from "./PartyHeader";
import NowPlaying from "./NowPlaying";
import MemberList from "./MemberList";
import SearchSongs from "./SearchSongs";
import PlaylistSection from "../playlist/PlaylistSection";
import FloatingPlayer from "../player/FloatingPlayer";
import PlaylistUpNext from "./PlaylistUpNext";
import { useRoomStore } from "@/store/roomStore";
import AllSongsModal from "../modal/AllSongsModal";
import NewlyAddedSongs from "../home/NewlyAddedSongs";
import { ListMusic } from "lucide-react";

export default function PartyLayout() {
  const activePlaylistId = useRoomStore((state) => state.activePlaylistId);
  const playlistQueue = useRoomStore((state) => state.playlistQueue);
  const [showAllSongs, setShowAllSongs] = useState(false);

  const showUpNext = playlistQueue.length > 0;

  return (
    <>
      <BackgroundGlow />
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#0A84FF]/10 blur-[180px]" />

      <main className="min-h-screen pb-32 md:pb-56">
        <Container>
          <PartyHeader />

          <div className="mt-6 md:mt-10 grid gap-8 lg:grid-cols-[1.4fr_420px]">
            {/* Left Column (Desktop) / Main Column (Mobile) */}
            <div className="flex flex-col gap-6 md:gap-8 min-w-0">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
                <NowPlaying />
              </div>

              {/* Mobile-only Up Next (Shown directly after Now Playing) */}
              <div className="block lg:hidden">
                {showUpNext && <PlaylistUpNext />}
              </div>

              {/* Mobile-only Show All Songs Button */}
              <div className="lg:hidden flex justify-center">
                <button
                  onClick={() => setShowAllSongs(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 p-4 text-sm font-medium text-white hover:bg-white/20 transition shadow-lg"
                >
                  <ListMusic size={20} />
                  Show All Songs
                </button>
              </div>

              <PlaylistSection />

              <NewlyAddedSongs />
            </div>

            {/* Right Column (Desktop) */}
            <div className="flex flex-col gap-6 md:gap-8 min-w-0">
              <MemberList />

              {/* Desktop-only Up Next */}
              <div className="hidden lg:block">
                {showUpNext && <PlaylistUpNext />}
              </div>
              
              <SearchSongs />
            </div>
          </div>
        </Container>
      </main>
      <FloatingPlayer />
      <AllSongsModal open={showAllSongs} onClose={() => setShowAllSongs(false)} />
    </>
  );
}
