import NextLink from "next/link";
import type { ComponentProps } from "react";

type SmartLinkProps = ComponentProps<typeof NextLink>;

export default function SmartLink({ prefetch = false, ...props }: SmartLinkProps) {
  return <NextLink prefetch={prefetch} {...props} />;
}
