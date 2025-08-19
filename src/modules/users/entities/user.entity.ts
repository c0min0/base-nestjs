import type { Role } from '@modules/authorisation/types/roles.type';
import { Column, Entity, BeforeInsert, OneToMany } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { UUIDColumn } from '@utils/class-validator.utils';
import { Todo } from '@modules/todos/entities/todo.entity';
import { RefreshToken } from '@modules/refresh-token/entities/refresh-token.entity';

@Entity()
export class User {
  @Column(UUIDColumn({ primary: true }))
  id: string;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({ type: 'simple-array' })
  roles: Role[];

  @OneToMany(() => Todo, (todo) => todo.user, { cascade: true })
  todos?: Todo[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: true,
  })
  refreshTokens?: RefreshToken[];
}
