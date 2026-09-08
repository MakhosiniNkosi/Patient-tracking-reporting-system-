"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const patterns = (process.env.CORS_ORIGINS || 'http://localhost:*')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    const originMatchers = patterns.map((pattern) => {
        if (!pattern.includes('*'))
            return pattern;
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        return new RegExp(`^${escaped}$`);
    });
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            const allowed = originMatchers.some((m) => typeof m === 'string' ? m === origin : m.test(origin));
            callback(null, allowed);
        },
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(process.env.PORT || 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map