import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import type { Todo } from '@modules/todos/entities/todo.entity';
import type { AuthUser } from '@modules/authentication/types/auth-user.type';
import { ReqUser } from '@modules/authentication/decorators/req-user.decorator';
import { AuthorisationService } from '@modules/authorisation/authorisation.service';
import { ACTIONS } from '@modules/authorisation/types/actions.type';
import { CreatePermissionGuardInterceptor } from '@modules/authorisation/interceptors/permission-guard.interceptor';
import { CreateTodoDto } from './dtos/in/create-todo.dto';
import { UpdateTodoDto } from './dtos/in/update-todo.dto';
import { AuthorisationResource } from '@modules/authorisation/decorators/authorisation-resource.decorator';

@AuthorisationResource('todos')
@Controller('todos')
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly auth: AuthorisationService,
  ) {}

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.READ_SELF))
  @Get('mine')
  async findMine(@ReqUser() authUser: AuthUser): Promise<Todo[]> {
    return this.todosService.findAllOfUser(authUser.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Todo> {
    const todo = await this.todosService.findOne(id);
    await this.auth.checkPermission(ACTIONS.READ, todo);
    return todo;
  }

  @UseInterceptors(CreatePermissionGuardInterceptor(ACTIONS.CREATE_SELF))
  @Post()
  create(
    @ReqUser() authUser: AuthUser,
    @Body() createTodoDto: CreateTodoDto,
  ): Promise<Todo> {
    return this.todosService.create(createTodoDto, authUser.id);
  }

  @Patch(':id')
  @HttpCode(204)
  async update(
    @ReqUser() authUser: AuthUser,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<void> {
    await this.auth.checkPermission(ACTIONS.UPDATE, {
      authorId: authUser.id,
    });
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @ReqUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<void> {
    await this.auth.checkPermission(ACTIONS.DELETE, {
      authorId: authUser.id,
    });
    return this.todosService.delete(id);
  }
}
