"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexTestingModule = void 0;
const common_1 = require("@nestjs/common");
const index_testing_controller_1 = require("./index-testing.controller");
const index_testing_service_1 = require("./index-testing.service");
const prisma_service_1 = require("../prisma.service");
let IndexTestingModule = class IndexTestingModule {
};
exports.IndexTestingModule = IndexTestingModule;
exports.IndexTestingModule = IndexTestingModule = __decorate([
    (0, common_1.Module)({
        controllers: [index_testing_controller_1.IndexTestingController],
        providers: [index_testing_service_1.IndexTestingService, prisma_service_1.PrismaService],
    })
], IndexTestingModule);
//# sourceMappingURL=index-testing.module.js.map