import { Injectable } from '@nestjs/common';

@Injectable()
export class TradesService {
    create() {
        return 'This action adds a new trade';
    }

    findAll() {
        return `This action returns all trades`;
    }

    findOne(id: number) {
        return `This action returns a #${id} trade`;
    }

    update(id: number) {
        return `This action updates a #${id} trade`;
    }

    remove(id: number) {
        return `This action removes a #${id} trade`;
    }
}
