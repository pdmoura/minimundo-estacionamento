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
  const validSectorPayload = {
    name: 'Setor A',
    location: 'Piso térreo',
    reservableQuota: 20,
    hourlyRate: 10,
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

  it('/api/sectors (GET) retorna a lista de setores em data como array', () => {
    return request(app.getHttpServer())
      .get('/api/sectors')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.data)).toBe(true);
        expect(body).toEqual({
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
  });

  it('/api/sectors (POST) cria um setor com id, createdAt e vagas disponíveis iguais à cota', async () => {
    await request(app.getHttpServer())
      .post('/api/sectors')
      .send(validSectorPayload)
      .expect(201)
      .expect(({ body }) => {
        expect(body.data).toMatchObject({
          id: sectorEntity.id,
          name: sectorEntity.name,
          location: sectorEntity.location,
          reservableQuota: sectorEntity.reservableQuota,
          availableSpots: sectorEntity.reservableQuota,
          hourlyRate: 10,
          createdAt: createdAt.toISOString(),
        });
        expect(body.data.id).toBeDefined();
        expect(body.data.createdAt).toBeDefined();
        expect(body.data.availableSpots).toBe(body.data.reservableQuota);
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

  it('/api/sectors (POST) rejeita name vazio', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({
        ...validSectorPayload,
        name: '',
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos.',
            fields: {
              name: 'O nome é obrigatório.',
            },
          },
        });
      });
  });

  it('/api/sectors (POST) rejeita name somente com espaços', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({ ...validSectorPayload, name: '   ' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
  });

  it('/api/sectors (POST) rejeita location vazio', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({ ...validSectorPayload, location: '' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
  });

  it('/api/sectors (POST) rejeita reservableQuota igual a zero', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({ ...validSectorPayload, reservableQuota: 0 })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos.',
            fields: {
              reservableQuota: 'A cota de reservas deve ser no mínimo 1.',
            },
          },
        });
      });
  });

  it('/api/sectors (POST) rejeita reservableQuota negativo', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({ ...validSectorPayload, reservableQuota: -1 })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
  });

  it('/api/sectors (POST) rejeita reservableQuota decimal', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({ ...validSectorPayload, reservableQuota: 1.5 })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
  });

  it('/api/sectors (POST) rejeita hourlyRate negativo', () => {
    return request(app.getHttpServer())
      .post('/api/sectors')
      .send({ ...validSectorPayload, hourlyRate: -0.01 })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
