"use client";

import { useReducedMotion } from "framer-motion";
import { animate } from "framer-motion/dom/mini";
import { useEffect } from "react";

const imageSelector = "img[data-nimg]";

export function ImageLoadingEffects() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const revealImage = (image: HTMLImageElement) => {
      if (image.dataset.smoothLoad === "loaded") return;

      image.dataset.smoothLoad = "loaded";
      image.classList.remove("image-loading");

      if (reducedMotion) {
        image.style.opacity = "1";
        return;
      }

      image.style.willChange = "opacity";
      void animate(
        image,
        { opacity: [0, 1] },
        { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      ).then(() => {
        image.style.removeProperty("opacity");
        image.style.removeProperty("will-change");
      });
    };

    const prepareImage = (image: HTMLImageElement) => {
      if (image.dataset.smoothLoad) return;

      image.dataset.smoothLoad = "pending";
      if (image.complete && image.naturalWidth > 0) {
        revealImage(image);
      } else {
        image.classList.add("image-loading");
      }
    };

    const prepareImages = (root: ParentNode) => {
      root.querySelectorAll<HTMLImageElement>(imageSelector).forEach(prepareImage);
    };

    const handleLoad = (event: Event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || !image.matches(imageSelector)) return;
      revealImage(image);
    };

    document.addEventListener("load", handleLoad, true);
    document.addEventListener("error", handleLoad, true);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(imageSelector)) prepareImage(node as HTMLImageElement);
          prepareImages(node);
        }
      }
    });

    // Defer the initial scan until React has hydrated streamed content.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        prepareImages(document);
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("load", handleLoad, true);
      document.removeEventListener("error", handleLoad, true);
      observer.disconnect();
    };
  }, [reducedMotion]);

  return null;
}
