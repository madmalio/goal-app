"use client";

import { useRef, useEffect, useState } from "react";

export default function IconGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(512);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw Background (Indigo 600)
    ctx.fillStyle = "#4f46e5";
    ctx.fillRect(0, 0, size, size);

    // 2. Prepare the Exact SVG from your Loading Screen
    // We wrap it in a standard XML structure for the browser to parse it as an image.
    // Note: We use stroke-width="1.5" so it looks crisp at large sizes (2 is often too thick when scaled up)
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    `;

    // 3. Convert SVG string to a Blob URL
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // 4. Load and Draw Image
    const img = new Image();
    img.onload = () => {
      // Calculate scaling to keep some padding (60% of total size)
      const iconSize = size * 0.6;
      const offset = (size - iconSize) / 2;

      ctx.drawImage(img, offset, offset, iconSize, iconSize);
      URL.revokeObjectURL(url); // Cleanup
    };
    img.src = url;
  }, [size]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `icon-${size}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold text-slate-800">PWA Icon Generator</h1>

      <div className="flex gap-4">
        <button
          onClick={() => setSize(192)}
          className={`px-4 py-2 rounded font-bold ${
            size === 192
              ? "bg-indigo-600 text-white"
              : "bg-white text-indigo-600"
          }`}
        >
          1. Preview 192px
        </button>
        <button
          onClick={() => setSize(512)}
          className={`px-4 py-2 rounded font-bold ${
            size === 512
              ? "bg-indigo-600 text-white"
              : "bg-white text-indigo-600"
          }`}
        >
          2. Preview 512px
        </button>
      </div>

      {/* Preview Container */}
      <div className="border-4 border-white shadow-xl rounded-3xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="block"
          style={{ width: "300px", height: "300px" }}
        />
      </div>

      <button
        onClick={download}
        className="px-8 py-4 bg-emerald-600 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-emerald-700 transition-transform hover:scale-105"
      >
        Download icon-{size}.png
      </button>

      <p className="text-slate-500 max-w-md text-center">
        <strong>Instructions:</strong>
        <br />
        1. Select "Preview 192px" &rarr; Download &rarr; Save to{" "}
        <code>frontend/public/icon-192.png</code>
        <br />
        2. Select "Preview 512px" &rarr; Download &rarr; Save to{" "}
        <code>frontend/public/icon-512.png</code>
        <br />
        <br />
        (You must overwrite the previous files)
      </p>
    </div>
  );
}
