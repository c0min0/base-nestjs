export const ENVIRONMENTS = {
  DEV: 'dev',
  PROD: 'prod',
} as const;

export type Environment = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];
