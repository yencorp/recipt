import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable } from "@nestjs/common";

/**
 * 실시간 알림을 위한 WebSocket Gateway
 *
 * 향후 확장 계획:
 * - 사용자별 소켓 연결 관리
 * - 실시간 알림 푸시
 * - 읽음 상태 실시간 동기화
 * - 타이핑 인디케이터 등
 */
@Injectable()
@WebSocketGateway({
  namespace: "/notifications",
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // TODO: JWT 토큰 검증 후 userId 추출
    // const userId = this.extractUserIdFromToken(client.handshake.auth.token);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // TODO: 연결 해제된 소켓 정리
  }

  @SubscribeMessage("subscribe")
  handleSubscribe(client: Socket, userId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(client.id);
    console.log(`User ${userId} subscribed with socket ${client.id}`);
  }

  @SubscribeMessage("unsubscribe")
  handleUnsubscribe(client: Socket, userId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    console.log(`User ${userId} unsubscribed socket ${client.id}`);
  }

  /**
   * 특정 사용자에게 알림 전송
   * @param userId 사용자 ID
   * @param notification 알림 데이터
   */
  sendNotificationToUser(userId: string, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit("notification", notification);
      });
      console.log(
        `Sent notification to user ${userId} (${sockets.size} sockets)`
      );
    }
  }

  /**
   * 모든 연결된 클라이언트에게 브로드캐스트
   * @param notification 알림 데이터
   */
  broadcastNotification(notification: any) {
    this.server.emit("notification", notification);
    console.log(`Broadcast notification to all clients`);
  }
}
