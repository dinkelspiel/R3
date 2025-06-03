// SVG from lucide.dev

export const RadialPinwheel = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-loader-pinwheel size-[100%] rounded-full bg-neutral-800"
      aria-hidden="true"
      // style={{
      //   backgroundImage:
      //     "radial-gradient(circle at center, #3b82f6, #a855f7, #ec4899);",
      // }}
    >
      <defs>
        <radialGradient id="radialFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
      </defs>
      <path
        d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0"
        stroke="url(#radialFill)"
      ></path>
      <path
        d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6"
        stroke="url(#radialFill)"
      ></path>
      <path
        d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6"
        stroke="url(#radialFill)"
      ></path>
      <circle cx="12" cy="12" r="10" stroke="url(#radialFill)"></circle>
    </svg>
  );
};
