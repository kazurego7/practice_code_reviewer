"use client";

import Image from 'next/image';
import React from 'react';

export type CatInvasionOverlayProps = {
  /** 猫乱入の表示を有効にする */
  active: boolean;
  /** 表示する猫画像のパス */
  imageSrc: string;
  /** 画像の代替テキスト */
  imageAlt?: string;
  /** 画像の上に薄く表示するキャプション */
  caption?: string;
};

const DEFAULT_ALT = '乱入してきた猫の写真';
const DEFAULT_CAPTION = '猫が乱入しています…';

export function CatInvasionOverlay({
  active,
  imageSrc,
  imageAlt = DEFAULT_ALT,
  caption = DEFAULT_CAPTION,
}: CatInvasionOverlayProps) {
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-6 py-10 text-center text-white">
        <p className="text-sm font-medium tracking-wide">{caption}</p>
      </div>
    </div>
  );
}
