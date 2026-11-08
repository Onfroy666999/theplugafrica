import type { Instrumentation } from "next";

// Next.js calls this for every server error (pages, form actions, routes). It emails the team (issue #8).
// The runtime check is written exactly like this so the build leaves the database code out of the lighter runtime
// that runs the sign-in check (middleware), where it can't run.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportError } = await import("./lib/alerts");
    const work = reportError(err, { path: request.path, method: request.method }, { routePath: context.routePath, routeType: context.routeType, routerKind: context.routerKind });
    // Cloudflare cancels work that's still running once the response has gone, unless it's handed to waitUntil.
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      getCloudflareContext().ctx.waitUntil(work);
    } catch {
      // Not running on Cloudflare (local Node server): awaiting below is enough.
    }
    await work;
  }
};
