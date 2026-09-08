import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Flutter web runs from a browser origin, so CORS must be explicit.
  // CORS_ORIGINS is a comma-separated list of patterns; "*" inside an
  // entry is treated as a wildcard (e.g. "http://localhost:*" matches any
  // localhost port), since the underlying `cors` package only does exact
  // string or RegExp matches — a literal "*" in a plain string never
  // matches a real origin.
  const patterns = (process.env.CORS_ORIGINS || 'http://localhost:*')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const originMatchers = patterns.map((pattern) => {
    if (!pattern.includes('*')) return pattern; // exact match, e.g. prod domain
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser clients (curl, mobile)
      const allowed = originMatchers.some((m) =>
        typeof m === 'string' ? m === origin : m.test(origin),
      );
      callback(null, allowed);
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
