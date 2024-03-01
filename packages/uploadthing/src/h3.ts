import type { H3Event } from "h3";
import {
  assertMethod,
  defineEventHandler,
  setHeader,
  setResponseStatus,
  toWebRequest,
} from "h3";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./internal/constants";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
  runRequestHandlerAsync,
} from "./internal/handler";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import { initLogger } from "./internal/logger";
import type { FileRouter, RouterWithConfig } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter };
export { UTFiles } from "./internal/types";

type MiddlewareArgs = { req: undefined; res: undefined; event: H3Event };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  initLogger(opts.config?.logLevel);
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    "h3",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return defineEventHandler(async (event) => {
    assertMethod(event, ["GET", "POST"]);
    setHeader(event, "x-uploadthing-version", UPLOADTHING_VERSION);

    // GET
    if (event.method === "GET") {
      return getBuildPerms();
    }

    // POST
    const response = await runRequestHandlerAsync(
      requestHandler,
      {
        req: toWebRequest(event),
        middlewareArgs: { req: undefined, res: undefined, event },
      },
      opts.config,
    );

    if (response instanceof UploadThingError) {
      setResponseStatus(event, getStatusCodeFromError(response));
      return formatError(response, opts.router);
    }

    return response.body ?? "OK";
  });
};

/**
 * @deprecated Use {@link createRouteHandler} instead
 */
export const createH3EventHandler = createRouteHandler;
