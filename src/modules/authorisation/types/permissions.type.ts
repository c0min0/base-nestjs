import type { AuthUser } from '@modules/authentication/types/auth-user.type';
import type { Role } from './roles.type';
import type { Actions } from './actions.type';
import type { Todo } from '@modules/todos/entities/todo.entity';
import type { User } from '@modules/users/entities/user.entity';
import type { RefreshToken } from '@modules/refresh-token/entities/refresh-token.entity';

export type Permissions = {
  refreshTokens: {
    dataType: Pick<RefreshToken, 'userId'>;
    action: Actions<'UPDATE' | 'UPDATE_SELF'>;
  };
  users: {
    dataType: Pick<User, 'id' | 'roles'>;
    action: Actions<
      | 'READ'
      | 'READ_SELF'
      | 'CREATE'
      | 'UPDATE_SELF'
      | 'UPDATE'
      | 'DELETE_SELF'
      | 'DELETE'
    >;
  };
  todos: {
    dataType: Pick<Todo, 'authorId'>;
    action: Actions<'READ_SELF' | 'CREATE_SELF' | 'UPDATE' | 'DELETE'>;
  };
};

export type BooleanPermissionCheck = boolean;

export type FunctionPermissionCheck<Key extends keyof Permissions> = (
  user: AuthUser,
  data: Permissions[Key]['dataType'],
) => boolean;

export type AsyncFunctionPermissionCheck<Key extends keyof Permissions> = (
  user: AuthUser,
  data: Permissions[Key]['dataType'],
) => Promise<boolean>;

export type PermissionCheck<Key extends keyof Permissions> =
  | BooleanPermissionCheck
  | FunctionPermissionCheck<Key>
  | AsyncFunctionPermissionCheck<Key>;

export type PermissionMap<Key extends keyof Permissions> = {
  [Action in Permissions[Key]['action']]: PermissionCheck<Key>;
};

export type RolesWithPermissions = {
  [R in Role]: Partial<{
    [Key in keyof Permissions]: Partial<PermissionMap<Key>>;
  }>;
};
