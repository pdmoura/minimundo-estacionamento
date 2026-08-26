import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const createdAt = new Date('2026-08-26T13:00:00.000Z');
  const sectorEntity = {
    id: '9c9999e1-d70a-4764-a884-769889aeb960',
    name: 'Setor A',
    location: 'Piso térreo',
    reservableQuota: 20,
    availableSpots: 20,
    hourlyRate: { toNumber: () => 10 },
    createdAt,
  };
  const prismaService = {
    sector: {
      findMany: jest.fn().mockResolvedValue([sectorEntity]),
      create: jest.fn().mockResolvedValue(sectorEntity),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/sectors (GET) retorna a lista de setores', () => {
    return request(app.getHttpServer())
      .get('/api/sectors')
      .expect(200)
      .expect({
        data: [
          {
            id: sectorEntity.id,
            name: sectorEntity.name,
            location: sectorEntity.location,
            reservableQuota: sectorEntity.reservableQuota,
            availableSpots: sectorEntity.availableSpots,
            hourlyRate: 10,
            createdAt: createdAt.toISOString(),
          },
        ],
      });
  });

  it('/api/sectors (POST) cria um setor', async () => {
    await request(app.getHttpServer())
      .post('/api/sectors')
      .send({
        name: 'Setor A',
        location: 'Piso térreo',
        reservableQuota: 20,
        hourlyRate: 10,
      })
      .expect(201)
      .expect({
        data: {
          id: sectorEntity.id,
          name: sectorEntity.name,
          location: sectorEntity.location,
          reservableQuota: sectorEntity.reservableQuota,
          availableSpots: sectorEntity.availableSpots,
          hourlyRate: 10,
          createdAt: createdAt.toISOString(),
        },
      });

    expect(prismaService.sector.create).toHaveBeenCalledWith({
      data: {
        name: 'Setor A',
        location: 'Piso térreo',
        reservableQuota: 20,
        availableSpots: 20,
        hourlyRate: 10,
      },
    });
  });

  it('/api/sectors (POST) retorna erro padronizado para payload inválido', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({
        name: '',
        location: 'Piso térreo',
        reservableQuota: -1,
        hourlyRate: 10,
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos.',
            fields: {
              name: 'O nome é obrigatório.',
              reservableQuota: 'A cota de reservas não pode ser negativa.',
            },
          },
        });
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
