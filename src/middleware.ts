import { defineMiddleware } from "astro:middleware";
import { verifyRequestOrigin } from "oslo/request";

export const onRequest = defineMiddleware(({ request }, next) => {
  /**
   * Allow requests from the same origin
   */
  if (
    new URL(request.url).pathname.startsWith("/api") &&
    import.meta.env.PROD
  ) {
    const originHeader = request.headers.get("Origin");
    const hostHeader = request.headers.get("Host");

    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      return new Response(null, { status: 403 });
    }
  }

  return next();
});
