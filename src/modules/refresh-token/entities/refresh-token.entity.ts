import { User } from '@modules/users/entities/user.entity';
import { UUIDColumn } from '@utils/class-validator.utils';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity()
export class RefreshToken {
  @Column(UUIDColumn({ primary: true }))
  id: string;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }

  @Column(UUIDColumn())
  userId: string;

  @CreateDateColumn({ type: 'timestamp' })
  issuedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
