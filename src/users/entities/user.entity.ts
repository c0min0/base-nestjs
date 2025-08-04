import { bufferToUuid, uuidToBuffer } from '@shared/utils/uuid.utils';
import { Column, Entity, BeforeInsert } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity()
export class User {
  @Column({
    type: 'binary',
    length: 16,
    primary: true,
    transformer: {
      to: (value: string) => uuidToBuffer(value),
      from: (value: Buffer) => bufferToUuid(value),
    },
  })
  id: string;

  @BeforeInsert()
  generateId() {
    this.id = uuidv7();
  }

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'date' })
  birthDate: Date;
}
