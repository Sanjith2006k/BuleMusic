"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import Link from "next/link";

import Container from "../ui/Container";
import Button from "../ui/Button";
import { APP_NAME } from "@/lib/constants";

export default function Navbar() {

  return (
    <>
      <motion.header
        initial={{ y: -25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50"
      >
        <Container>
          <div className="mt-5 flex h-16 items-center justify-between rounded-full border border-white/10 bg-white/5 px-6 backdrop-blur-2xl">
            <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
              <div className="rounded-full bg-[#0A84FF]/20 p-2">
                <Music2 className="text-[#0A84FF]" size={22} />
              </div>

              <h1 className="text-lg font-semibold tracking-tight">{APP_NAME}</h1>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/about">
                <Button variant="secondary">About</Button>
              </Link>
            </div>
          </div>
        </Container>
      </motion.header>
    </>
  );
}
