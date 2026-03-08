"use client";

interface ViewerCountProps {
  count: number;
}

export default function ViewerCount({ count }: ViewerCountProps) {
  return (
    <div className="viewer-count">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="viewer-icon"
      >
        <path
          d="M8 3C4.5 3 1.5 5.5 0.5 8C1.5 10.5 4.5 13 8 13C11.5 13 14.5 10.5 15.5 8C14.5 5.5 11.5 3 8 3Z"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
      <span className="viewer-number">
        {count.toLocaleString()}
      </span>
      <span className="viewer-label">watching</span>
    </div>
  );
}
