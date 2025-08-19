import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from '@modules/todos/entities/todo.entity';
import { AuthorisationModule } from '@modules/authorisation/authorisation.module';

@Module({
  imports: [TypeOrmModule.forFeature([Todo]), AuthorisationModule],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
