"use client";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

type Props = {
  onSave: (dataUrl: string) => void;
  existing?: string | null;
};

export function SignaturePad({ onSave, existing }: Props) {
  const padRef = useRef<SignatureCanvas>(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(existing ?? null);

  function handleClear() {
    padRef.current?.clear();
    setSaved(false);
    setPreview(null);
  }

  function handleSave() {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
    setPreview(dataUrl);
    setSaved(true);
    onSave(dataUrl);
  }

  if (preview && saved) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <img src={preview} alt="Signature" className="max-h-24 mx-auto" />
        </div>
        <button
          type="button"
          onClick={() => { setPreview(null); setSaved(false); }}
          className="text-sm text-gray-500 hover:underline"
        >
          Re-sign
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <SignatureCanvas
          ref={padRef}
          penColor="#1e3a5f"
          canvasProps={{
            width: 600,
            height: 160,
            className: "w-full touch-none",
          }}
        />
      </div>
      <p className="text-xs text-gray-400">Draw your signature above</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Apply signature
        </button>
      </div>
    </div>
  );
}
