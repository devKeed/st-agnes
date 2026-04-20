"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const upload_module_1 = require("./modules/upload/upload.module");
const rentals_module_1 = require("./modules/rentals/rentals.module");
const gallery_module_1 = require("./modules/gallery/gallery.module");
const content_module_1 = require("./modules/content/content.module");
const terms_module_1 = require("./modules/terms/terms.module");
const availability_module_1 = require("./modules/availability/availability.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const calendar_module_1 = require("./modules/calendar/calendar.module");
const email_module_1 = require("./modules/email/email.module");
const guards_1 = require("./common/guards");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, cache: true }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            upload_module_1.UploadModule,
            rentals_module_1.RentalsModule,
            gallery_module_1.GalleryModule,
            content_module_1.ContentModule,
            terms_module_1.TermsModule,
            availability_module_1.AvailabilityModule,
            bookings_module_1.BookingsModule,
            calendar_module_1.CalendarModule,
            email_module_1.EmailModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: guards_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: guards_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map