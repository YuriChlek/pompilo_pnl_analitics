import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from '@/module-user/entities/user.entity';

@Entity('tokens')
@Unique(['refreshToken'])
export class Token {
    @PrimaryGeneratedColumn('uuid', { name: 'token_id' })
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, user => user.tokens, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'text',
        name: 'refresh_token',
        unique: true,
    })
    refreshToken: string;

    @Column({
        type: 'varchar',
        length: 45,
        name: 'ip_address',
        nullable: true,
    })
    ipAddress: string;

    @Column({
        type: 'text',
        name: 'user_agent',
        nullable: true,
    })
    userAgent: string;

    @Column({
        type: 'timestamp',
        name: 'expires_at',
    })
    expiresAt: Date;

    @Column({
        type: 'boolean',
        name: 'is_active',
        default: true,
    })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    invalidate(): void {
        this.isActive = false;
    }
}
