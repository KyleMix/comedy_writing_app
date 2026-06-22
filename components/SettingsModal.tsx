"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "./Modal";
import { ActionButton } from "./ui";

// AI assist is optional. The key lives only in local IndexedDB. If empty,
// AI buttons stay hidden and the offline flow is unaffected.

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [key, setKey] = useState(settings.anthropicKey);
  const [model, setModel] = useState(settings.anthropicModel);
  const [googleClientId, setGoogleClientId] = useState(
    settings.googleClientId,
  );

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="font-display text-lg text-bone">AI assist</p>
          <p className="text-sm text-bone/60 mt-1">
            Optional. The whole app works offline with no key. Paste an
            Anthropic API key to turn on the AI suggest buttons. The key is
            stored only on this device.
          </p>
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest text-hazard">
            ANTHROPIC API KEY
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full mt-1 bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest text-hazard">
            MODEL
          </label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="claude-opus-4-8"
            className="w-full mt-1 bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none font-mono text-sm"
          />
        </div>

        <div className="border-t border-ink-600 pt-4">
          <p className="font-display text-lg text-bone">Google Docs</p>
          <p className="text-sm text-bone/60 mt-1">
            Optional. Paste a Google OAuth client ID to turn on Save to Google
            Docs in the Export menu. Saving runs entirely in your browser and
            only requests the drive.file scope, so the app can touch just the
            docs it creates.
          </p>
        </div>

        <div>
          <label className="text-[10px] font-mono tracking-widest text-hazard">
            GOOGLE OAUTH CLIENT ID
          </label>
          <input
            value={googleClientId}
            onChange={(e) => setGoogleClientId(e.target.value)}
            placeholder="1234567890-abc.apps.googleusercontent.com"
            className="w-full mt-1 bg-ink-900 border border-ink-600 rounded-lg px-3 py-2 text-bone placeholder:text-bone/30 focus:border-hazard focus:outline-none font-mono text-sm"
          />
          <p className="mt-2 text-[11px] text-bone/40 leading-relaxed">
            In Google Cloud Console: create an OAuth 2.0 Web client, enable the
            Google Drive API, and add this app origin (for local use,
            http://localhost:3000) to the authorized JavaScript origins.
          </p>
        </div>

        <div className="flex gap-2">
          <ActionButton
            onClick={async () => {
              await updateSettings({
                anthropicKey: key.trim(),
                anthropicModel: model.trim() || "claude-opus-4-8",
                googleClientId: googleClientId.trim(),
              });
              onClose();
            }}
            variant="accent"
          >
            Save
          </ActionButton>
          <ActionButton onClick={onClose}>Cancel</ActionButton>
        </div>

        <p className="text-[11px] text-bone/40">
          Calls run client side straight to the Anthropic API. All generated
          text is held to the same rules: punk register, no em dashes.
        </p>
      </div>
    </Modal>
  );
}
