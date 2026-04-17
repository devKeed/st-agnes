import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns a health payload', () => {
      const result = appController.getHello();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('st-agnes-backend');
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
