import { Config } from './config.model';
import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

const baseMemory = 1024;

export const DEFAULT_CONFIG: Config = {
  isNewContentReported: false,

  keybaseConfig: {
    enabled: false,
    username: '',
    paperkey: '',
    channelId: '',
  },
};

export const DEFAULT_JOB_POD_CONFIG: JobPodConfiguration[] = [
  {
    name: 'XS',
    memoryKbytesLimit: baseMemory * 10,
    milliCpuLimit: 10,
  },
  {
    name: 'S',
    memoryKbytesLimit: baseMemory * 50,
    milliCpuLimit: 30,
  },
  {
    name: 'M',
    memoryKbytesLimit: baseMemory * 100,
    milliCpuLimit: 100,
  },
  {
    name: 'L',
    memoryKbytesLimit: baseMemory * 512,
    milliCpuLimit: 250,
  },
  {
    name: 'XL',
    memoryKbytesLimit: baseMemory * 1024,
    milliCpuLimit: 500,
  },
];

export const DEFAULT_JOB_POD_FALLBACK_CONFIG: JobPodConfiguration = {
  name: 'Stalker Default Fallback Job Pod Config',
  memoryKbytesLimit: baseMemory * 100,
  milliCpuLimit: 100,
};
