'use client';

import { HeadingProps } from '@/types';

interface Props {
  config: HeadingProps;
  preview?: boolean;
}

export function Heading({ config }: Props) {
  return (
    <h1
      className="text-2xl font-semibold text-gray-900"
      style={{ textAlign: config.alignment }}
    >
      {config.text}
    </h1>
  );
}
