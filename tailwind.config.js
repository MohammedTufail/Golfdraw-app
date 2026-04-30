/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#c9a84c",
          light: "#e8c96a",
          dark: "#a07830",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.04)",
          hover: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.10)",
          "border-hover": "rgba(255,255,255,0.25)",
        },
      },
      fontFamily: {
        display: ["var(--font-clash)", "system-ui", "sans-serif"],
        body: ["var(--font-dm)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "shine-gradient":
          "linear-gradient(135deg, #ffffff 0%, #888888 50%, #ffffff 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #c9a84c 0%, #f0d87a 50%, #c9a84c 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
        "hero-radial":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,255,255,0.08) 0%, transparent 70%)",
      },
      animation: {
        shine: "shine 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        shine: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(201,168,76,0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(201,168,76,0.5)" },
        },
      },
    },
  },
  plugins: [],
};
