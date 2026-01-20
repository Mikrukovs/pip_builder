'use client';

import { TextProps } from '@/types';

interface Props {
  config: TextProps;
  preview?: boolean;
}

export function Text({ config }: Props) {
  return (
    <p
      className="text-base text-gray-700 leading-relaxed"
      style={{ textAlign: config.alignment }}
    >
      {config.text}
    </p>
  );
}
