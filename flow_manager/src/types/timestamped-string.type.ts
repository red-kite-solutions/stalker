export type JobLogLevel = 'debug' | 'info' | 'warning' | 'error';

export interface TimestampedString {
  timestamp: number;
  level: JobLogLevel;
  value: string;
}
