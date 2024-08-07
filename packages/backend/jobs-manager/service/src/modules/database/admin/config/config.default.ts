import { JobPodConfiguration } from './job-pod-config/job-pod-config.model';

const baseMemory = 1024;

export const DEFAULT_JOB_POD_CONFIG: JobPodConfiguration[] = [
  {
    name: 'XS',
    memoryKbytesLimit: baseMemory * 50,
    milliCpuLimit: 50,
  },
  {
    name: 'S',
    memoryKbytesLimit: baseMemory * 75,
    milliCpuLimit: 75,
  },
  {
    name: 'M',
    memoryKbytesLimit: baseMemory * 150,
    milliCpuLimit: 150,
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
  {
    name: 'XXL',
    memoryKbytesLimit: baseMemory * 2048,
    milliCpuLimit: 1000,
  },
];

export const DEFAULT_JOB_POD_CONFIG_NAMES = DEFAULT_JOB_POD_CONFIG.map(
  (j) => j.name,
);

export const DEFAULT_JOB_POD_FALLBACK_CONFIG: JobPodConfiguration = {
  name: 'Stalker Default Fallback Job Pod Config',
  memoryKbytesLimit: baseMemory * 100,
  milliCpuLimit: 100,
};
