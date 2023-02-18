import { Logger } from '@nestjs/common';
import { Kafka, KafkaMessage } from 'kafkajs';

export abstract class KafkaConsumer {
  protected logger: Logger;
  protected abstract get groupId(): string;
  protected abstract get topic(): string;

  protected constructor(private kafka: Kafka) {
    this.logger = new Logger('KafkaConsumer');
  }

  protected async start() {
    const consumer = this.kafka.consumer({ groupId: this.groupId });
    await consumer.connect();
    await consumer.subscribe({
      topic: this.topic,
      fromBeginning: false,
    });

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        this.logger.debug('Kafka message found!');
        try {
          this.consume(message);
        } catch (err) {
          this.logger.error(
            'Error while reading Kafka message : ' +
              err +
              '\nMessage content: ' +
              message.value.toString(),
          );
        }
      },
    });
  }

  protected abstract consume(message: KafkaMessage);
}
