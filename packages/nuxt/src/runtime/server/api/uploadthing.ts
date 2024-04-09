// FIXME: How to type useRuntimeConfig's  return type to have our stuff on it?
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useRuntimeConfig } from "#app";
import { uploadRouter } from "#uploadthing-router";
import { defineEventHandler } from "h3";

import { createRouteHandler } from "uploadthing/h3";

export default defineEventHandler((event) => {
  const runtime = useRuntimeConfig() as any;

  return createRouteHandler({
    router: uploadRouter,
    config: {
      ...runtime.uploadthing,
      uploadthingSecret: runtime.uploadthing?.secret,
      uploadthingId: runtime.uploadthing?.appId,
    },
  })(event);
});
