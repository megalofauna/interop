// Builds the spike and serves it on port 8137 for looking at by hand:
// node scripts/browser/build.mjs
import { serve } from "./serve.mjs";

const { url } = await serve(8137);
console.log(`Serving the spike at ${url}/`);
