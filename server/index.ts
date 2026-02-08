import { createApp } from "./app";

createApp().catch((err) => {
  console.error(err);
  process.exit(1);
});
