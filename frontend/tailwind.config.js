import colors from 'tailwindcss/colors';

// Notus uses these legacy color names removed in Tailwind v3
const legacyColors = {
  blueGray: {
    50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
    400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
    800: '#1E293B', 900: '#0F172A',
  },
  lightBlue: {
    50: '#F0F9FF', 100: '#E0F2FE', 200: '#BAE6FD', 300: '#7DD3FC',
    400: '#38BDF8', 500: '#0EA5E9', 600: '#0284C7', 700: '#0369A1',
    800: '#075985', 900: '#0C4A6E',
  },
  warmGray: colors.stone,   // legacy alias
  trueGray: colors.neutral, // legacy alias
  coolGray: colors.gray,    // legacy alias
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    colors: {
      ...colors,
      ...legacyColors,
    },
    extend: {
      minHeight: { "screen-75": "75vh" },
      zIndex: { 2: "2", 3: "3" },
      inset: {
        "-100": "-100%", "-225-px": "-225px", "-160-px": "-160px",
        "-150-px": "-150px", "-94-px": "-94px", "-50-px": "-50px",
        "-29-px": "-29px", "-20-px": "-20px", "25-px": "25px",
        "40-px": "40px", "95-px": "95px", "145-px": "145px",
        "195-px": "195px", "210-px": "210px", "260-px": "260px",
      },
      height: {
        "95-px": "95px", "70-px": "70px", "350-px": "350px",
        "500-px": "500px", "600-px": "600px",
      },
      maxHeight: { "860-px": "860px" },
      maxWidth: {
        "100-px": "100px", "150-px": "150px", "200-px": "200px",
        "210-px": "210px", "580-px": "580px",
      },
      minWidth: { "140-px": "140px", "48": "12rem" },
      backgroundSize: { full: "100%" },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
