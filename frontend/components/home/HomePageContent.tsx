"use client";

import { useMemo, useState } from "react";

import BackgroundGlow from "@/components/common/BackgroundGlow";
import Container from "@/components/ui/Container";
import Hero from "@/components/home/Hero";
import Navbar from "@/components/layout/Navbar";
import SearchBar from "@/components/search/SearchBar";
import SongList from "@/components/song/SongList";
import { mockSongs } from "@/lib/mockSongs";

export default function HomePageContent() {
  const [search, setSearch] = useState("");

  const filteredSongs = useMemo(() => {
    const value = search.toLowerCase();

    return mockSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(value) ||
        song.artist.toLowerCase().includes(value) ||
        song.album.toLowerCase().includes(value),
    );
  }, [search]);

  return (
    <>
      <BackgroundGlow />

      <Navbar />

      <main>
        <Container>
          <Hero />

          <section className="pb-32">
            <h2 className="mb-6 text-3xl font-bold">Library</h2>

            <SearchBar value={search} onChange={setSearch} />

            <div className="mt-8">
              <SongList songs={filteredSongs} />
            </div>
          </section>
        </Container>
      </main>
    </>
  );
}
