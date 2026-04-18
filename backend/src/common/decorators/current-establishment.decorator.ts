import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentEstablishment = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user?.establishmentId;
  },
);