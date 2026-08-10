import type { Config } from "tailwindcss";
const config: Config = {
  // Header의 테마 토글이 html 요소에 추가하는 .dark 클래스를 기준으로 전환합니다.
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./sections/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: []
};
export default config;
