"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import Button from "../ui/Button";
import { APP_NAME } from "@/lib/constants";
import CreatePartyModal from "@/components/modal/CreatePartyModal";
import JoinPartyModal from "@/components/modal/JoinPartyModal";

export default function Hero() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <>
      <section className="py-28 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5 text-sm uppercase tracking-[0.4em] text-zinc-500"
        >
          Premium Music Party
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-5xl text-6xl font-bold md:text-8xl"
        >
          Listen together with
          <br />
          <span className="text-[#0A84FF]">{APP_NAME}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-8 max-w-2xl text-lg text-zinc-400"
        >
          Create a private room, invite friends, and enjoy perfectly
          synchronized music playback.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-10 flex justify-center gap-4"
        >
          <Button onClick={() => setCreateOpen(true)}>Create Party</Button>

          <Button variant="secondary" onClick={() => setJoinOpen(true)}>
            Join Party
          </Button>
        </motion.div>
      </section>

      <CreatePartyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <JoinPartyModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}
