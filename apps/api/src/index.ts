import { createApp } from "./app.js";
import { loadRootEnv } from "./env.js";

loadRootEnv();
const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Listwright API listening on http://localhost:${port}`);
});
