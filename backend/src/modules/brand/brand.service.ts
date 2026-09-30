import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getBrandConfig() {
    try {
      let brand = await this.prisma.brand.findFirst({
        include: {
          assets: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!brand) {
        brand = await this.prisma.brand.create({
          data: {
            officialName: this.configService.get<string>(
              'BRAND_NAME',
              'KHADIJA-TUL-QUBRAH BY Meer&Mus',
            ),
            primaryDisplay: this.configService.get<string>(
              'BRAND_PRIMARY_DISPLAY',
              'KHADIJA-TUL-QUBRAH',
            ),
            secondarySignature: this.configService.get<string>(
              'BRAND_SECONDARY_SIGNATURE',
              'BY Meer&Mus',
            ),
            primaryColor: this.configService.get<string>(
              'BRAND_PRIMARY_COLOR',
              '#072A20',
            ),
            secondaryColor: this.configService.get<string>(
              'BRAND_SECONDARY_COLOR',
              '#C5A059',
            ),
          },
          include: {
            assets: true,
          },
        }) as any;
      }

      if (brand) return brand;
    } catch (_) {}

    return {
      id: 'default-brand-id',
      officialName: this.configService.get<string>(
        'BRAND_NAME',
        'KHADIJA-TUL-QUBRAH BY Meer&Mus',
      ),
      primaryDisplay: this.configService.get<string>(
        'BRAND_PRIMARY_DISPLAY',
        'KHADIJA-TUL-QUBRAH',
      ),
      secondarySignature: this.configService.get<string>(
        'BRAND_SECONDARY_SIGNATURE',
        'BY Meer&Mus',
      ),
      primaryColor: this.configService.get<string>('BRAND_PRIMARY_COLOR', '#072A20'),
      secondaryColor: this.configService.get<string>('BRAND_SECONDARY_COLOR', '#C5A059'),
      accentColor: '#FCFBF7',
      supportEmail: 'concierge@khadijatulqubrah.com',
      isActive: true,
      assets: [],
    };
  }

  async updateBrandConfig(dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findFirst();
    if (!brand) {
      throw new NotFoundException('Brand configuration not found');
    }

    return this.prisma.brand.update({
      where: { id: brand.id },
      data: dto,
      include: { assets: true },
    });
  }

  async addBrandAsset(data: {
    assetType: string;
    storageKey: string;
    cdnUrl: string;
    mimeType: string;
    fileSizeBytes: number;
  }) {
    const brand = await this.getBrandConfig();

    return this.prisma.brandAsset.create({
      data: {
        brandId: brand.id,
        assetType: data.assetType,
        storageKey: data.storageKey,
        cdnUrl: data.cdnUrl,
        mimeType: data.mimeType,
        fileSizeBytes: BigInt(data.fileSizeBytes),
      },
    });
  }
}
