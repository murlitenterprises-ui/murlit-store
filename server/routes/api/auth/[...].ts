import { auth } from "~/src/server/auth";
import { fromWebHandler } from "h3";

// Mount Better Auth's web fetch handler as a Nitro route
export default fromWebHandler(auth.handler.bind(auth));
