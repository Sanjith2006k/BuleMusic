"use client";

import BackgroundGlow from "@/components/common/BackgroundGlow";
import Hero from "@/components/home/Hero";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/ui/Container";
export default function HomePage() {

  return (
    <>
      <BackgroundGlow />

      <Navbar />

      <main className="pb-44">
        <Container>
          <Hero />
        </Container>
      </main>
    </>
  );
}
