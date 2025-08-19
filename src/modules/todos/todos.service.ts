import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Todo } from '@modules/todos/entities/todo.entity';
import { Repository } from 'typeorm';
import type { CreateTodoDto } from './dtos/in/create-todo.dto';
import type { UpdateTodoDto } from './dtos/in/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo) private readonly todoRepository: Repository<Todo>,
  ) {}

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    return todo;
  }

  async findAllOfUser(authorId: string): Promise<Todo[]> {
    return this.todoRepository.findBy({ authorId });
  }

  async create(createTodoDto: CreateTodoDto, authorId: string): Promise<Todo> {
    const todo = this.todoRepository.create({
      ...createTodoDto,
      authorId,
    });
    return this.todoRepository.save(todo);
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<void> {
    const result = await this.todoRepository.update(id, updateTodoDto);
    if (result.affected === 0) {
      throw new NotFoundException('Todo not found');
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.todoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Todo not found');
    }
  }
}
