"use client";

import Image from "next/image";
import type { SyntheticEvent } from "react";

const LIGHT_LOGO = "/learntocodelab-logo-light.png";
const DARK_LOGO = "/learntocodelab-logo-dark.png";

function hideFailedLogo(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.visibility = "hidden";
}

export function BrandLogo() {
  return (
    <span className="brand-logo-frame">
      <Image
        src={LIGHT_LOGO}
        alt="LearnToCodeLab logo"
        width={44}
        height={44}
        sizes="(max-width: 639px) 36px, (max-width: 1023px) 40px, 44px"
        className="brand-logo-image brand-logo-light"
        onError={hideFailedLogo}
        priority
      />
      <Image
        src={DARK_LOGO}
        alt="LearnToCodeLab logo"
        width={44}
        height={44}
        sizes="(max-width: 639px) 36px, (max-width: 1023px) 40px, 44px"
        className="brand-logo-image brand-logo-dark"
        onError={hideFailedLogo}
        priority
      />
    </span>
  );
}
