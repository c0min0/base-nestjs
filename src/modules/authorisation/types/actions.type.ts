export const ACTIONS = {
  CREATE: 'create',
  CREATE_SELF: 'createSelf',
  READ: 'read',
  READ_SELF: 'readSelf',
  UPDATE: 'update',
  UPDATE_SELF: 'updateSelf',
  DELETE: 'delete',
  DELETE_SELF: 'deleteSelf',
} as const;

export type Actions<T extends keyof typeof ACTIONS = keyof typeof ACTIONS> =
  (typeof ACTIONS)[T];
