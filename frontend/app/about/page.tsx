"use client";

import { motion } from "framer-motion";
import { Music2, Users, Share2, Heart, Sparkles, Globe, Code } from "lucide-react";
import Link from "next/link";

import BackgroundGlow from "@/components/common/BackgroundGlow";
import Navbar from "@/components/layout/Navbar";
import Container from "@/components/ui/Container";
import GlassCard from "@/components/ui/GlassCard";

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const features = [
  {
    icon: <Music2 className="text-[#0A84FF]" size={24} />,
    title: "High-Fidelity Audio",
    description: "Enjoy crystal clear audio streaming that loads instantly and keeps the music pumping.",
  },
  {
    icon: <Users className="text-[#30B0C7]" size={24} />,
    title: "Perfect Synchronization",
    description: "Our sync engine guarantees sub-millisecond precision so everyone in the party hears the exact same beat.",
  },
  {
    icon: <Share2 className="text-[#BF5AF2]" size={24} />,
    title: "Seamless Sharing",
    description: "Create parties, share simple codes, and let your friends join instantly with zero setup or logins required.",
  },
];

export default function AboutPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <BackgroundGlow />
      <Navbar />

      <main className="pt-10 pb-20 min-h-[calc(100vh-80px)] flex flex-col justify-between">
        <Container>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto space-y-12"
          >
            {/* Header section */}
            <motion.div variants={itemVariants} className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/20 text-xs font-semibold text-[#0A84FF] mb-2">
                <Sparkles size={12} className="animate-pulse" />
                About BuleMusic
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                Collaborative Music.
                <br />
                Perfect Sync.
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                BuleMusic is a modern social listening platform that connects people through a shared real-time queue.
              </p>
            </motion.div>

            {/* Content card */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-8 md:p-10 space-y-6">
                <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                <p className="text-zinc-300 leading-relaxed">
                  We believe that listening to music is an inherently social experience. Whether you're hosting a party,
                  studying with friends, or just hanging out online, BuleMusic breaks down physical distances by enabling 
                  real-time co-listening. Everyone gets to be the DJ: queue up tracks, vote on the next song, and enjoy 
                  perfectly synced audio.
                </p>
                <div className="h-px bg-white/10 my-6" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {features.map((feature, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-white">{feature.title}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Open Source / Tech section */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Code size={20} className="text-[#0A84FF]" />
                    Built with Modern Tech Stack
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-xl">
                    BuleMusic uses Next.js, Framer Motion, Node.js, and Socket.IO for robust real-time connection and high-performance playback sync.
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </Container>

        {/* Footer section */}
        <footer className="mt-20 border-t border-white/5 pt-10">
          <Container>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-xs">
              <div className="flex items-center gap-2">
                <Music2 size={16} className="text-[#0A84FF]" />
                <span className="font-semibold text-zinc-300">BuleMusic</span>
                <span>© {new Date().getFullYear()} All rights reserved.</span>
              </div>
              <div className="flex items-center gap-6">
                <a 
                  href="https://github.com/Sanjith2006k"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition duration-200"
                >
                  <GithubIcon size={14} />
                  <span>Sanjith2006k</span>
                </a>
                <span className="text-white/10">|</span>
                <span className="flex items-center gap-1">
                  Made with <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" /> for the community
                </span>
              </div>
            </div>
          </Container>
        </footer>
      </main>
    </>
  );
}
