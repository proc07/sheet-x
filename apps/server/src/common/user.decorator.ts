import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtUser = { sub: string; email: string };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtUser;
  },
);
