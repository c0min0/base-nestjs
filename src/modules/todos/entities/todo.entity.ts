import { UUIDColumn } from '@utils/class-validator.utils';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { User } from '@modules/users/entities/user.entity';

@Entity()
export class Todo {
  @Column(UUIDColumn({ primary: true }))
  id: string;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column(UUIDColumn())
  authorId: string;

  @ManyToOne(() => User, (user) => user.todos, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: false,
  })
  @JoinColumn({ name: 'authorId' })
  user: User;
}
