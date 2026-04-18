import { Module } from '@nestjs/common';
import { SessionsGateway } from './websocket.gateway';

@Module({
  providers: [SessionsGateway],
  exports: [SessionsGateway],
})
export class WebsocketModule {}