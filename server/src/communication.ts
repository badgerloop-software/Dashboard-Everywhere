import udp from 'dgram';

export default class UdpServer {
    server: udp.Socket;

    constructor(port: number) {
      this.server = this.createUDPSocket(port);
    }

    private createUDPSocket(port: number): udp.Socket {
      const server: udp.Socket = udp.createSocket('udp4');

      server.on('error', (error: Error) => {
        console.log(`[ERROR] ${error.message}`);
        this.server.close();
      });

      server.on('message', (msg, info) => {
        console.log(`[INFO] Data recieved from client ${msg.toString()}`);
        console.log('[INFO] Recieved %d bytes from %s:%d', msg.length, info.address, info.port);
      });

      server.on('close', () => {
        console.log('[INFO] UDP Socket is closed');
      });

      server.bind(port);
      return server;
    }

    public closeServer(): void {
      this.server.close();
    }

    public setOnMessage(onMessage: (msg: Buffer, info: Record<string, unknown>) => void): void {
      this.server.on('message', onMessage);
    }
}
