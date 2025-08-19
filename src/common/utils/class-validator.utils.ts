import { bufferToUuid, uuidToBuffer } from './uuid.utils';

export const UUIDColumn = ({ primary = false }: { primary?: boolean } = {}) =>
  ({
    type: 'binary',
    length: 16,
    primary,
    transformer: {
      to: (value: string) => uuidToBuffer(value),
      from: (value: Buffer) => bufferToUuid(value),
    },
  }) as const;
