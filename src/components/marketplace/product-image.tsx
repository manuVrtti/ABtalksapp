"use client";

import { useState } from "react";
import Image from "next/image";

const PLACEHOLDER = "/marketplace/placeholder.png";

type Props = {
  src: string | null;
  alt: string;
};

export function ProductImage({ src, alt }: Props) {
  const [imgSrc, setImgSrc] = useState(src ?? PLACEHOLDER);

  return (
    <div className="relative h-[220px] w-full">
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className="object-cover object-center"
        sizes="(max-width: 640px) 100vw, 312px"
        onError={() => setImgSrc(PLACEHOLDER)}
      />
    </div>
  );
}
