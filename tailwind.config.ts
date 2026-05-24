import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ba: {
          blue: "#075AAA",
          darkblue: "#003b6f",
          lightblue: "#e8f4fd",
        },
      },
    },
  },
  plugins: [],
};

export default config;
