/* eslint-disable no-restricted-globals */

import models from "@assets/models";
import { skyboxes } from "@assets/textures/skybox";

const CACHE_NAME = "game-assets-v1";
const ASSETS_TO_CACHE = [
  ...Object.values(models),
  ...Object.values(skyboxes).flatMap(Object.values),
  "https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
