"use client";

import { motion } from "framer-motion";

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] max-w-[92vw] max-h-[85vh] overflow-y-auto panel-scroll bg-ink-800 border border-ink-600 rounded-2xl shadow-bubble"
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-ink-600 sticky top-0 bg-ink-800">
          <h2 className="font-display text-lg text-bone">{title}</h2>
          <button
            onClick={onClose}
            className="text-bone/50 hover:text-bone text-lg leading-none"
          >
            ×
          </button>
        </header>
        <div className="p-5">{children}</div>
      </motion.div>
    </div>
  );
}
