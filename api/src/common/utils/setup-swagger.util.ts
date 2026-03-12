import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const setupSwagger = (app: INestApplication): void => {
    const config = new DocumentBuilder()
        .setTitle('Nest swagger')
        .setDescription('Nest swagger description')
        .setVersion('1.0.0')
        .build();

    const swaggerDocument = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, swaggerDocument);
};
