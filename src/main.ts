import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Функция bootstrap - точка входа приложения NestJS
 * Инициализирует сервер и настраивает базовые middleware
 */
async function bootstrap() {
  // Создаем экземпляр NestJS приложения из корневого модуля
  const app = await NestFactory.create(AppModule);

  // Глобальная валидация входящих данных через DTO
  // whitelist: удаляет свойства, не описанные в DTO
  // forbidNonWhitelisted: возвращает ошибку, если есть лишние поля
  // transform: автоматически преобразует типы данных
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS: origin: true отражает origin запроса (подходит для Render и любых доменов)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Порт сервера из переменной окружения или 3000 по умолчанию
  const port = process.env.PORT || 3000;

  // Запускаем сервер на всех сетевых интерфейсах (0.0.0.0)
  // Это позволяет принимать подключения как с localhost, так и с других устройств в локальной сети
  await app.listen(port, '0.0.0.0');

  // Выводим информацию о запущенном сервере
  console.log(`🚀 Server running on http://0.0.0.0:${port}`);
  console.log(`📡 Accessible from local network at http://<your-local-ip>:${port}`);
}

// Запускаем приложение
bootstrap();
