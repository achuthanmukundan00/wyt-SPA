import { useEffect, useRef } from "react";

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed z-[10000] pointer-events-none w-6 h-6 border border-[#a42117] rounded-full opacity-30 backdrop-blur-[2px] transition-transform duration-75 ease-out"
      style={{
        transform: "translate(-50%, -50%)",
      }}
    />
  );
};

export default CustomCursor;
