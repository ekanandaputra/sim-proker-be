import { PrismaClient, ProgramStatus, ActivityStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ---- Program Categories ----
  const categories = await Promise.all([
    prisma.programCategory.upsert({
      where: { name: 'Penelitian' },
      update: {},
      create: { name: 'Penelitian', description: 'Program penelitian dan riset' },
    }),
    prisma.programCategory.upsert({
      where: { name: 'Pengabdian Masyarakat' },
      update: {},
      create: { name: 'Pengabdian Masyarakat', description: 'Program pengabdian kepada masyarakat' },
    }),
    prisma.programCategory.upsert({
      where: { name: 'Pendidikan' },
      update: {},
      create: { name: 'Pendidikan', description: 'Program peningkatan mutu pendidikan' },
    }),
    prisma.programCategory.upsert({
      where: { name: 'Kerjasama' },
      update: {},
      create: { name: 'Kerjasama', description: 'Program kerjasama institusional' },
    }),
    prisma.programCategory.upsert({
      where: { name: 'SDM' },
      update: {},
      create: { name: 'SDM', description: 'Program pengembangan sumber daya manusia' },
    }),
  ]);

  console.log(`✅ Seeded ${categories.length} program categories`);

  // ---- Sample UUIDs (simulating external users/units) ----
  const sampleUnitId = '00000000-0000-4000-8000-000000000001';
  const samplePicId = '00000000-0000-4000-8000-000000000010';
  const sampleUserId = '00000000-0000-4000-8000-000000000020';

  // ---- Sample Programs ----
  const program1 = await prisma.program.upsert({
    where: { code: 'PRG-2025-001' },
    update: {},
    create: {
      code: 'PRG-2025-001',
      title: 'Program Penelitian Terapan Unggulan',
      description: 'Program penelitian terapan untuk mendorong inovasi teknologi di lingkungan perguruan tinggi.',
      objective: 'Meningkatkan jumlah publikasi ilmiah bereputasi dan paten terdaftar.',
      year: 2025,
      unitId: sampleUnitId,
      categoryId: categories[0].id,
      status: ProgramStatus.IN_PROGRESS,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      budget: 150000000,
      picId: samplePicId,
      createdBy: sampleUserId,
    },
  });

  const program2 = await prisma.program.upsert({
    where: { code: 'PRG-2025-002' },
    update: {},
    create: {
      code: 'PRG-2025-002',
      title: 'Program Pengabdian Masyarakat Desa Binaan',
      description: 'Program pemberdayaan masyarakat desa melalui teknologi tepat guna.',
      objective: 'Meningkatkan kualitas hidup masyarakat desa binaan.',
      year: 2025,
      unitId: sampleUnitId,
      categoryId: categories[1].id,
      status: ProgramStatus.DRAFT,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-11-30'),
      budget: 75000000,
      picId: samplePicId,
      createdBy: sampleUserId,
    },
  });

  const program3 = await prisma.program.upsert({
    where: { code: 'PRG-2025-003' },
    update: {},
    create: {
      code: 'PRG-2025-003',
      title: 'Peningkatan Kompetensi Dosen',
      description: 'Program pelatihan dan sertifikasi untuk peningkatan kompetensi dosen.',
      objective: 'Meningkatkan jumlah dosen bersertifikat internasional.',
      year: 2025,
      unitId: sampleUnitId,
      categoryId: categories[4].id,
      status: ProgramStatus.APPROVED,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-10-31'),
      budget: 200000000,
      picId: samplePicId,
      createdBy: sampleUserId,
    },
  });

  console.log(`✅ Seeded 3 programs`);

  // ---- Sample Activities ----
  const activity1 = await prisma.activity.upsert({
    where: { id: '10000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000001',
      programId: program1.id,
      title: 'Workshop Metodologi Penelitian',
      description: 'Workshop pelatihan metodologi penelitian untuk dosen muda.',
      weight: 30,
      status: ActivityStatus.IN_PROGRESS,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-04-30'),
    },
  });

  const activity2 = await prisma.activity.upsert({
    where: { id: '10000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000002',
      programId: program1.id,
      title: 'Pelaksanaan Penelitian Kolaboratif',
      description: 'Pelaksanaan proyek penelitian bersama dengan mitra industri.',
      weight: 50,
      status: ActivityStatus.NOT_STARTED,
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-10-31'),
    },
  });

  const activity3 = await prisma.activity.upsert({
    where: { id: '10000000-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: '10000000-0000-4000-8000-000000000003',
      programId: program1.id,
      title: 'Seminar Hasil Penelitian',
      description: 'Seminar nasional untuk diseminasi hasil penelitian.',
      weight: 20,
      status: ActivityStatus.NOT_STARTED,
      startDate: new Date('2025-11-01'),
      endDate: new Date('2025-12-15'),
    },
  });

  console.log(`✅ Seeded 3 activities`);

  // ---- Sample Outputs ----
  await Promise.all([
    prisma.output.create({
      data: {
        activityId: activity1.id,
        metricType: 'Participant',
        target: 50,
        realization: 32,
        unit: 'orang',
        description: 'Jumlah peserta workshop',
      },
    }),
    prisma.output.create({
      data: {
        activityId: activity2.id,
        metricType: 'Publication',
        target: 10,
        realization: 0,
        unit: 'artikel',
        description: 'Publikasi jurnal bereputasi',
      },
    }),
    prisma.output.create({
      data: {
        activityId: activity2.id,
        metricType: 'HKI',
        target: 3,
        realization: 0,
        unit: 'paten',
        description: 'Hak Kekayaan Intelektual',
      },
    }),
    prisma.output.create({
      data: {
        activityId: activity3.id,
        metricType: 'Participant',
        target: 100,
        realization: 0,
        unit: 'orang',
        description: 'Peserta seminar',
      },
    }),
  ]);

  console.log(`✅ Seeded 4 outputs`);

  // ---- Sample Progress Logs ----
  await Promise.all([
    prisma.progressLog.create({
      data: {
        activityId: activity1.id,
        progress: 25,
        note: 'Persiapan materi workshop selesai',
        createdBy: sampleUserId,
      },
    }),
    prisma.progressLog.create({
      data: {
        activityId: activity1.id,
        progress: 60,
        note: 'Workshop batch 1 selesai dilaksanakan',
        createdBy: sampleUserId,
      },
    }),
  ]);

  console.log(`✅ Seeded 2 progress logs`);

  // ---- Sample Program Members ----
  await prisma.programMember.createMany({
    data: [
      { programId: program1.id, userId: samplePicId, role: 'PIC' },
      { programId: program1.id, userId: sampleUserId, role: 'MEMBER' },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Seeded 2 program members`);

  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
