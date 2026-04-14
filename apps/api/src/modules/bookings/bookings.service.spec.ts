import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  const prisma = {
    booking: {
      findUnique: jest.fn(),
    },
  } as any;

  const policiesService = {
    getActiveVersions: jest.fn(),
  } as any;

  const notificationsService = {
    sendBookingConfirmation: jest.fn(),
  } as any;

  const calendarService = {
    upsertBookingEvent: jest.fn(),
  } as any;

  const service = new BookingsService(prisma, policiesService, notificationsService, calendarService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects booking when more than 5 rental items are selected', async () => {
    await expect(
      service.createBooking({
        serviceType: 'RENTAL_FITTING',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        clientPhone: '08000000000',
        startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        timezone: 'Africa/Lagos',
        rentalItemIds: ['1', '2', '3', '4', '5', '6'],
        acceptTerms: true,
        acceptPrivacy: true,
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks cancel when appointment is <=24 hours away', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'b1',
      referenceCode: 'SA-1234',
      managementTokenUsed: false,
      managementTokenHash: 'fake-hash',
      startAtUtc: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    jest.spyOn<any, any>(service as any, 'hashToken').mockReturnValue('fake-hash');

    await expect(
      service.cancelSelfService('SA-1234', {
        token: 'token',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
