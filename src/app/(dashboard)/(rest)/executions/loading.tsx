"use client";

export default function Loading() {
  return (
    <div className="sticky top-11 left-0 right-0 z-40">
      <div className="h-0.5 w-full bg-primary/20 overflow-hidden">
        <div
          className="h-full w-1/3 bg-primary"
          style={{
            animation: "loading 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
