import { webcrypto } from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as unknown as Crypto;
}
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { json } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  app.useStaticAssets(join(__dirname, '..', 'public/images'), {
    prefix: '/public/images/',
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({
    origin: '*',
  });
  app.use(
    '/Deposit/webhook',
    json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  
  app.use(
	  '/.well-known',
	  express.static(join(__dirname, '..', 'public', '.well-known'), {
		setHeaders: (res, filePath) => {
		  if (
			filePath.endsWith('apple-app-site-association') ||
			filePath.endsWith('assetlinks.json')
		  ) {
			res.setHeader('Content-Type', 'application/json');
		  }
		  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
		},
	  }),
	);

  const config = new DocumentBuilder()
    .setTitle('Kafel')
    .addTag('kafel')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  
  //const configService = app.get(ConfigService);
  //const port = configService.get<number>('PORT') || 3000;
  await app.listen(3000,'0.0.0.0');
}
bootstrap();
