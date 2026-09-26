import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WSGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WSGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private paymentRoom(paymentId: string) {
    return `payment:${paymentId}`;
  }

  @SubscribeMessage('subscribe:transfer')
  subscribeTransfer(
    @ConnectedSocket() client: Socket,
    @MessageBody() paymentId: string,
  ) {
    if (!paymentId || typeof paymentId !== 'string') {
      return { event: 'error', data: { message: 'paymentId is required' } };
    }

    const room = this.paymentRoom(paymentId);
    void client.join(room);

    return { event: 'subscribe', data: { paymentId } };
  }

  // @SubscribeMessage('block')
  // handleNewBlock(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() block: string,
  // ) {
  //   return { event: 'block', data: { block } };
  // }

  emitTransfer(paymentId: string, data: unknown) {
    this.server.to(this.paymentRoom(paymentId)).emit('event:transfer', data);
  }

  // emitNewBlock(block: string) {
  //   this.server.emit('block', { block });
  // }
}
