import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding KHADIJA-TUL-QUBRAH BY Meer&Mus Database ---');

  // 1. Seed Brand Configuration
  const existingBrand = await prisma.brand.findFirst();
  let brand = existingBrand;
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        officialName: 'KHADIJA-TUL-QUBRAH BY Meer&Mus',
        primaryDisplay: 'KHADIJA-TUL-QUBRAH',
        secondarySignature: 'BY Meer&Mus',
        primaryColor: '#072A20', // Deep Emerald Green
        secondaryColor: '#C5A059', // Champagne Gold
        accentColor: '#FCFBF7', // Ivory Cream
        supportEmail: 'concierge@khadijatulqubrah.com',
        supportPhone: '+92 42 35789000',
        whatsappNumber: '+92 300 0000000',
        isActive: true,
      },
    });
    console.log('✓ Brand configuration initialized');
  }

  // 2. Seed Brand Assets
  const assetCount = await prisma.brandAsset.count();
  if (assetCount === 0 && brand) {
    await prisma.brandAsset.createMany({
      data: [
        {
          brandId: brand.id,
          assetType: 'LOGO_PRIMARY',
          storageKey: 'brand/khadijatulqubrah-logo-cream.jpg',
          cdnUrl: '/assets/brand/khadijatulqubrah-logo-cream.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 245000,
        },
        {
          brandId: brand.id,
          assetType: 'LOGO_ON_VELVET',
          storageKey: 'brand/khadijatulqubrah-logo-velvet.jpg',
          cdnUrl: '/assets/brand/khadijatulqubrah-logo-velvet.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 312000,
        },
      ],
    });
    console.log('✓ Brand logo assets linked');
  }

  // 3. Seed Users for All Internal and External Roles
  const passwordHash = await bcrypt.hash('KhadijaSecure2026!', 10);

  const seedUsers = [
    {
      email: 'superadmin@khadijatulqubrah.com',
      phoneNumber: '+923001000001',
      firstName: 'Chief',
      lastName: 'Architect',
      role: UserRole.SUPER_ADMIN,
    },
    {
      email: 'admin@khadijatulqubrah.com',
      phoneNumber: '+923001000002',
      firstName: 'Operations',
      lastName: 'Director',
      role: UserRole.ADMIN,
    },
    {
      email: 'agent.fatima@khadijatulqubrah.com',
      phoneNumber: '+923001000003',
      firstName: 'Fatima',
      lastName: 'Bibi',
      role: UserRole.AGENT,
    },
    {
      email: 'designer.zainab@khadijatulqubrah.com',
      phoneNumber: '+923001000004',
      firstName: 'Zainab',
      lastName: 'Meer',
      role: UserRole.DESIGNER,
    },
    {
      email: 'production.iqbal@khadijatulqubrah.com',
      phoneNumber: '+923001000005',
      firstName: 'Master',
      lastName: 'Iqbal',
      role: UserRole.PRODUCTION,
    },
    {
      email: 'sarah.customer@example.com',
      phoneNumber: '+923001000006',
      firstName: 'Sarah',
      lastName: 'Khan',
      role: UserRole.CUSTOMER,
    },
  ];

  for (const u of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          ...u,
          passwordHash,
          isActive: true,
          isVerified: true,
        },
      });

      if (u.role === UserRole.AGENT) {
        await prisma.agentProfile.create({
          data: {
            userId: created.id,
            department: 'VIP_CLIENTELE',
            maxActiveLeads: 25,
            currentActiveLeads: 0,
            commissionRate: 3.5,
          },
        });
      } else if (u.role === UserRole.CUSTOMER) {
        await prisma.customerProfile.create({
          data: {
            userId: created.id,
            preferredCurrency: 'PKR',
            standardMeasurements: {
              bust: 36,
              waist: 28,
              hips: 38,
              shoulder: 14.5,
              shirtLength: 44,
              sleeveLength: 22,
            },
          },
        });
      }
      console.log(`✓ Created user: ${u.email} [${u.role}]`);
    }
  }

  // 4. Seed Categories
  const categoriesData = [
    {
      name: 'Haute Couture Bridal',
      slug: 'haute-couture-bridal',
      description: 'Handcrafted heirloom bridal ensembles embellished with gold zardozi, crystals, and fine pearls.',
      displayOrder: 1,
    },
    {
      name: 'Luxury Formal Pret',
      slug: 'luxury-formal-pret',
      description: 'Opulent evening and wedding guest attire crafted from pure katan silks and velvets.',
      displayOrder: 2,
    },
    {
      name: 'Bespoke Custom Creations',
      slug: 'bespoke-custom-creations',
      description: 'Made-to-order couture tailored precisely to client sketches, measurements, and fabric selections.',
      displayOrder: 3,
    },
    {
      name: 'Handcrafted Shawls & Dupattas',
      slug: 'handcrafted-shawls',
      description: 'Statement velvet and organza dupattas with heritage borders and scalloped cutwork.',
      displayOrder: 4,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✓ Master categories initialized');

  // 5. Seed Colours
  const coloursData = [
    { name: 'Emerald Velvet Green', hexCode: '#072A20', description: 'Signature deep emerald velvet' },
    { name: 'Champagne Royal Gold', hexCode: '#C5A059', description: 'Antique metallic champagne gold' },
    { name: 'Royal Crimson Red', hexCode: '#841B2D', description: 'Heritage Mughal bridal red' },
    { name: 'Midnight Navy Blue', hexCode: '#0A192F', description: 'Deep starry night navy' },
    { name: 'Ivory Pearl', hexCode: '#FCFBF7', description: 'Pure lustrous ivory' },
    { name: 'Dusky Plum', hexCode: '#4A2545', description: 'Sophisticated jewel-tone plum' },
  ];

  for (const col of coloursData) {
    const existing = await prisma.colour.findFirst({ where: { name: col.name } });
    if (!existing) {
      await prisma.colour.create({ data: col });
    }
  }
  console.log('✓ Master colours initialized');

  // 6. Seed Sizes
  const sizesData = [
    { name: 'Extra Small', code: 'XS', sortOrder: 1 },
    { name: 'Small', code: 'S', sortOrder: 2 },
    { name: 'Medium', code: 'M', sortOrder: 3 },
    { name: 'Large', code: 'L', sortOrder: 4 },
    { name: 'Extra Large', code: 'XL', sortOrder: 5 },
    { name: 'Custom Measurements', code: 'CUSTOM', sortOrder: 6 },
  ];

  for (const s of sizesData) {
    const existing = await prisma.size.findFirst({ where: { code: s.code } });
    if (!existing) {
      await prisma.size.create({ data: s });
    }
  }
  console.log('✓ Master sizes initialized');

  // 7. Seed Fabrics
  const fabricsData = [
    {
      name: 'Micro Velvet 9000',
      description: 'Plush, dense-pile imported velvet with a regal sheen, ideal for winter formals and bridal jackets.',
      basePricePerMeter: 6500,
    },
    {
      name: 'Pure Katan Silk',
      description: 'Lustrous, durable pure silk woven with fine yarns for structured peshwas and formal trousers.',
      basePricePerMeter: 4800,
    },
    {
      name: 'Pure French Organza',
      description: 'Crisp, feather-light translucent silk organza perfect for voluminous dupattas and layered sleeves.',
      basePricePerMeter: 3200,
    },
    {
      name: 'Handloom Jamawar',
      description: 'Traditional brocade woven with metallic gold zari motifs.',
      basePricePerMeter: 5500,
    },
    {
      name: 'Crinkle Chiffon',
      description: 'Soft, flowing chiffon with delicate pebble texture, graceful for floor-length lehengas.',
      basePricePerMeter: 2800,
    },
  ];

  for (const f of fabricsData) {
    const existing = await prisma.fabric.findFirst({ where: { name: f.name } });
    if (!existing) {
      await prisma.fabric.create({ data: f });
    }
  }
  console.log('✓ Master fabrics initialized');

  // 8. Seed Craft Options
  const craftsData = [
    {
      name: 'Zardozi & Dabka Hand Embellishment',
      craftCategory: 'EMBROIDERY',
      description: 'Three-dimensional gold wire work with kora, dabka, sequins, and micro-pearls.',
      estimatedDays: 21,
    },
    {
      name: 'Resham Silk Needlework',
      craftCategory: 'EMBROIDERY',
      description: 'Shaded floral needle painting using pure Mulberry silk threads.',
      estimatedDays: 14,
    },
    {
      name: 'Artisanal Crochet & Scalloped Edging',
      craftCategory: 'HANDWORK',
      description: 'Fine handmade cotton and silk crochet lace borders handcrafted by master artisans.',
      estimatedDays: 7,
    },
    {
      name: 'Gotta Patti & Appliqué Craft',
      craftCategory: 'HANDWORK',
      description: 'Traditional Rajasthan gold and silver ribbon appliqué with mirror accents.',
      estimatedDays: 10,
    },
    {
      name: 'Hand Block Printing with Gold Foil',
      craftCategory: 'PRINTING',
      description: 'Carved rosewood block printing using artisanal pigments and gold leaf.',
      estimatedDays: 5,
    },
  ];

  for (const c of craftsData) {
    const existing = await prisma.craftOption.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.craftOption.create({ data: c });
    }
  }
  console.log('✓ Master craft options initialized');

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
