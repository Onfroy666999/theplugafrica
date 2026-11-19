import "server-only";
import { cache } from "react";
import { db } from "./db";
import { defaultSiteImages, mergeSiteImages, type SiteImages } from "./site-images";
import { isAllowedPhoto } from "./storage";

/**
 * The site's changeable photos (issue #112): the admin's choices over the built-in ones. One query per request. If the
 * database can't be reached the built-in photos are shown, so a page never fails over a photo.
 */
export const getSiteImages = cache(async (): Promise<SiteImages> => {
  try {
    return mergeSiteImages(await db.siteImage.findMany(), isAllowedPhoto);
  } catch (e) {
    console.error("Site photos not loaded", e instanceof Error ? e.message : "");
    return defaultSiteImages();
  }
});
