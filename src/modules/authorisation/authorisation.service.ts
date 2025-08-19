import { ForbiddenException, Injectable } from '@nestjs/common';
import { ACTIONS } from './types/actions.type';
import type { AuthUser } from '@modules/authentication/types/auth-user.type';
import { ROLES } from './types/roles.type';
import type {
  RolesWithPermissions,
  Permissions,
} from './types/permissions.type';
import { RequestContextService } from '@modules/request-context/request-context.service';
import { PERMISSIONS_CHECKED_KEY } from './constants/permissions-checked.const';
import { UsersService } from '@modules/users/users.service';
import type { Todo } from '@modules/todos/entities/todo.entity';

@Injectable()
export class AuthorisationService {
  private readonly ROLE_PERMISSIONS: RolesWithPermissions = {
    [ROLES.ADMIN]: {
      refreshTokens: {
        [ACTIONS.UPDATE_SELF]: true,
        [ACTIONS.UPDATE]: true,
      },
      users: {
        [ACTIONS.READ]: true,
        [ACTIONS.READ_SELF]: true,
        [ACTIONS.CREATE]: true,
        [ACTIONS.UPDATE_SELF]: true,
        [ACTIONS.UPDATE]: (authUser, user) =>
          !user.roles.includes(ROLES.ADMIN) || authUser.id === user.id,
        [ACTIONS.DELETE_SELF]: true,
        [ACTIONS.DELETE]: (authUser, user) =>
          !user.roles.includes(ROLES.ADMIN) || authUser.id === user.id,
      },
      todos: {
        [ACTIONS.READ_SELF]: true,
        [ACTIONS.CREATE_SELF]: true,
        [ACTIONS.UPDATE]: async (authUser, todo) =>
          await this.isNotActingOnAnotherAdmin(authUser, todo),
        [ACTIONS.DELETE]: async (authUser, todo) =>
          await this.isNotActingOnAnotherAdmin(authUser, todo),
      },
    },
    [ROLES.USER]: {
      refreshTokens: {
        [ACTIONS.UPDATE_SELF]: true,
        [ACTIONS.UPDATE]: (authUser, refreshToken) =>
          authUser.id === refreshToken.userId,
      },
      users: {
        [ACTIONS.READ_SELF]: true,
        [ACTIONS.UPDATE_SELF]: true,
        [ACTIONS.UPDATE]: (authUser, user) => authUser.id === user.id,
        [ACTIONS.DELETE_SELF]: true,
        [ACTIONS.DELETE]: (authUser, user) => authUser.id === user.id,
      },
      todos: {
        [ACTIONS.READ_SELF]: true,
        [ACTIONS.CREATE_SELF]: true,
        [ACTIONS.UPDATE]: (authUser, todo) => authUser.id === todo.authorId,
        [ACTIONS.DELETE]: (authUser, todo) => authUser.id === todo.authorId,
      },
    },
  };

  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly userService: UsersService,
  ) {}

  async checkPermission<Resource extends keyof Permissions>(
    action: Permissions[Resource]['action'],
    data?: Permissions[Resource]['dataType'],
  ) {
    const request = this.requestContextService.getRequest<{
      [PERMISSIONS_CHECKED_KEY]: boolean;
      user: AuthUser;
    }>();

    const resource = this.requestContextService.getAuthorisationResourceKey();

    if (!(await this.hasPermission(request.user, resource, action, data))) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }

    request[PERMISSIONS_CHECKED_KEY] = true;
  }

  private async hasPermission<Resource extends keyof Permissions>(
    user: AuthUser,
    resource: Resource,
    action: Permissions[Resource]['action'],
    data?: Permissions[Resource]['dataType'],
  ): Promise<boolean> {
    for (const role of user.roles) {
      const permission = this.ROLE_PERMISSIONS[role][resource]?.[action];
      if (permission == null) continue;

      if (typeof permission === 'boolean') {
        if (permission) return true;
        continue;
      }

      if (data != null && (await permission(user, data))) {
        return true;
      }
    }
    return false;
  }

  private async isNotActingOnAnotherAdmin(
    authUser: AuthUser,
    todo: Pick<Todo, 'authorId'>,
  ) {
    const user = await this.userService.findOneById(todo.authorId);
    return !user.roles.includes(ROLES.ADMIN) || todo.authorId === authUser.id;
  }
}
