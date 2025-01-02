import { CustomTransportStrategy } from '@nestjs/microservices';

export class KeepAliveStrategy implements CustomTransportStrategy {
  private closing = false;

  wait() {
    if (!this.closing) {
      setTimeout(() => this.wait(), 1000);
    }
  }

  listen(callback: () => void) {
    callback();
    this.wait();
  }

  close() {
    this.closing = true;
  }
}
