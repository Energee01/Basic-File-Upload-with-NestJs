import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';
import * as fs from 'node:fs';
import * as path from 'node:path';


async function bootstrap() {

  const uploadDirectory = path.join(__dirname, '..', 'uploads');
  if(!fs.existsSync(uploadDirectory)){
    fs.mkdirSync(uploadDirectory)
  }
  
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
