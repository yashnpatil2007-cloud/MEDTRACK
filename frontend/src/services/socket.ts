import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;

  public connect(token?: string): Socket {
    if (this.socket && this.socket.connected) {
      if (token) {
        this.socket.emit('authenticate', { token });
      }
      return this.socket;
    }

    const host = (import.meta.env.VITE_SOCKET_URL as string) || window.location.origin;
    this.socket = io(host, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      const currentToken = token || localStorage.getItem('medtrack_token');
      if (currentToken) {
        this.socket?.emit('authenticate', { token: currentToken });
      }
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    return this.socket;
  }

  public subscribeJourney(journey_id: string) {
    if (this.socket) {
      this.socket.emit('subscribe_journey', { journey_id });
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export const socketService = new SocketService();
