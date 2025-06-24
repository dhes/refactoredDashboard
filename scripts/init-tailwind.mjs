// scripts/init-tailwind.mjs
import { exec } from "child_process";

exec("node ./node_modules/tailwindcss/lib/cli.js init -p", (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Tailwind init failed:", error.message);
    return;
  }
  if (stderr) console.warn("⚠️", stderr);
  console.log(stdout);
});