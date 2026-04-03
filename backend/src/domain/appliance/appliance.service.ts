import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appliance } from './appliance.entity';

@Injectable()
export class ApplianceDomainService {
    constructor(
        @InjectRepository(Appliance)
        private readonly applianceRepository: Repository<Appliance>,
    ) {}

    async 가전_목록을_조회한다(
        householdId: string,
        status?: 'active' | 'retired',
    ): Promise<Appliance[]> {
        const where: any = { householdId };
        if (status) where.status = status;

        return this.applianceRepository.find({
            where,
            order: { createdAt: 'ASC' },
        });
    }

    async 가전을_단건_조회한다(
        id: string,
        householdId: string,
    ): Promise<Appliance | null> {
        return this.applianceRepository.findOne({
            where: { id, householdId },
        });
    }

    async 가전을_생성한다(data: {
        householdId: string;
        roomId?: string | null;
        userId: string;
        name: string;
        brand?: string | null;
        modelName?: string | null;
        serialNumber?: string | null;
        purchasedAt?: string | null;
        purchasePrice?: number | null;
        warrantyExpiresAt?: string | null;
        manualUrl?: string | null;
        memo?: string | null;
    }): Promise<Appliance> {
        const appliance = this.applianceRepository.create({
            ...data,
            status: 'active',
        });
        return this.applianceRepository.save(appliance);
    }

    async 가전을_수정한다(
        id: string,
        householdId: string,
        data: {
            roomId?: string | null;
            name?: string;
            brand?: string | null;
            modelName?: string | null;
            serialNumber?: string | null;
            purchasedAt?: string | null;
            purchasePrice?: number | null;
            warrantyExpiresAt?: string | null;
            manualUrl?: string | null;
            memo?: string | null;
        },
    ): Promise<Appliance | null> {
        const appliance = await this.가전을_단건_조회한다(id, householdId);
        if (!appliance) return null;

        Object.assign(appliance, data);
        return this.applianceRepository.save(appliance);
    }

    async 가전을_폐기한다(
        id: string,
        householdId: string,
    ): Promise<Appliance | null> {
        const appliance = await this.가전을_단건_조회한다(id, householdId);
        if (!appliance) return null;

        appliance.status = 'retired';
        return this.applianceRepository.save(appliance);
    }

    async 가전을_삭제한다(
        id: string,
        householdId: string,
    ): Promise<boolean> {
        const result = await this.applianceRepository.delete({
            id,
            householdId,
        });
        return (result.affected ?? 0) > 0;
    }
}
